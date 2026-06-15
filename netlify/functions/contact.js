const { esc, guard, validateEmail } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 5);
  if (blocked) return blocked;

  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    if (!email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email and message are required' }) };
    }

    if (!validateEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    if (message.length > 4096) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message too long (max 4096 chars)' }) };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TOKEN && CHAT_ID) {
      const safeName = name ? esc(name.slice(0, 128)) : '';
      const safeSubject = subject ? esc(subject.slice(0, 256)) : '';
      const safeMessage = esc(message.slice(0, 4096));

      const msg = [
        '✉️ <b>НОВА ЗАЯВКА</b>',
        '',
        safeName ? `👤 <b>${safeName}</b>` : '👤 <b>—</b>',
        `📧 ${esc(email)}`,
        safeSubject ? `📝 ${safeSubject}` : '',
        '',
        safeMessage ? `💬 ${safeMessage}` : '',
      ].filter(Boolean).join('\n');

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
        });
        if (!tgRes.ok) console.error('Telegram contact notification failed:', tgRes.status);
      } catch (err) {
        console.error('Telegram contact notification failed:', err.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Message received. We will get back to you soon.' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
