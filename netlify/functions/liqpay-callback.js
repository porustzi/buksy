const crypto = require('crypto');
const { esc } = require('./_utils');
const { markOrderPaid, decreaseStock } = require('./_supabase');
const { sendEmail, paymentConfirmedHtml } = require('./_email');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = new URLSearchParams(event.body);
    const data = body.get('data');
    const signature = body.get('signature');

    const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
      return { statusCode: 500, body: 'Server misconfigured: missing LIQPAY_PRIVATE_KEY' };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const expectedSig = crypto
      .createHash('sha1')
      .update(PRIVATE_KEY + data + PRIVATE_KEY)
      .digest('base64');

    if (signature !== expectedSig) {
      return { statusCode: 403, body: 'Invalid signature' };
    }

    const payment = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

    if (payment.status === 'success' || payment.status === 'sandbox') {
      const info = JSON.parse(payment.info || '{}');
      const itemsText = (info.items || [])
        .map((i) => `   ${i.qty}× ${esc(i.name)} (${esc(i.size)})`)
        .join('\n');

      const msg = [
        '✅ <b>ОПЛАЧЕНО</b>',
        `<code>#${esc(payment.order_id)}</code>`,
        '',
        `💳 ${esc(String(payment.payment_id || ''))}`,
        `💰 <b>${Number(payment.amount || 0).toFixed(2)} ${esc(payment.currency || '')}</b>`,
        '',
        itemsText ? '<b>🛍 Товари</b>\n' + itemsText : '',
        '',
        '━━━━━━━━━━━━━━━━',
        '✅ Оплата підтверджена',
      ].filter(Boolean).join('\n');

      // Telegram
      if (TOKEN && CHAT_ID) {
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
          });
          if (!tgRes.ok) console.error('Telegram payment notification failed:', tgRes.status);
        } catch (err) {
          console.error('Telegram payment notification failed:', err.message);
        }
      }

      // Mark order as paid (idempotent — ignores if already paid)
      const wasPaid = await markOrderPaid(payment.order_id, payment.payment_id);
      if (!wasPaid) {
        return { statusCode: 200, body: 'OK' }; // duplicate callback, skip
      }

      // Decrease stock on payment confirmation
      if (info.items && info.items.length) {
        decreaseStock(info.items.map((i) => ({ product: { slug: i.slug }, quantity: i.qty }))).catch(() => {});
      }

      // Email customer
      const customerEmail = info.email;
      if (customerEmail) {
        sendEmail({
          to: customerEmail,
          subject: `Оплата отримана — замовлення #${payment.order_id}`,
          html: paymentConfirmedHtml({
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            paymentId: payment.payment_id,
            items: info.items,
          }),
        }).catch(() => {});
      }

      return { statusCode: 200, body: 'OK' };
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
