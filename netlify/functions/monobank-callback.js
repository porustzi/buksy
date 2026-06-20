/**
 * @module monobank-callback
 * Webhook handler for Monobank payment confirmations.
 *
 * Flow: rate-limit → verify signature → parse body → fetch order →
 *       atomic markPaid+verifyAmount+decreaseStock → notifications → 200
 */
var { esc, rateLimit, parseBody } = require('./_utils');
var { markOrderPaidWithStock, getOrderByRef } = require('./_supabase');
var { sendEmail, paymentConfirmedHtml } = require('./_email');
var catalog = require('./_catalog.json');
var crypto = require('crypto');
var { RATE_LIMIT, PAYMENT, PUBKEY_CACHE_TTL } = require('./_constants');
var {
  OrderNotFoundError,
  StockInsufficientError,
  AmountMismatchError,
  SignatureError,
} = require('./_errors');

// ============================================================================
// Monobank Public Key (lazy-fetched, cached for 1 hour)
// ============================================================================

/** @type {string|null} */
var cache = { key: null, ts: 0 };

/**
 * Fetch or return cached Monobank public key.
 * @returns {Promise<string|null>}
 */
async function getPubKey() {
  if (cache.key && Date.now() - cache.ts < PUBKEY_CACHE_TTL) return cache.key;
  var TOKEN = process.env.MONOBANK_TOKEN;
  if (!TOKEN) return null;
  try {
    var res = await fetch('https://api.monobank.ua/api/merchant/pubkey', {
      headers: { 'X-Token': TOKEN },
    });
    if (!res.ok) return cache.key;
    var data = await res.json();
    cache.key = data.key;
    cache.ts = Date.now();
    return cache.key;
  } catch (e) {
    return cache.key;
  }
}

/**
 * Verify Monobank callback signature (SHA256 + ECDSA).
 * @param {string} rawBody
 * @param {string} xSign
 * @param {string} pubKey
 * @returns {boolean}
 */
function verifySignature(rawBody, xSign, pubKey) {
  if (!xSign || !pubKey) return false;
  try {
    var verifier = crypto.createVerify('SHA256');
    verifier.update(rawBody, 'utf8');
    return verifier.verify(pubKey, Buffer.from(xSign, 'base64'));
  } catch (e) {
    return false;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build stock decrease items from Monobank basketOrder with catalog default_stock.
 * @param {Array} basketOrder
 * @returns {Array<{slug: string, qty: number, default_stock: number}>}
 */
function buildStockItems(basketOrder) {
  if (!basketOrder || !Array.isArray(basketOrder) || !basketOrder.length) return [];
  return basketOrder.map(function (b) {
    var catEntry = catalog[b.code];
    var catStock = catEntry ? Number(catEntry.stock) : PAYMENT.DEFAULT_STOCK;
    return { slug: b.code, qty: Number(b.qty) || 0, default_stock: catStock || PAYMENT.DEFAULT_STOCK };
  }).filter(function (i) { return i.slug && i.qty > 0; });
}

/**
 * Send Telegram payment notification.
 * @param {string} reference — order_id
 * @param {string} invoiceId
 * @param {number} amountPaid
 * @param {number} orderTotal
 */
async function notifyTelegram(reference, invoiceId, amountPaid, orderTotal) {
  var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  var CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) return;

  var tgMsg = [
    '\u2705 <b>ОПЛАЧЕНО (Monobank)</b>',
    '<code>#' + esc(reference) + '</code>',
    '',
    '\uD83D\uDCB3 ' + esc(invoiceId),
    '\uD83D\uDCB0 <b>' + amountPaid.toFixed(2) + ' UAH</b>',
    '',
    '\uD83D\uDCCB Сума замовлення: ' + orderTotal.toFixed(2) + ' UAH',
    '',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\u2705 Оплата підтверджена',
  ].join('\n');

  try {
    var tgRes = await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
    });
    if (!tgRes.ok) console.error('Telegram payment notification failed:', tgRes.status);
  } catch (err) {
    console.error('Telegram payment notification failed:', err.message);
  }
}

/**
 * Send payment confirmation email.
 * @param {string} reference
 * @param {string} invoiceId
 * @param {number} amountPaid
 * @param {Array} basketOrder
 * @param {string} customerEmail
 */
async function notifyEmail(reference, invoiceId, amountPaid, basketOrder, customerEmail) {
  if (!customerEmail) return;
  var emailItems = (basketOrder || []).map(function (b) {
    return { qty: b.qty, name: b.name, size: '' };
  });
  try {
    await sendEmail({
      to: customerEmail,
      subject: '\u041E\u043F\u043B\u0430\u0442\u0443 \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043E \u2014 \u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + reference,
      html: paymentConfirmedHtml({ orderId: reference, amount: amountPaid, currency: 'UAH', paymentId: invoiceId, items: emailItems }),
    });
  } catch (err) {
    console.error('Payment email failed:', err.message);
  }
}

// ============================================================================
// Handler
// ============================================================================

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var ip = event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip, RATE_LIMIT.WEBHOOK)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  var rawBody = event.body || '';
  var xSign = event.headers['x-sign'] || '';

  // Signature verification
  var pubKey = await getPubKey();
  if (!pubKey) {
    console.error('Monobank callback: cannot verify signature (public key unavailable)');
    return { statusCode: 500, body: 'Server misconfigured — cannot verify Monobank signature' };
  }
  if (!xSign || !verifySignature(rawBody, xSign, pubKey)) {
    console.error('Monobank callback: invalid X-Sign');
    return { statusCode: 403, body: 'Invalid signature' };
  }

  // Parse body
  var parsed = parseBody(event, RATE_LIMIT.WEBHOOK ? 65536 : 65536);
  if (parsed.error) {
    return { statusCode: 400, body: 'Invalid JSON payload' };
  }
  var body = parsed.data;

  try {
    if (!body.invoiceId || !body.status || !body.reference) {
      return { statusCode: 400, body: 'Invalid callback payload' };
    }

    if (body.status !== 'success') {
      return { statusCode: 200, body: 'OK' };
    }

    var amountPaid = Number(body.amount || body.finalAmount || 0) / 100;
    var itemsForStock = buildStockItems(body.basketOrder);

    // Fetch order — throws OrderNotFoundError if missing
    var order = await getOrderByRef(body.reference);
    var orderTotal = Number(order.total) || 0;

    // Atomic: mark paid + verify amount + decrease stock
    var wasPaid = await markOrderPaidWithStock(
      body.reference,
      body.invoiceId,
      amountPaid,
      orderTotal,
      itemsForStock
    );

    // Idempotent: if already paid, return OK silently
    if (!wasPaid) {
      return { statusCode: 200, body: 'OK' };
    }

    // Notifications only fire on first successful payment
    await notifyTelegram(body.reference, body.invoiceId, amountPaid, orderTotal);
    await notifyEmail(body.reference, body.invoiceId, amountPaid, body.basketOrder, order.customer?.email);

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return { statusCode: 404, body: 'Order not found' };
    }
    if (error instanceof AmountMismatchError) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Amount mismatch' }) };
    }
    if (error instanceof StockInsufficientError) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Insufficient stock' }) };
    }
    console.error('monobank-callback error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
