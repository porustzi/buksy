import { rateLimit, parseBody, pemToArrayBuffer, base64ToUint8Array, jsonResponse, errorResponse, sendTg } from '../lib/utils.js';
import { markOrderPaidWithStock, getOrderByRef, updateOrderStatus } from '../lib/supabase.js';
import { sendEmail, paymentConfirmedHtml } from '../lib/email.js';
import { RATE_LIMIT, PAYMENT, PUBKEY_CACHE_TTL } from '../lib/constants.js';
import { OrderNotFoundError, StockInsufficientError, AmountMismatchError } from '../lib/errors.js';
import { esc } from '../lib/utils.js';

let cache = { key: null, ts: 0, raw: null };

async function getPubKey(env) {
  const now = Date.now();
  if (cache.key && now - cache.ts < PUBKEY_CACHE_TTL) return cache;
  const TOKEN = env.MONOBANK_TOKEN;
  if (!TOKEN) return cache.key ? cache : null;
  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/pubkey', { headers: { 'X-Token': TOKEN } });
    if (!res.ok) return cache.key ? cache : null;
    const data = await res.json();
    // Monobank returns `key` as base64-encoded PEM. Decode once to get the PEM string.
    let pemStr = data.key;
    try {
      const decoded = base64ToString(data.key);
      if (decoded && decoded.includes('PUBLIC KEY')) pemStr = decoded;
    } catch (e) { console.error('[CALLBACK] pubkey decode error:', e.message); }
    cache = { key: pemStr, raw: pemStr, ts: now };
    return cache;
  } catch { return cache.key ? cache : null; }
}

function base64ToString(b64) {
  if (typeof atob === 'function') return atob(b64);
  const bytes = base64ToUint8Array(b64);
  return new TextDecoder().decode(bytes);
}

function derToRaw(derBytes) {  // Monobank signs in DER (ASN.1 SEQUENCE { INTEGER r, INTEGER s }).
  // WebCrypto expects raw r||s (64 bytes for P-256). Convert.
  if (!derBytes || derBytes.length < 8 || derBytes[0] !== 0x30) return derBytes;
  try {
    let idx = 2;
    if (derBytes[1] & 0x80) idx += derBytes[1] & 0x7f;
    if (derBytes[idx] !== 0x02) return derBytes;
    const rLen = derBytes[idx + 1];
    idx += 2;
    const r = Array.from(derBytes.slice(idx, idx + rLen));
    idx += rLen;
    if (derBytes[idx] !== 0x02) return derBytes;
    const sLen = derBytes[idx + 1];
    idx += 2;
    const s = Array.from(derBytes.slice(idx, idx + sLen));
    const norm = (a) => {
      while (a.length > 0 && a[0] === 0) a.shift();
      while (a.length < 32) a.unshift(0);
      return a.slice(0, 32);
    };
    return new Uint8Array([...norm(r), ...norm(s)]);
  } catch { return derBytes; }
}

async function verifySignature(rawBody, xSign, pubKeyCache) {
  if (!xSign || !pubKeyCache || !pubKeyCache.raw) return false;
  try {
    const keyData = pemToArrayBuffer(pubKeyCache.raw);
    const key = await crypto.subtle.importKey('spki', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const sig = base64ToUint8Array(xSign);
    const rawSig = derToRaw(sig);
    const data = new TextEncoder().encode(rawBody);
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, rawSig, data);
  } catch (e) {
    console.error('[CALLBACK] verify error:', e.message);
    return false;
  }
}

function buildStockItems(orderItems) {
  if (!orderItems || !Array.isArray(orderItems) || !orderItems.length) return [];
  return orderItems.map(i => ({
    slug: i.slug,
    qty: Number(i.qty || i.quantity) || 0,
    default_stock: PAYMENT.DEFAULT_STOCK,
  })).filter(i => i.slug && i.qty > 0);
}

export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method Not Allowed' });

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!rateLimit(ip, RATE_LIMIT.WEBHOOK)) return jsonResponse(429, { error: 'Too many requests' });

  const rawBody = await request.text();
  const xSign = request.headers.get('x-sign') || '';

  // Diagnostic: record EVERY webhook hit on the order (before signature check)
  let bodyDiag = null;
  try { bodyDiag = JSON.parse(rawBody); } catch {}
  if (bodyDiag && bodyDiag.reference) {
    try {
      const o = await getOrderByRef(env, bodyDiag.reference);
      const ship = { ...(o.shipping || {}), _cb: { hit: new Date().toISOString(), status: bodyDiag.status || '?', invoiceId: bodyDiag.invoiceId || '', amount: bodyDiag.amount || bodyDiag.finalAmount || '' } };
      await updateOrderStatus(env, bodyDiag.reference, { shipping: ship });
    } catch (e) { console.error('[DIAG]', e.message); }
  }

  const pubKeyCache = await getPubKey(env);
  if (!pubKeyCache || !pubKeyCache.key) return jsonResponse(500, { error: 'Signature verification unavailable' });
  if (!xSign || !(await verifySignature(rawBody, xSign, pubKeyCache))) return jsonResponse(403, { error: 'Invalid signature' });

  let body;
  try { body = JSON.parse(rawBody); } catch { return errorResponse(400, 'Invalid JSON'); }

  try {
    if (!body.invoiceId || !body.status || !body.reference) return errorResponse(400, 'Invalid payload');
    if (body.status !== 'success') return jsonResponse(200, { ok: true });

    const amountPaid = Number(body.amount || body.finalAmount) / 100;
    if (!amountPaid || amountPaid <= 0) return errorResponse(400, 'Missing amount');

    const order = await getOrderByRef(env, body.reference);
    const orderTotal = Number(order.total) || 0;

    // Stock items from the ORDER (authoritative), fallback to webhook basketOrder
    let itemsForStock = buildStockItems(order.items);
    if (!itemsForStock.length && Array.isArray(body.basketOrder)) {
      itemsForStock = (body.basketOrder || []).map(b => ({ slug: b.code, qty: Number(b.qty) || 0, default_stock: PAYMENT.DEFAULT_STOCK })).filter(i => i.slug && i.qty > 0);
    }

    const wasPaid = await markOrderPaidWithStock(env, body.reference, body.invoiceId, amountPaid, orderTotal, itemsForStock.length ? itemsForStock : null);

    if (!wasPaid) return jsonResponse(200, { ok: true });

    const tgToken = env.TELEGRAM_BOT_TOKEN;
    if (tgToken) {
      const ship = order.shipping || {};
      const cust = order.customer || {};
      const items = order.items || [];
      const itemsLines = items.map(i => `${i.qty}× ${esc(i.name)}${i.size ? ' (' + esc(i.size) + ')' : ''}`).join('\n');
      const delivery = ship.deliveryMethod === 'nova'
        ? '📦 Нова Пошта: №' + esc(ship.novaPoshtaBranch || '—') + (ship.city ? ' (' + esc(ship.city) + ')' : '')
        : '🏠 Адреса: ' + esc(ship.address || '—') + (ship.apartment ? ', кв. ' + esc(ship.apartment) : '') + ', ' + esc(ship.city || '') + ', ' + esc(ship.country || '');

      waitUntil(sendTg(env, `✅ <b>ОПЛАЧЕНО</b>\n<code>#${esc(body.reference)}</code>\n\n💰 <b>${amountPaid.toFixed(2)} UAH</b> (сума замовлення ${orderTotal.toFixed(2)})\n\n👤 <b>${esc(cust.firstName || '')} ${esc(cust.lastName || '')}</b>\n📞 ${esc(cust.phone || '—')}\n📧 ${esc(cust.email || '—')}\n\n🚚 ${delivery}\n💸 Доставка: ${(Number(order.shipping_cost) || 0).toFixed(0)} ₴\n\n🛍 <b>Товари:</b>\n${itemsLines}\n\n━━━━━━━━━━━━━━━━\n✅ Відправляй замовлення`));
    }
    if (order.customer?.email) {
      waitUntil(sendEmail(env, { to: order.customer.email, subject: 'Оплату підтверджено — Замовлення #' + body.reference, html: paymentConfirmedHtml({ orderId: body.reference, amount: amountPaid, currency: 'UAH', paymentId: body.invoiceId, shippingCost: Number(order.shipping_cost) || 0, subtotal: Number(order.subtotal) || 0, items: (body.basketOrder || []).map(b => ({ qty: b.qty, name: b.name, size: '' })) }) }).catch(e => console.error('[EMAIL-CALLBACK]', e.message)));
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('[CALLBACK] error:', err.name, err.message, err.code || '');
    if (err instanceof OrderNotFoundError) return errorResponse(404, 'Order not found');
    if (err instanceof AmountMismatchError) return errorResponse(400, 'Amount mismatch');
    if (err instanceof StockInsufficientError) return errorResponse(409, 'Insufficient stock');
    return errorResponse(500, 'Internal server error');
  }
}
