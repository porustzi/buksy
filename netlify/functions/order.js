function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, shippingInfo, total, paymentMethod } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const orderId = 'BUK-' + Date.now().toString().slice(-6);
    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

    const itemsList = items
      .map((i) => `   ${i.quantity}× ${esc(i.product.name)} (${esc(i.size)}) — $${i.product.price * i.quantity}`)
      .join('\n');

    const paymentLabel = paymentMethod === 'liqpay' ? '💳 LiqPay (очікує підтвердження)' : '💳 Оплата при отриманні';

    const msg = [
      '🛒 <b>НОВЕ ЗАМОВЛЕННЯ</b>',
      `<code>#${orderId}</code>`,
      '',
      '<b>👤 Клієнт</b>',
      `   ${esc(shippingInfo.firstName)} ${esc(shippingInfo.lastName)}`,
      `   ${esc(shippingInfo.email)}`,
      shippingInfo.phone ? `   ${esc(shippingInfo.phone)}` : '',
      '',
      '<b>📍 Доставка</b>',
      `   ${esc(shippingInfo.address)}${shippingInfo.apartment ? ', ' + esc(shippingInfo.apartment) : ''}`,
      `   ${esc(shippingInfo.city)}, ${esc(shippingInfo.country)}, ${esc(shippingInfo.postalCode)}`,
      '',
      '<b>🛍 Товари</b>',
      itemsList,
      '',
      paymentLabel,
      '━━━━━━━━━━━━━━━━',
      `💰 <b>$${total.toFixed(2)}</b>`,
    ].filter(Boolean).join('\n');

    if (TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId, message: 'Order placed successfully!' }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
