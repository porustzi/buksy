exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    if (!email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email and message are required' }) };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TOKEN && CHAT_ID) {
      const msg = [
        '✉️ <b>НОВА ЗАЯВКА</b>',
        '',
        name ? `👤 <b>${name}</b>` : '👤 <b>—</b>',
        `📧 ${email}`,
        subject ? `📝 ${subject}` : '',
        '',
        message ? `💬 ${message}` : '',
      ].filter(Boolean).join('\n');

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: msg,
          parse_mode: 'HTML',
        }),
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Message received. We will get back to you soon.' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
