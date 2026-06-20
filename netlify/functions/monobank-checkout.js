/**
 * @module monobank-checkout
 * Monobank invoice creation endpoint.
 * Flow: validate → save order → create invoice → fire-and-forget notifications
 */
var { guard, esc, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, parseBody, generateOrderId } = require('./_utils');
var { saveOrder, getOrderByIdempotencyKey } = require('./_supabase');
var { validateCatalogItems, getCatalogStock } = require('./_catalog');
var { sendEmail, orderConfirmationHtml } = require('./_email');
var { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } = require('./_constants');
var { DuplicateOrderError } = require('./_errors');

// ============================================================================
// Order Record Builder
// ============================================================================

function createOrderRecord(orderId, idempotencyKey, validatedItems, shipping, email) {
  var serverTotal = validatedItems.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  return {
    order_id: orderId,
    idempotency_key: idempotencyKey || null,
    status: ORDER_STATUS.AWAITING_PAYMENT,
    payment_method: PAYMENT_METHOD.MONOBANK,
    customer: {
      email: email,
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      phone: shipping.phone,
    },
    shipping: {
      address: shipping.address,
      apartment: shipping.apartment,
      city: shipping.city,
      country: shipping.country,
      postalCode: shipping.postalCode,
      novaPoshtaBranch: shipping.novaPoshtaBranch,
    },
    items: validatedItems.map(function (i) { return { slug: i.slug, name: i.name, size: i.size, price: i.price, qty: i.qty }; }),
    shipping_cost: 0,
    tax: 0,
    subtotal: serverTotal,
    total: serverTotal,
    created_at: new Date().toISOString(),
  };
}

// ============================================================================
// Monobank Invoice
// ============================================================================

async function createMonobankInvoice(orderId, validatedItems, serverTotal) {
  var MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
  var SITE_URL = process.env.URL || process.env.DEPLOY_URL || '';

  if (!MONOBANK_TOKEN) throw { statusCode: 500, body: JSON.stringify({ error: 'Monobank не налаштовано' }) };
  if (!SITE_URL) throw { statusCode: 500, body: JSON.stringify({ error: 'SITE_URL not configured' }) };

  var amountKopecks = Math.round(serverTotal * 100);
  var basketOrder = validatedItems.map(function (i) {
    return { name: i.name + (i.size ? ' (' + i.size + ')' : ''), qty: i.qty, sum: Math.round(i.price * i.qty * 100), icon: '', unit: 'шт.', code: i.slug };
  });

  var monoRes = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': MONOBANK_TOKEN },
    body: JSON.stringify({
      amount: amountKopecks, ccy: PAYMENT.CCY,
      merchantPaymInfo: { reference: orderId, destination: 'Замовлення #' + orderId + ' — BUKSY', basketOrder: basketOrder },
      redirectUrl: SITE_URL + '/checkout?orderId=' + orderId,
      webHookUrl: SITE_URL + '/.netlify/functions/monobank-callback',
      validity: PAYMENT.INVOICE_VALIDITY, paymentType: 'debit',
    }),
  });

  if (!monoRes.ok) {
    console.error('Monobank invoice failed:', monoRes.status);
    throw { statusCode: 502, body: JSON.stringify({ error: 'Монобанк: помилка ' + monoRes.status }) };
  }

  var monoData = await monoRes.json();
  return { redirectUrl: monoData.pageUrl, orderId: orderId };
}

// ============================================================================
// Notifications (fire-and-forget)
// ============================================================================

async function notifyAsync(orderId, validatedItems, serverTotal, shipping, safeEmail) {
  var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  var CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (TOKEN && CHAT_ID) {
    var itemLines = validatedItems.map(function (i) {
      return i.qty + '\u00d7 ' + i.name + (i.size ? ' (' + i.size + ')' : '') + ' \u2014 ' + (i.price * i.qty) + ' \u20B4';
    }).join('\n');
    var tgMsg = (
      '\uD83D\uDED2 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n<code>#' + orderId + '</code>\n\n' +
      '\uD83D\uDC64 <b>' + esc(String(shipping.firstName || '-')) + ' ' + esc(String(shipping.lastName || '')) + '</b>\n' +
      '\uD83D\uDCE7 ' + esc(safeEmail || '-') + '\n' +
      (shipping.phone ? '\uD83D\uDCF1 ' + esc(String(shipping.phone)) + '\n' : '') + '\n' +
      '\uD83D\uDCCD ' + esc(String(shipping.city || '-')) + ', ' + esc(String(shipping.country || '-')) + '\n' +
      '\uD83D\uDE9A ' + esc(String(shipping.address || '-')) + (shipping.apartment ? ', ' + esc(String(shipping.apartment)) : '') + '\n' +
      (shipping.novaPoshtaBranch ? '\uD83D\uDCE6 \u041D\u041F \u2116' + esc(String(shipping.novaPoshtaBranch)) + '\n' : '') + '\n' +
      '<b>Товари:</b>\n' + itemLines + '\n\n' +
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\uD83D\uDCB0 <b>' + serverTotal + ' \u20B4</b>  |  \uD83D\uDCB3 Monobank\n\u23F3 \u041E\u0447\u0456\u043A\u0443\u0454 \u043E\u043F\u043B\u0430\u0442\u0438'
    );
    fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
    }).catch(function (err) { console.error('Telegram notify failed:', err.message); });
  }

  if (safeEmail) {
    var emailItems = validatedItems.map(function (i) { return { product: { name: i.name, price: i.price }, size: i.size, quantity: i.qty }; });
    sendEmail({
      to: safeEmail,
      subject: '\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + orderId + ' \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E \u2014 BUKSY',
      html: orderConfirmationHtml({ orderId: orderId, items: emailItems, total: serverTotal, shippingInfo: shipping }),
    }).catch(function (err) { console.error('Order email failed:', err.message); });
  }
}

// ============================================================================
// Handler
// ============================================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  var blocked = guard(event, RATE_LIMIT.CHECKOUT);
  if (blocked) return blocked;

  var parsed = parseBody(event, ORDER_LIMITS.MAX_BODY_SIZE);
  if (parsed.error) return { statusCode: 400, body: JSON.stringify({ error: parsed.error }) };
  var body = parsed.data;

  try {
    var items = body.items;
    var shippingInfo = body.shippingInfo;
    var email = body.email;
    var idempotencyKey = body.idempotencyKey;

    validateItems(items);
    if (email && !validateEmail(email)) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email format' }) };
    validateIdempotencyKey(idempotencyKey);

    var shipping = sanitizeShippingInfo(shippingInfo || {});
    var safeEmail = require('./_utils').sanitize(String(email || ''), FIELD_LIMITS.EMAIL);
    var orderId = generateOrderId();

    // Validate items against catalog + DB
    var validatedItems = await validateCatalogItems(items, 'monobank');
    var serverTotal = validatedItems.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    // Save order
    var orderRecord = createOrderRecord(orderId, idempotencyKey, validatedItems, shipping, safeEmail);
    try {
      await saveOrder(orderRecord);
    } catch (err) {
      if (err instanceof DuplicateOrderError) {
        var existing = await getOrderByIdempotencyKey(idempotencyKey);
        if (existing) {
          var SITE_URL = process.env.URL || process.env.DEPLOY_URL || '';
          if (existing.status === ORDER_STATUS.AWAITING_PAYMENT) {
            return { statusCode: 200, body: JSON.stringify({ redirectUrl: SITE_URL + '/checkout?orderId=' + existing.order_id, orderId: existing.order_id }) };
          }
          return { statusCode: 409, body: JSON.stringify({ error: 'Order already processed', orderId: existing.order_id }) };
        }
      }
      console.error('Save order failed:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Не вдалося створити замовлення' }) };
    }

    // Create invoice
    var payment = await createMonobankInvoice(orderId, validatedItems, serverTotal);

    // Notifications (non-blocking)
    notifyAsync(orderId, validatedItems, serverTotal, shipping, safeEmail);

    return { statusCode: 200, body: JSON.stringify(payment) };
  } catch (e) {
    if (e.statusCode) return e;
    console.error('monobank-checkout error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
