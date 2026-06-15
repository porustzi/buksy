const { esc, guard } = require('./_utils');
const { updateOrderStatus } = require('./_supabase');
const { sendEmail, trackingUpdateHtml } = require('./_email');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 5);
  if (blocked) return blocked;

  try {
    const { orderId, trackingNumber } = JSON.parse(event.body);

    if (!orderId || !trackingNumber) {
      return { statusCode: 400, body: JSON.stringify({ error: 'orderId and trackingNumber are required' }) };
    }

    // Update in Supabase
    await updateOrderStatus(orderId, {
      status: 'shipped',
      tracking_number: String(trackingNumber).trim(),
      shipped_at: new Date().toISOString(),
    });

    // Telegram notification
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TOKEN && CHAT_ID) {
      const tt = esc(String(trackingNumber).trim());
      const msg = [
        '📦 <b>ВІДПРАВЛЕНО</b>',
        `<code>#${esc(orderId)}</code>`,
        '',
        `🚚 ТТН Нова Пошта: <code>${tt}</code>`,
        '',
        '━━━━━━━━━━━━━━━━',
        '📦 Замовлення в дорозі',
      ].filter(Boolean).join('\n');

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
        });
        if (!tgRes.ok) console.error('Telegram tracking notification failed:', tgRes.status);
      } catch (err) {
        console.error('Telegram tracking notification failed:', err.message);
      }
    }

    // Email the customer — requires email to be stored in order
    // For now, we send it if customer email was passed
    const customerEmail = JSON.parse(event.body).customerEmail;
    if (customerEmail) {
      sendEmail({
        to: customerEmail,
        subject: `Замовлення #${orderId} відправлено — BUKSY`,
        html: trackingUpdateHtml({ orderId, trackingNumber: String(trackingNumber).trim() }),
      }).catch(() => {});
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `Tracking updated for ${orderId}: ${trackingNumber}` }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
