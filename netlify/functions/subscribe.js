const { guard, validateEmail } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 5);
  if (blocked) return blocked;

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
    }

    if (!validateEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    // Log subscription (plug in Mailchimp/SendGrid later)
    console.log('[Subscribe] email=' + email);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Підписку оформлено!' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
