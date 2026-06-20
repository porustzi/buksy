/**
 * @module order
 * Generic order endpoint (non-Monobank payments).
 * Flow: validate → save → stock decrease (sync!) → notifications (fire-and-forget)
 */
var { esc, sanitize, sanitizeShippingInfo, guard, validateItems, validateEmail, validateIdempotencyKey, validatePaymentMethod, parseBody, generateOrderId } = require('./_utils');
var { saveOrder, decreaseStockBulk, getOrderByIdempotencyKey } = require('./_supabase');
var { validateCatalogItems, getCatalogStock } = require('./_catalog');
var { sendEmail, orderConfirmationHtml } = require('./_email');
var { RATE_LIMIT, FIELD_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } = require('./_constants');
var { DuplicateOrderError } = require('./_errors');

// ============================================================================
// Handler
// ============================================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  var blocked = guard(event, RATE_LIMIT.CHECKOUT);
  if (blocked) return blocked;

  var parsed = parseBody(event, RATE_LIMIT.CHECKOUT ? 65536 : 65536);
  if (parsed.error) return { statusCode: 400, body: JSON.stringify({ error: parsed.error }) };
  var body = parsed.data;

  try {
    var items = body.items;
    var shippingInfo = body.shippingInfo;
    var paymentMethod = body.paymentMethod;
    var idempotencyKey = body.idempotencyKey;

    validateItems(items);
    if (!shippingInfo || typeof shippingInfo !== 'object') return { statusCode: 400, body: JSON.stringify({ error: 'Shipping info is required' }) };
    validateIdempotencyKey(idempotencyKey);
    paymentMethod = validatePaymentMethod(paymentMethod);

    var shipping = sanitizeShippingInfo(shippingInfo);
    var safeEmail = sanitize(String(shippingInfo.email || ''), FIELD_LIMITS.EMAIL);
    if (!safeEmail || !validateEmail(safeEmail)) return { statusCode: 400, body: JSON.stringify({ error: 'Valid email is required' }) };

    // Validate items against catalog + DB
    var safeItems = await validateCatalogItems(items, 'order');
    var orderId = generateOrderId();
    var total = safeItems.reduce(function (s, i) { return s + i.pricePerUnit * i.quantity; }, 0);

    // Save order
    try {
      await saveOrder({
        order_id: orderId, idempotency_key: idempotencyKey || null,
        status: paymentMethod === PAYMENT_METHOD.MONOBANK ? ORDER_STATUS.AWAITING_PAYMENT : ORDER_STATUS.NEW,
        payment_method: paymentMethod || PAYMENT_METHOD.CARD,
        customer: { firstName: shipping.firstName, lastName: shipping.lastName, email: safeEmail, phone: shipping.phone },
        shipping: { address: shipping.address, apartment: shipping.apartment, city: shipping.city, country: shipping.country, postalCode: shipping.postalCode, novaPoshtaBranch: shipping.novaPoshtaBranch },
        items: safeItems.map(function (i) { return { slug: i.product.slug, name: i.product.name, size: i.size, price: i.pricePerUnit, qty: i.quantity }; }),
        subtotal: total, shipping_cost: 0, tax: 0, total: total, created_at: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof DuplicateOrderError) {
        var existing = await getOrderByIdempotencyKey(idempotencyKey);
        if (existing) return { statusCode: 200, body: JSON.stringify({ success: true, orderId: existing.order_id, total: Number(existing.total), message: 'Order already placed' }) };
        return { statusCode: 409, body: JSON.stringify({ error: 'Order already processed' }) };
      }
      console.error('Save order failed:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Не вдалося створити замовлення' }) };
    }

    // Stock decrease — MUST succeed (sync, not fire-and-forget)
    if (paymentMethod !== PAYMENT_METHOD.MONOBANK) {
      try {
        await decreaseStockBulk(safeItems.map(function (i) {
          return { slug: i.product.slug, qty: i.quantity, default_stock: getCatalogStock(i.product.slug) };
        }));
      } catch (err) {
        console.error('Stock decrease failed:', err.message);
        return { statusCode: 409, body: JSON.stringify({ error: 'Insufficient stock', orderId: orderId }) };
      }
    }

    // Telegram notification (fire-and-forget)
    var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    var CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (TOKEN && CHAT_ID) {
      var itemsList = safeItems.map(function (i) {
        return '   ' + i.quantity + '\u00d7 ' + esc(i.product.name) + ' (' + esc(i.size) + ') \u2014 ' + (i.pricePerUnit * i.quantity).toFixed(0) + ' \u20B4';
      }).join('\n');
      var tgMsg = [
        '\uD83D\uDED2 <b>НОВЕ ЗАМОВЛЕННЯ</b>', '<code>#' + orderId + '</code>', '',
        '<b>\uD83D\uDC64 Клієнт</b>', '   ' + esc(shipping.firstName) + ' ' + esc(shipping.lastName), '   ' + esc(safeEmail),
        shipping.phone ? '   ' + esc(shipping.phone) : '', '',
        '<b>\uD83D\uDCCD Доставка</b>', '   ' + esc(shipping.address) + (shipping.apartment ? ', ' + esc(shipping.apartment) : ''), '   ' + esc(shipping.city) + ', ' + esc(shipping.country) + ', ' + esc(shipping.postalCode),
        shipping.novaPoshtaBranch ? '   \u041D\u041F \u2116' + esc(shipping.novaPoshtaBranch) : '', '',
        '<b>\uD83D\uDED2 Товари</b>', itemsList, '',
        '\uD83D\uDCB3 \u041E\u043F\u043B\u0430\u0442\u0430',
        '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
        '\u{1F4B0} <b>' + total.toFixed(0) + ' \u20B4</b>',
      ].filter(Boolean).join('\n');
      fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
      }).catch(function (err) { console.error('Telegram notify failed:', err.message); });
    }

    // Email (fire-and-forget)
    if (safeEmail) {
      sendEmail({
        to: safeEmail,
        subject: '\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + orderId + ' \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E \u2014 BUKSY',
        html: orderConfirmationHtml({ orderId: orderId, items: safeItems, total: total, shippingInfo: shipping }),
      }).catch(function (err) { console.error('Email failed:', err.message); });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, orderId: orderId, total: total, message: 'Order placed successfully!' }) };
  } catch (e) {
    if (e.statusCode) return e;
    console.error('order error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
