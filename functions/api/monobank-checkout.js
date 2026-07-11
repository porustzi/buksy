import { guard, esc, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, parseBody, generateOrderId, okResponse, errorResponse, jsonResponse } from '../_lib/utils.js';
import { saveOrder, getOrderByIdempotencyKey } from '../_lib/supabase.js';
import { validateCatalogItems } from '../_lib/catalog.js';
import { sendEmail, orderConfirmationHtml } from '../_lib/email.js';
import { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } from '../_lib/constants.js';
import { DuplicateOrderError, ValidationError } from '../_lib/errors.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');

  const blocked = guard(request, env, RATE_LIMIT.CHECKOUT);
  if (blocked) return blocked;

  let parsed = await parseBody(request, ORDER_LIMITS.MAX_BODY_SIZE);
  if (parsed.error) return errorResponse(400, parsed.error);
  const body = parsed.data;

  try {
    const { items, shippingInfo, email } = body;
    const idempotencyKey = body.idempotencyKey || ('auto-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));

    validateItems(items);
    if (email && !validateEmail(email)) return errorResponse(400, 'Invalid email');
    validateIdempotencyKey(idempotencyKey);

    const shipping = sanitizeShippingInfo(shippingInfo || {});
    const safeEmail = (typeof email === 'string' ? email : '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.EMAIL).trim();
    const orderId = generateOrderId();

    // Validate items
    const validatedItems = await validateCatalogItems(env, items, 'monobank');
    const serverTotal = validatedItems.reduce((s, i) => s + i.price * i.qty, 0);

    // Save order
    const orderRecord = {
      order_id: orderId, idempotency_key: idempotencyKey || null,
      status: ORDER_STATUS.AWAITING_PAYMENT, payment_method: PAYMENT_METHOD.MONOBANK,
      customer: { email: safeEmail, firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone },
      shipping: { address: shipping.address, apartment: shipping.apartment, city: shipping.city, country: shipping.country, postalCode: shipping.postalCode, novaPoshtaBranch: shipping.novaPoshtaBranch },
      items: validatedItems.map(i => ({ slug: i.slug, name: i.name, size: i.size, price: i.price, qty: i.qty })),
      shipping_cost: 0, tax: 0, subtotal: serverTotal, total: serverTotal, created_at: new Date().toISOString(),
    };

    try {
      await saveOrder(env, orderRecord);
    } catch (err) {
      if (err instanceof DuplicateOrderError) {
        const existing = await getOrderByIdempotencyKey(env, idempotencyKey);
        if (existing) {
          const SITE_URL = env.URL || env.SITE_URL || '';
          return existing.status === ORDER_STATUS.AWAITING_PAYMENT
            ? okResponse({ redirectUrl: SITE_URL + '/checkout?orderId=' + existing.order_id, orderId: existing.order_id })
            : errorResponse(409, 'Order already processed');
        }
      }
      console.error('saveOrder:', err.message);
      return errorResponse(500, 'Не вдалося створити замовлення');
    }

    // Create Monobank invoice
    const TOKEN = env.MONOBANK_TOKEN;
    const SITE_URL = env.URL || env.SITE_URL || '';
    if (!TOKEN) return errorResponse(500, 'Monobank не налаштовано');
    if (!SITE_URL) return errorResponse(500, 'SITE_URL not set');

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

    if (!monoRes.ok) return errorResponse(502, 'Монобанк: помилка ' + monoRes.status);
    const monoData = await monoRes.json();

    // Notifications (fire-and-forget)
    const tgToken = env.TELEGRAM_BOT_TOKEN, tgChat = env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
      const lines = validatedItems.map(i => i.qty + '× ' + i.name + (i.size ? ' (' + i.size + ')' : '') + ' — ' + (i.price * i.qty) + ' ₴').join('\n');
      const tgMsg = `🛒 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n<code>#${orderId}</code>\n\n👤 <b>${esc(shipping.firstName || '-')} ${esc(shipping.lastName || '')}</b>\n📧 ${esc(safeEmail || '-')}\n${shipping.phone ? '📱 ' + esc(shipping.phone) + '\n' : ''}\n📍 ${esc(shipping.city || '-')}, ${esc(shipping.country || '-')}\n🚚 ${esc(shipping.address || '-')}${shipping.apartment ? ', ' + esc(shipping.apartment) : ''}\n${shipping.novaPoshtaBranch ? '📦 НП №' + esc(shipping.novaPoshtaBranch) + '\n' : ''}\n<b>Товари:</b>\n${lines}\n\n━━━━━━━━━━━━\n💰 <b>${serverTotal} ₴</b>  |  💳 Monobank\n⏳ Очікує оплати`;
      fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: tgChat, text: tgMsg, parse_mode: 'HTML' }) }).catch(e => console.error('[TG]', e.message));
    }
    let emailOk = false;
    if (safeEmail) {
      emailOk = await sendEmail(env, { to: safeEmail, subject: 'Замовлення #' + orderId + ' отримано — BUKSY', html: orderConfirmationHtml({ orderId, items: validatedItems.map(i => ({ product: { name: i.name, price: i.price }, size: i.size, quantity: i.qty })), total: serverTotal, shippingInfo: shipping }) }).catch(e => { console.error('[EMAIL] send failed:', e.message); return false; });
    }

    return okResponse({ redirectUrl: monoData.pageUrl, orderId, emailSent: emailOk });
  } catch (e) {
    if (e instanceof ValidationError) return errorResponse(400, e.message);
    if (e.statusCode) return new Response(e.body, { status: e.statusCode, headers: { 'Content-Type': 'application/json' } });
    console.error('monobank-checkout:', e.name, e.message, e.code || '');
    return errorResponse(500, 'Internal server error');
  }
}
