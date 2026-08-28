import { guard, esc, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, parseBody, generateOrderId, okResponse, errorResponse, jsonResponse, sendTg } from '../lib/utils.js';
import { saveOrder, getOrderByIdempotencyKey } from '../lib/supabase.js';
import { validateCatalogItems } from '../lib/catalog.js';
import { getSettings } from '../lib/settings.js';
import { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } from '../lib/constants.js';
import { DuplicateOrderError, ValidationError } from '../lib/errors.js';

export async function onRequest(context) {
  try {
    const { request, env, waitUntil } = context;
    if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');

    const blocked = guard(request, env, RATE_LIMIT.CHECKOUT);
    if (blocked) return blocked;

    let parsed = await parseBody(request, ORDER_LIMITS.MAX_BODY_SIZE);
    if (parsed.error) return errorResponse(400, parsed.error);
    const body = parsed.data;

    const { items, shippingInfo, email } = body;
    const idempotencyKey = body.idempotencyKey || ('auto-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));

    validateItems(items);
    if (email && !validateEmail(email)) return errorResponse(400, 'Invalid email');
    validateIdempotencyKey(idempotencyKey);

    const shipping = sanitizeShippingInfo(shippingInfo || {});
    const safeEmail = (typeof email === 'string' ? email : '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.EMAIL).trim();
    const orderId = generateOrderId();

    const validatedItems = await validateCatalogItems(env, items, 'monobank');
    const serverTotal = validatedItems.reduce((s, i) => s + i.price * i.qty, 0);

    const settings = await getSettings(env);
    const deliveryCost = Number(settings.deliveryCost) || 0;
    const total = serverTotal + deliveryCost;

    const orderRecord = {
      order_id: orderId, idempotency_key: idempotencyKey || null,
      status: ORDER_STATUS.AWAITING_PAYMENT, payment_method: PAYMENT_METHOD.MONOBANK,
      customer: { email: safeEmail, firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone },
      shipping: { address: shipping.address, apartment: shipping.apartment, city: shipping.city, country: shipping.country, postalCode: shipping.postalCode, novaPoshtaBranch: shipping.novaPoshtaBranch },
      items: validatedItems.map(i => ({ slug: i.slug, name: i.name, size: i.size, price: i.price, qty: i.qty })),
      shipping_cost: deliveryCost, tax: 0, subtotal: serverTotal, total: total, created_at: new Date().toISOString(),
    };

    try {
      await saveOrder(env, orderRecord);
    } catch (err) {
      if (err instanceof DuplicateOrderError) {
        const existing = await getOrderByIdempotencyKey(env, idempotencyKey);
        if (existing) {
          const SITE_URL = env.SITE_URL || env.URL || '';
          return existing.status === ORDER_STATUS.AWAITING_PAYMENT
            ? okResponse({ redirectUrl: SITE_URL + '/checkout?orderId=' + existing.order_id, orderId: existing.order_id })
            : errorResponse(409, 'Order already processed');
        }
      }
      return jsonResponse(500, { error: 'saveOrder failed', detail: String(err.message || err), code: err.code || '', type: err.constructor?.name || '' });
    }

    const TOKEN = env.MONOBANK_TOKEN;
    const SITE_URL = env.SITE_URL || env.URL || '';
    if (!TOKEN) return errorResponse(500, 'Monobank token not configured');
    if (!SITE_URL) return errorResponse(500, 'SITE_URL not configured');

    const monoRes = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Token': TOKEN },
      body: JSON.stringify({
        amount: Math.round(serverTotal * 100), ccy: PAYMENT.CCY,
        merchantPaymInfo: { reference: orderId, destination: 'Замовлення #' + orderId + ' — BUKSY', basketOrder: validatedItems.map(i => ({ name: i.name + (i.size ? ' (' + i.size + ')' : ''), qty: i.qty, sum: Math.round(i.price * i.qty * 100), icon: '', unit: 'шт.', code: i.slug })) },
        redirectUrl: SITE_URL + '/checkout?orderId=' + orderId,
        webHookUrl: SITE_URL + '/api/monobank-callback',
        validity: PAYMENT.INVOICE_VALIDITY, paymentType: 'debit',
      }),
    });

    if (!monoRes.ok) {
      const monoErr = await monoRes.text().catch(() => '');
      return jsonResponse(502, { error: 'Monobank error', detail: monoRes.status + ': ' + monoErr.slice(0, 200) });
    }
    const monoData = await monoRes.json();

    const tgToken = env.TELEGRAM_BOT_TOKEN;
    if (tgToken) {
      const cust = orderRecord.customer || {};
      const items = orderRecord.items || [];
      const itemsLines = items.map(i => `${i.qty}× ${i.name}${i.size ? ' (' + i.size + ')' : ''} — ${i.price}₴`).join('\n');
      waitUntil(sendTg(env, `🆕 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n<code>#${orderId}</code>\n\n👤 <b>${esc(cust.firstName || '')} ${esc(cust.lastName || '')}</b>\n📞 ${esc(cust.phone || '—')}\n📧 ${esc(cust.email || '—')}\n\n💰 Очікує оплату: <b>${total.toFixed(0)} UAH</b>\n💸 Доставка: ${deliveryCost} ₴\n\n🛍 <b>Товари:</b>\n${itemsLines}`));
    }

    return okResponse({ redirectUrl: monoData.pageUrl, orderId });
  } catch (e) {
    const detail = (e.name || 'Error') + ': ' + (e.message || String(e)) + (e.code ? ' [' + e.code + ']' : '');
    return jsonResponse(500, { error: 'Internal server error', detail: detail });
  }
}
