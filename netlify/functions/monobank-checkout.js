const { guard } = require('./_utils');
const { saveOrder } = require('./_supabase');
const { sendEmail, orderConfirmationHtml } = require('./_email');
const catalog = require('./_catalog.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 10);
  if (blocked) return blocked;

  try {
    const { items, shippingInfo, total, orderId, email } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
    const SITE_URL = process.env.URL || 'http://localhost:8888';

    // Validate items against catalog
    const validatedItems = [];
    for (const item of items) {
      const slug = item.product?.slug;
      const entry = catalog[slug];
      if (!entry) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Unknown product: ' + (slug || 'unknown') }) };
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid quantity for ' + slug }) };
      }
      if (entry.stock < qty) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Insufficient stock for ' + entry.name }) };
      }
      validatedItems.push({ slug, name: entry.name, size: item.size || '', qty, price: entry.price });
    }

    if (!MONOBANK_TOKEN) {
      console.error('[Monobank] MONOBANK_TOKEN env var not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Monobank не налаштовано' }),
      };
    }

    const serverTotal = validatedItems.reduce((s, i) => s + i.price * i.qty, 0);
    const amountKopecks = Math.round(serverTotal * 100);

    const basketOrder = validatedItems.map((i) => ({
      name: i.name + (i.size ? ' (' + i.size + ')' : ''),
      qty: i.qty,
      sum: Math.round(i.price * i.qty * 100),
      icon: '',
      unit: 'шт.',
      code: i.slug,
    }));

    // Create Monobank invoice FIRST (no orphaned order if it fails)
    const monoBody = {
      amount: amountKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference: orderId,
        destination: 'Замовлення #' + orderId + ' — BUKSY',
        basketOrder,
      },
      redirectUrl: SITE_URL + '/checkout',
      webHookUrl: SITE_URL + '/.netlify/functions/monobank-callback',
      validity: 3600,
      paymentType: 'debit',
    };

    const monoRes = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': MONOBANK_TOKEN,
      },
      body: JSON.stringify(monoBody),
    });

    if (!monoRes.ok) {
      const errText = await monoRes.text();
      console.error('Monobank invoice failed:', monoRes.status, errText);
      let msg = 'Монобанк: ';
      if (monoRes.status === 403) msg = msg + 'невірний токен (403)';
      else if (monoRes.status === 400) msg = msg + 'помилка в даних (400)';
      else msg = msg + 'помилка ' + monoRes.status;
      return { statusCode: 502, body: JSON.stringify({ error: msg }) };
    }

    const monoData = await monoRes.json();

    // Save order AFTER invoice created (fire-and-forget — callback handles payment)
    saveOrder({
      order_id: orderId,
      status: 'awaiting_payment',
      payment_method: 'monobank',
      customer: {
        email: email || '',
        firstName: (shippingInfo && shippingInfo.firstName) || '',
        lastName: (shippingInfo && shippingInfo.lastName) || '',
        phone: (shippingInfo && shippingInfo.phone) || '',
      },
      shipping: shippingInfo ? {
        address: shippingInfo.address || '',
        apartment: shippingInfo.apartment || '',
        city: shippingInfo.city || '',
        country: shippingInfo.country || '',
        postalCode: shippingInfo.postalCode || '',
      } : {},
      items: validatedItems.map((i) => ({ slug: i.slug, name: i.name, size: i.size, price: i.price, qty: i.qty })),
      shipping_cost: 0,
      tax: 0,
      subtotal: serverTotal,
      total: serverTotal,
      created_at: new Date().toISOString(),
    }).catch(function (err) { console.error('Save order failed:', err.message); });

    // Send immediate order confirmation email
    if (email) {
      var emailItems = validatedItems.map(function (i) {
        return { product: { name: i.name, price: i.price }, size: i.size, quantity: i.qty };
      });
      sendEmail({
        to: email,
        subject: '\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #' + orderId + ' \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E \u2014 BUKSY',
        html: orderConfirmationHtml({ orderId: orderId, items: emailItems, total: serverTotal, shippingInfo: shippingInfo || {} }),
      }).catch(function (err) { console.error('Order email failed:', err.message); });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl: monoData.pageUrl }),
    };
  } catch (error) {
    console.error('monobank-checkout error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Внутрішня помилка сервера' }) };
  }
};
