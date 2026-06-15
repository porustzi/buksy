const { esc, rateLimit } = require('./_utils');
const { markOrderPaid, decreaseStock } = require('./_supabase');
const { sendEmail, paymentConfirmedHtml } = require('./_email');
const crypto = require('crypto');

let cachedPubKey = null;
let pubKeyFetchedAt = 0;

async function getPubKey() {
  if (cachedPubKey && Date.now() - pubKeyFetchedAt < 3600000) return cachedPubKey;
  const TOKEN = process.env.MONOBANK_TOKEN;
  if (!TOKEN) return null;
  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/pubkey', {
      headers: { 'X-Token': TOKEN },
    });
    if (!res.ok) return cachedPubKey;
    const data = await res.json();
    cachedPubKey = data.key;
    pubKeyFetchedAt = Date.now();
    return cachedPubKey;
  } catch {
    return cachedPubKey;
  }
}

function verifySignature(rawBody, xSign, pubKey) {
  if (!xSign || !pubKey) return false;
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(rawBody, 'utf8');
    return verifier.verify(pubKey, Buffer.from(xSign, 'base64'));
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Rate limit only (no origin check — callback comes from Monobank)
  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!rateLimit(ip, 30)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  const rawBody = event.body || '';
  const xSign = event.headers['x-sign'] || '';

  // Verify Monobank signature
  const pubKey = await getPubKey();
  if (pubKey && xSign) {
    if (!verifySignature(rawBody, xSign, pubKey)) {
      console.error('Monobank callback: invalid X-Sign');
      return { statusCode: 403, body: 'Invalid signature' };
    }
  } else if (xSign) {
    console.warn('Monobank callback: cannot verify signature (no public key)');
  }

  try {
    const body = JSON.parse(rawBody);

    if (!body.invoiceId || !body.status || !body.reference) {
      return { statusCode: 400, body: 'Invalid callback payload' };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (body.status !== 'success') {
      console.log('Monobank callback: status=' + body.status + ', ref=' + body.reference);
      return { statusCode: 200, body: 'OK' };
    }

    const amount = (body.amount || body.finalAmount || 0) / 100;

    const msg = [
      '\u2705 <b>ОПЛАЧЕНО (Monobank)</b>',
      '<code>#' + esc(body.reference) + '</code>',
      '',
      '\uD83D\uDCB3 ' + esc(body.invoiceId),
      '\uD83D\uDCB0 <b>' + amount.toFixed(2) + ' UAH</b>',
      '',
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
      '\u2705 Оплата підтверджена',
    ].join('\n');

    if (TOKEN && CHAT_ID) {
      try {
        const tgRes = await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
        });
        if (!tgRes.ok) console.error('Telegram payment notification failed:', tgRes.status);
      } catch (err) {
        console.error('Telegram payment notification failed:', err.message);
      }
    }

    const wasPaid = await markOrderPaid(body.reference, body.invoiceId);
    if (!wasPaid) {
      return { statusCode: 200, body: 'OK' };
    }

    if (body.basketOrder && body.basketOrder.length) {
      decreaseStock(
        body.basketOrder.map(function (b) {
          return { product: { slug: b.code }, quantity: b.qty };
        })
      ).catch(function () {});
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('monobank-callback error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
