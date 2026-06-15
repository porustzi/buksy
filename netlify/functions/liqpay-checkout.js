const crypto = require('crypto');
const { guard } = require('./_utils');
const { saveOrder } = require('./_supabase');
const catalog = require('./_catalog.json');

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

    // Validate items against catalog
    const validatedItems = [];
    for (const item of items) {
      const slug = item.product?.slug;
      const entry = catalog[slug];
      if (!entry) {
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown product: ${slug || 'unknown'}` }) };
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { statusCode: 400, body: JSON.stringify({ error: `Invalid quantity for ${slug}` }) };
      }
      if (entry.stock < qty) {
        return { statusCode: 400, body: JSON.stringify({ error: `Insufficient stock for ${entry.name}` }) };
      }
      validatedItems.push({
        slug,
        name: entry.name,
        size: item.size || '',
        qty,
        price: entry.price,
      });
    }

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, mode: 'test', message: 'LiqPay not configured — test mode' }),
      };
    }

    const serverTotal = validatedItems.reduce((s, i) => s + i.price * i.qty, 0);

    const description = validatedItems
      .map((i) => `${i.name} ×${i.qty}`)
      .join(', ')
      .slice(0, 255);

    // Save order BEFORE redirecting to LiqPay
    saveOrder({
      order_id: orderId,
      status: 'awaiting_payment',
      payment_method: 'liqpay',
      customer: { email: email || '' },
      items: validatedItems.map((i) => ({ slug: i.slug, name: i.name, size: i.size, price: i.price, qty: i.qty })),
      total: serverTotal,
      created_at: new Date().toISOString(),
    }).catch(() => {});

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
        items: validatedItems.map((i) => ({ slug: i.slug, name: i.name, size: i.size, qty: i.qty })),
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
