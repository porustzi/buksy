/**
 * @module order
 * Generic order creation endpoint (non-Monobank payment methods).
 *
 * Flow: validate → save order → decrease stock (atomic) → notifications
 */
var { esc, sanitize, sanitizeShippingInfo, validateItems, validateEmail, validateIdempotencyKey, validatePaymentMethod, parseBody, generateOrderId } = require('./_utils');
var { saveOrder, decreaseStockBulk, getStock, getOrderByIdempotencyKey } = require('./_supabase');
var { sendEmail, orderConfirmationHtml } = require('./_email');
var catalog = require('./_catalog.json');
var { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS, PAYMENT, ORDER_STATUS, PAYMENT_METHOD } = require('./_constants');
var { DuplicateOrderError } = require('./_errors');

/**
 * Validate catalog items and check DB stock.
 * @param {Array} items
 * @param {object} catalog
 * @returns {Promise<Array>}
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
      product: { slug: slug, name: entry.name, price: entry.price, images: item.product?.images || [] },
      size: item.size ? sanitize(String(item.size), FIELD_LIMITS.PRODUCT_SIZE) : '',
      quantity: qty,
      pricePerUnit: entry.price,
    });
  }
  return result;
}

/**
 * Send Telegram order notification.
 * @param {string} orderId
 * @param {Array} safeItems
 * @param {number} total
 * @param {object} shipping
 * @param {string} safeEmail
 * @param {string} paymentMethod
 */
async function notifyTelegram(orderId, safeItems, total, shipping, safeEmail, paymentMethod) {
  var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  var CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return;

  var itemsList = safeItems.map(function (i) {
    return '   ' + i.quantity + '\u00d7 ' + esc(i.product.name) + ' (' + esc(i.size) + ') \u2014 ' + (i.pricePerUnit * i.quantity).toFixed(0) + ' \u20B4';
  }).join('\n');

  var paymentLabel = paymentMethod === PAYMENT_METHOD.MONOBANK
    ? '\uD83D\uDCB3 Monobank (\u043E\u0447\u0456\u043A\u0443\u0454 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F)'
    : '\uD83D\uDCB3 \u041E\u043F\u043B\u0430\u0442\u0430';

  var tgMsg = [
    '\uD83D\uDED2 <b>НОВЕ ЗАМОВЛЕННЯ</b>',
    '<code>#' + orderId + '</code>',
    '',
    '<b>👤 Клієнт</b>',
    '   ' + esc(shipping.firstName) + ' ' + esc(shipping.lastName),
    '   ' + esc(safeEmail),
    shipping.phone ? '   ' + esc(shipping.phone) : '',
    '',
    '<b>📍 Доставка</b>',
    '   ' + esc(shipping.address) + (shipping.apartment ? ', ' + esc(shipping.apartment) : ''),
    '   ' + esc(shipping.city) + ', ' + esc(shipping.country) + ', ' + esc(shipping.postalCode),
    shipping.novaPoshtaBranch ? '   \u041D\u041F \u2116' + esc(shipping.novaPoshtaBranch) : '',
    '',
    '<b>🛍 Товари</b>',
    itemsList,
    '',
    paymentLabel,
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\u{1F4B0} <b>' + total.toFixed(0) + ' \u20B4</b>',
  ].filter(Boolean).join('\n');

  try {
    var tgRes = await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
    });
    if (!tgRes.ok) console.error('Telegram order notification failed:', tgRes.status);
  } catch (err) {
    console.error('Telegram order notification failed:', err.message);
  }
}

// ============================================================================
// Handler
// ============================================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var blocked = require('./_utils').guard(event, RATE_LIMIT.CHECKOUT);
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
    var paymentMethod = body.paymentMethod;
    var idempotencyKey = body.idempotencyKey;

    validateItems(items);
    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Shipping info is required' }) };
    }
    validateIdempotencyKey(idempotencyKey);
    paymentMethod = validatePaymentMethod(paymentMethod);

    var shipping = sanitizeShippingInfo(shippingInfo);
    var safeEmail = sanitize(String(shippingInfo.email || ''), FIELD_LIMITS.EMAIL);

    if (!safeEmail || !validateEmail(safeEmail)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Valid email is required' }) };
    }

    // 2. Validate items against catalog + DB stock
    var safeItems;
    try {
      safeItems = await validateCatalogItems(items, catalog);
    } catch (e) {
      if (e.statusCode) return e;
      throw e;
    }

    var orderId = generateOrderId();
    var total = safeItems.reduce(function (s, i) { return s + i.pricePerUnit * i.quantity; }, 0);

    // 3. Save order to DB (must succeed before stock decrease)
    try {
      await saveOrder({
        order_id: orderId,
        idempotency_key: idempotencyKey || null,
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
        if (existing) {
          return { statusCode: 200, body: JSON.stringify({ success: true, orderId: existing.order_id, total: Number(existing.total), message: 'Order already placed' }) };
        }
        return { statusCode: 409, body: JSON.stringify({ error: 'Це замовлення вже оформлено', duplicate: true }) };
      }
      console.error('Save order failed:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Не вдалося створити замовлення' }) };
    }

    // 5. Decrease stock (skip for Monobank — callback handles it)
    var tasks = [];
    if (paymentMethod !== PAYMENT_METHOD.MONOBANK) {
      tasks.push(
        decreaseStockBulk(safeItems.map(function (i) {
          var catStock = catalog[i.product.slug] ? Number(catalog[i.product.slug].stock) : PAYMENT.DEFAULT_STOCK;
          return { slug: i.product.slug, qty: i.quantity, default_stock: catStock || PAYMENT.DEFAULT_STOCK };
        })).catch(function (err) { console.error('Stock decrease error:', err.message); })
      );
    }

    // 6. Email notification
    if (safeEmail) {
      tasks.push(
        sendEmail({
          to: safeEmail,
          subject: '\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + orderId + ' \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E \u2014 BUKSY',
          html: orderConfirmationHtml({ orderId: orderId, items: safeItems, total: total, shippingInfo: shipping }),
        }).catch(function (err) { console.error('Email send failed:', err.message); })
      );
    }

    await Promise.allSettled(tasks);
    await notifyTelegram(orderId, safeItems, total, shipping, safeEmail, paymentMethod);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId: orderId, total: total, message: 'Order placed successfully!' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
