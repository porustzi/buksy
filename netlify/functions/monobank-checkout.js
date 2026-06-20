/**
 * @module monobank-checkout
 * Creates a Monobank invoice for an order.
 *
 * Flow: validate → save order → create invoice → fire-and-forget notifications
 */
var { guard, esc, sanitize, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, parseBody, generateOrderId } = require('./_utils');
var { saveOrder, getStock, getOrderByIdempotencyKey } = require('./_supabase');
var { sendEmail, orderConfirmationHtml } = require('./_email');
var catalog = require('./_catalog.json');
var { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } = require('./_constants');
var { DuplicateOrderError, StockInsufficientError } = require('./_errors');

// ============================================================================
// CONFIG
// ============================================================================

var CONFIG = {};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate each cart item against the catalog and DB stock.
 * @param {Array} items — raw items from request body
 * @param {object} catalog — product catalog
 * @returns {Promise<Array>} validated items with server-side prices
 * @throws {ValidationError|StockInsufficientError}
 */
async function validateCatalogItems(items, catalog) {
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var slug = item.product?.slug;
    var entry = catalog[slug];
    if (!entry) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Unknown product: ' + (slug || 'unknown') }) };
    }

    var qty = Number(item.quantity);
    if (isNaN(qty) || qty < ORDER_LIMITS.MIN_QUANTITY || qty > ORDER_LIMITS.MAX_QUANTITY) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Invalid quantity for ' + slug }) };
    }

    if (Number(entry.stock) < qty) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Insufficient stock for ' + entry.name + ': ' + entry.stock + ' available (catalog)' }) };
    }

    var dbStock = await getStock(slug);
    if (dbStock !== null && dbStock < qty) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Insufficient stock for ' + entry.name + ': ' + dbStock + ' available (DB)' }) };
    }

    result.push({
      slug: slug,
      name: entry.name,
      size: item.size ? sanitize(String(item.size), FIELD_LIMITS.PRODUCT_SIZE) : '',
      qty: qty,
      price: entry.price,
    });
  }
  return result;
}

// ============================================================================
// Order Record Builder
// ============================================================================

/**
 * Build the order record for Supabase.
 * @param {string} orderId
 * @param {string|null} idempotencyKey
 * @param {Array} validatedItems
 * @param {object} shipping — sanitized shipping info
 * @param {string} email — sanitized email
 * @returns {object}
 */
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

/**
 * Create a Monobank payment invoice.
 * @param {string} orderId
 * @param {Array} validatedItems
 * @param {number} serverTotal
 * @returns {Promise<object>} { redirectUrl, orderId }
 */
async function createMonobankInvoice(orderId, validatedItems, serverTotal) {
  var MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
  var SITE_URL = process.env.URL || process.env.DEPLOY_URL || '';

  if (!MONOBANK_TOKEN) {
    throw { statusCode: 500, body: JSON.stringify({ error: 'Monobank не налаштовано' }) };
  }
  if (!SITE_URL) {
    throw { statusCode: 500, body: JSON.stringify({ error: 'SITE_URL not configured' }) };
  }

  var amountKopecks = Math.round(serverTotal * 100);

  var basketOrder = validatedItems.map(function (i) {
    return {
      name: i.name + (i.size ? ' (' + i.size + ')' : ''),
      qty: i.qty,
      sum: Math.round(i.price * i.qty * 100),
      icon: '',
      unit: 'шт.',
      code: i.slug,
    };
  });

  var monoBody = {
    amount: amountKopecks,
    ccy: PAYMENT.CCY,
    merchantPaymInfo: {
      reference: orderId,
      destination: 'Замовлення #' + orderId + ' — BUKSY',
      basketOrder: basketOrder,
    },
    redirectUrl: SITE_URL + '/checkout?orderId=' + orderId,
    webHookUrl: SITE_URL + '/.netlify/functions/monobank-callback',
    validity: PAYMENT.INVOICE_VALIDITY,
    paymentType: 'debit',
  };

  var monoRes = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Token': MONOBANK_TOKEN,
    },
    body: JSON.stringify(monoBody),
  });

  if (!monoRes.ok) {
    var errText = await monoRes.text();
    console.error('Monobank invoice failed:', monoRes.status, errText);
    var msg = 'Монобанк: ';
    if (monoRes.status === 403) msg += 'невірний токен (403)';
    else if (monoRes.status === 400) msg += 'помилка в даних (400)';
    else msg += 'помилка ' + monoRes.status;
    throw { statusCode: 502, body: JSON.stringify({ error: msg }) };
  }

  var monoData = await monoRes.json();
  return { redirectUrl: monoData.pageUrl, orderId: orderId };
}

// ============================================================================
// Notifications (fire-and-forget)
// ============================================================================

/**
 * Send Telegram notification and order confirmation email.
 * Non-blocking — errors are logged but never propagate.
 * @param {string} orderId
 * @param {Array} validatedItems
 * @param {number} serverTotal
 * @param {object} shipping — sanitized shipping info
 * @param {string} safeEmail
 * @returns {Promise<void>}
 */
async function notifyAsync(orderId, validatedItems, serverTotal, shipping, safeEmail) {
  var tasks = [];

  var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  var CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (TOKEN && CHAT_ID) {
    var itemLines = validatedItems.map(function (i) {
      return i.qty + '\u00d7 ' + i.name + (i.size ? ' (' + i.size + ')' : '') + ' \u2014 ' + (i.price * i.qty) + ' \u20B4';
    }).join('\n');
    var tgMsg = (
      '\uD83D\uDED2 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n' +
      '<code>#' + orderId + '</code>\n\n' +
      '\uD83D\uDC64 <b>' + esc(String(shipping.firstName || '-')) + ' ' + esc(String(shipping.lastName || '')) + '</b>\n' +
      '\uD83D\uDCE7 ' + esc(safeEmail || '-') + '\n' +
      (shipping.phone ? '\uD83D\uDCF1 ' + esc(String(shipping.phone)) + '\n' : '') + '\n' +
      '\uD83D\uDCCD ' + esc(String(shipping.city || '-')) + ', ' + esc(String(shipping.country || '-')) + '\n' +
      '\uD83D\uDE9A ' + esc(String(shipping.address || '-')) + (shipping.apartment ? ', ' + esc(String(shipping.apartment)) : '') + '\n' +
      (shipping.novaPoshtaBranch ? '\uD83D\uDCE6 \u041D\u041F \u2116' + esc(String(shipping.novaPoshtaBranch)) + '\n' : '') + '\n' +
      '<b>Товари:</b>\n' + itemLines + '\n\n' +
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
      '\uD83D\uDCB0 <b>' + serverTotal + ' \u20B4</b>  |  \uD83D\uDCB3 Monobank\n' +
      '\u23F3 \u041E\u0447\u0456\u043A\u0443\u0454 \u043E\u043F\u043B\u0430\u0442\u0438'
    );
    tasks.push(
      fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
      }).then(function (r) { if (!r.ok) console.error('Telegram notify failed:', r.status); })
        .catch(function (err) { console.error('Telegram notify failed:', err.message); })
    );
  }

  if (safeEmail) {
    var emailItems = validatedItems.map(function (i) {
      return { product: { name: i.name, price: i.price }, size: i.size, quantity: i.qty };
    });
    tasks.push(
      sendEmail({
        to: safeEmail,
        subject: '\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + orderId + ' \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E \u2014 BUKSY',
        html: orderConfirmationHtml({ orderId: orderId, items: emailItems, total: serverTotal, shippingInfo: shipping }),
      }).catch(function (err) { console.error('Order email failed:', err.message); })
    );
  }

  var results = await Promise.allSettled(tasks);
  var failed = results.filter(function (r) { return r.status === 'rejected'; }).length;
  if (failed) console.error('monobank-checkout: ' + failed + ' notification(s) failed');
}

// ============================================================================
// Handler
// ============================================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var blocked = guard(event, RATE_LIMIT.CHECKOUT);
  if (blocked) return blocked;

  var parsed = parseBody(event, ORDER_LIMITS.MAX_BODY_SIZE);
  if (parsed.error) {
    return { statusCode: 400, body: JSON.stringify({ error: parsed.error }) };
  }
  var body = parsed.data;

  try {
    // 1. Extract + validate inputs
    var items = body.items;
    var shippingInfo = body.shippingInfo;
    var email = body.email;
    var idempotencyKey = body.idempotencyKey;

    validateItems(items);
    if (email && !validateEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email format' }) };
    }
    validateIdempotencyKey(idempotencyKey);

    var shipping = sanitizeShippingInfo(shippingInfo || {});
    var safeEmail = sanitize(String(email || ''), FIELD_LIMITS.EMAIL);
    var orderId = generateOrderId();

    // 2. Validate items against catalog + DB stock
    var validatedItems;
    try {
      validatedItems = await validateCatalogItems(items, catalog);
    } catch (e) {
      if (e.statusCode) return e;
      throw e;
    }

    var serverTotal = validatedItems.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    // 3. Save order to DB
    var orderRecord = createOrderRecord(orderId, idempotencyKey, validatedItems, shipping, safeEmail);
    var saved;
    try {
      saved = await saveOrder(orderRecord);
    } catch (err) {
      console.error('Save order failed:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Не вдалося створити замовлення' }) };
    }

    // 4. Handle idempotency — return existing order data
    if (saved === null) {
      var existing = await getOrderByIdempotencyKey(idempotencyKey);
      if (existing) {
        if (existing.status === ORDER_STATUS.AWAITING_PAYMENT) {
          var SITE_URL = process.env.URL || process.env.DEPLOY_URL || '';
          return {
            statusCode: 200,
            body: JSON.stringify({
              redirectUrl: SITE_URL + '/checkout?orderId=' + existing.order_id,
              orderId: existing.order_id,
            }),
          };
        }
        return { statusCode: 409, body: JSON.stringify({ error: 'Це замовлення вже оформлено', duplicate: true, orderId: existing.order_id }) };
      }
      return { statusCode: 409, body: JSON.stringify({ error: 'Це замовлення вже оформлено', duplicate: true }) };
    }

    // 5. Create Monobank invoice (after order is saved)
    var payment;
    try {
      payment = await createMonobankInvoice(orderId, validatedItems, serverTotal);
    } catch (e) {
      if (e.statusCode) return e;
      throw e;
    }

    // 6. Fire-and-forget notifications (non-blocking)
    notifyAsync(orderId, validatedItems, serverTotal, shipping, safeEmail).catch(function (err) {
      console.error('notifyAsync unhandled:', err.message);
    });

    return {
      statusCode: 200,
      body: JSON.stringify(payment),
    };
  } catch (error) {
    console.error('monobank-checkout error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Внутрішня помилка сервера' }) };
  }
};
