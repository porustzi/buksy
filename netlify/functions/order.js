const { esc, guard } = require('./_utils');
const { saveOrder, decreaseStock } = require('./_supabase');
const { sendEmail, orderConfirmationHtml } = require('./_email');

function calcServerTotal(items, shippingMethod) {
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * Number(i.quantity), 0);
  const shipping = subtotal >= 150 ? 0 : (shippingMethod === 'express' ? 25 : 15);
  const tax = subtotal * 0.08;
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const blocked = guard(event, 10);
  if (blocked) return blocked;

  try {
    const { items, shippingInfo, paymentMethod, shippingMethod } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Shipping info is required' }) };
    }

    const info = shippingInfo;

    for (const item of items) {
      const price = Number(item.product?.price);
      const qty = Number(item.quantity);
      if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid item data' }) };
      }
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const orderId = 'BUK-' + Date.now().toString().slice(-6);
    const { total } = calcServerTotal(items, shippingMethod);

    const itemsList = items
      .map((i) => `   ${i.quantity}× ${esc(i.product.name)} (${esc(i.size)}) — $${(Number(i.product.price) * Number(i.quantity)).toFixed(2)}`)
      .join('\n');

    const paymentLabel = paymentMethod === 'liqpay' ? '💳 LiqPay (очікує підтвердження)' : '💳 Оплата при отриманні';

    const firstName = esc(String(info.firstName || ''));
    const lastName = esc(String(info.lastName || ''));
    const email = String(info.email || '');
    const safeEmail = esc(email);
    const phone = info.phone && String(info.phone).trim() ? esc(String(info.phone)) : '';
    const address = esc(String(info.address || ''));
    const apartment = info.apartment ? ', ' + esc(String(info.apartment)) : '';
    const city = esc(String(info.city || ''));
    const country = esc(String(info.country || ''));
    const postalCode = esc(String(info.postalCode || ''));

    const msg = [
      '🛒 <b>НОВЕ ЗАМОВЛЕННЯ</b>',
      `<code>#${orderId}</code>`,
      '',
      '<b>👤 Клієнт</b>',
      `   ${firstName} ${lastName}`,
      `   ${safeEmail}`,
      phone ? `   ${phone}` : '',
      '',
      '<b>📍 Доставка</b>',
      `   ${address}${apartment}`,
      `   ${city}, ${country}, ${postalCode}`,
      '',
      '<b>🛍 Товари</b>',
      itemsList,
      '',
      paymentLabel,
      '━━━━━━━━━━━━━━━━',
      `💰 <b>$${total.toFixed(2)}</b>`,
    ].filter(Boolean).join('\n');

    // Telegram
    if (TOKEN && CHAT_ID) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
        });
        if (!tgRes.ok) console.error('Telegram order notification failed:', tgRes.status);
      } catch (err) {
        console.error('Telegram order notification failed:', err.message);
      }
    }

    // Save to Supabase
    saveOrder({
      order_id: orderId,
      status: paymentMethod === 'liqpay' ? 'awaiting_payment' : 'new',
      payment_method: paymentMethod || 'cod',
      shipping_method: shippingMethod || 'standard',
      customer: { firstName: info.firstName, lastName: info.lastName, email, phone: info.phone },
      shipping: { address: info.address, apartment: info.apartment, city: info.city, country: info.country, postalCode: info.postalCode },
      items: items.map((i) => ({ slug: i.product.slug, name: i.product.name, size: i.size, price: i.product.price, qty: i.quantity })),
      subtotal: calcServerTotal(items, shippingMethod).subtotal,
      shipping_cost: calcServerTotal(items, shippingMethod).shipping,
      tax: calcServerTotal(items, shippingMethod).tax,
      total,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // Decrease stock
    decreaseStock(items).catch(() => {});

    // Email
    if (email) {
      sendEmail({
        to: email,
        subject: `Замовлення #${orderId} підтверджено — BUKSY`,
        html: orderConfirmationHtml({ orderId, items, total, shippingInfo: info }),
      }).catch(() => {});
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId, total, message: 'Order placed successfully!' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
