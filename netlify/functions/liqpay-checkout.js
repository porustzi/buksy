const crypto = require('crypto');
const { guard } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 10);
  if (blocked) return blocked;

  try {
    const { items, orderId, email } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    const PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          mode: 'test',
          message: 'LiqPay not configured — test mode',
        }),
      };
    }

    const serverTotal = items.reduce((s, i) => s + Number(i.product.price) * Number(i.quantity), 0);

    const description = items
      .map((i) => `${i.product.name} ×${i.quantity}`)
      .join(', ')
      .slice(0, 255);

    const json = {
      version: 3,
      public_key: PUBLIC_KEY,
      action: 'pay',
      amount: serverTotal,
      currency: 'UAH',
      description,
      order_id: orderId,
      result_url: (process.env.URL || '') + '/checkout?order=' + orderId,
      server_url: (process.env.URL || '') + '/.netlify/functions/liqpay-callback',
      info: JSON.stringify({
        orderId,
        email: email || '',
        items: items.map((i) => ({ name: i.product.name, size: i.size, qty: i.quantity })),
      }),
    };

    const data = Buffer.from(JSON.stringify(json)).toString('base64');
    const signStr = PRIVATE_KEY + data + PRIVATE_KEY;
    const signature = crypto.createHash('sha1').update(signStr).digest('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, mode: 'liqpay', data, signature }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
