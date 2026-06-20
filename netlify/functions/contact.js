/**
 * @module contact
 * Contact form handler — validates input and sends Telegram notification.
 */
var { esc, sanitize, guard, validateEmail, parseBody } = require('./_utils');
var { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS } = require('./_constants');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var blocked = guard(event, RATE_LIMIT.CONTACT);
  if (blocked) return blocked;

  var parsed = parseBody(event, ORDER_LIMITS.MAX_CONTACT_BODY);
  if (parsed.error) {
    return { statusCode: 400, body: JSON.stringify({ error: parsed.error }) };
  }
  var body = parsed.data;

  try {
    var name = body.name;
    var email = body.email;
    var subject = body.subject;
    var message = body.message;

    if (!email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email and message are required' }) };
    }

    if (!validateEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    if (message.length > FIELD_LIMITS.MESSAGE) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message too long (max ' + FIELD_LIMITS.MESSAGE + ' chars)' }) };
    }

    var safeEmail = sanitize(String(email), FIELD_LIMITS.EMAIL);
    var safeMessage = sanitize(message, FIELD_LIMITS.MESSAGE);
    var safeName = name ? sanitize(String(name), FIELD_LIMITS.NAME) : '';
    var safeSubject = subject ? sanitize(String(subject), FIELD_LIMITS.SUBJECT) : '';

    var TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    var CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TOKEN && CHAT_ID) {
      var tgMsg = [
        '\u2709\uFE0F <b>НОВА ЗАЯВКА</b>',
        '',
        safeName ? '\uD83D\uDC64 <b>' + esc(safeName) + '</b>' : '\uD83D\uDC64 <b>—</b>',
        '\uD83D\uDCE7 ' + esc(safeEmail),
        safeSubject ? '\uD83D\uDCDD ' + esc(safeSubject) : '',
        '',
        safeMessage ? '\uD83D\uDCAC ' + esc(safeMessage) : '',
      ].filter(Boolean).join('\n');

      try {
        var tgRes = await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg, parse_mode: 'HTML' }),
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
    console.error('contact error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
