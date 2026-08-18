import { guard, esc, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, parseBody, generateOrderId, okResponse, errorResponse } from '../lib/utils.js';
import { saveOrder } from '../lib/supabase.js';
import { validateCatalogItems } from '../lib/catalog.js';
import { getSettings } from '../lib/settings.js';
import { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } from '../lib/constants.js';
import { DuplicateOrderError, ValidationError } from '../lib/errors.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');

  const blocked = guard(request, env, RATE_LIMIT.CHECKOUT);
  if (blocked) return blocked;

  let parsed = await parseBody(request, ORDER_LIMITS.MAX_BODY_SIZE);
  if (parsed.error) return errorResponse(400, parsed.error);
  const body = parsed.data;

  try {
    const { items, shippingInfo } = body;
    const idempotencyKey = body.idempotencyKey || ('auto-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
    const pm = PAYMENT_METHOD.CARD;

    if (body.paymentMethod === PAYMENT_METHOD.MONOBANK) {
      return errorResponse(400, 'Use /api/monobank-checkout for Monobank payments');
    }

    validateItems(items);
    if (!shippingInfo || typeof shippingInfo !== 'object') return errorResponse(400, 'Shipping info required');
    validateIdempotencyKey(idempotencyKey);

    const shipping = sanitizeShippingInfo(shippingInfo);
    const safeEmail = (typeof shippingInfo.email === 'string' ? shippingInfo.email : '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.EMAIL).trim();
    if (!safeEmail || !validateEmail(safeEmail)) return errorResponse(400, 'Valid email required');

    const safeItems = await validateCatalogItems(env, items, 'order');
    const orderId = generateOrderId();
    const subtotal = safeItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
    const settings = await getSettings(env);
    const deliveryCost = Number(settings.deliveryCost) || 0;
    const total = subtotal + deliveryCost;

    try {
      await saveOrder(env, {
        order_id: orderId, idempotency_key: idempotencyKey || null,
        status: ORDER_STATUS.NEW, payment_method: pm,
        customer: { firstName: shipping.firstName, lastName: shipping.lastName, email: safeEmail, phone: shipping.phone },
        shipping: { address: shipping.address, apartment: shipping.apartment, city: shipping.city, country: shipping.country, postalCode: shipping.postalCode, novaPoshtaBranch: shipping.novaPoshtaBranch },
        items: safeItems.map(i => ({ slug: i.product.slug, name: i.product.name, size: i.size, price: i.pricePerUnit, qty: i.quantity })),
        subtotal, shipping_cost: deliveryCost, tax: 0, total, created_at: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof DuplicateOrderError) return errorResponse(409, 'Order already processed');
      console.error('saveOrder:', err.message);
      return errorResponse(500, 'Не вдалося створити замовлення');
    }

    return okResponse({ success: true, orderId, total, message: 'Order placed!' });
  } catch (e) {
    if (e instanceof ValidationError) return errorResponse(400, e.message);
    if (e.statusCode) return new Response(e.body, { status: e.statusCode, headers: { 'Content-Type': 'application/json' } });
    console.error('order:', e.name, e.message, e.code || '');
    return errorResponse(500, 'Internal server error');
  }
}
