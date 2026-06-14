exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, shippingInfo, total } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const orderId = 'BUK-' + Date.now().toString().slice(-6);
    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const shippingMethod = total > subtotal * 1.08 ? 'Express' : (subtotal >= 150 ? 'Standard (безкоштовно)' : 'Standard ($15)');

    const itemsList = items
      .map((i) => `   ${i.quantity}× ${i.product.name} (${i.size}) — $${i.product.price * i.quantity}`)
      .join('\n');

    const msg = [
      '🛒 <b>НОВИЙ ЗАМОВЛЕННЯ</b>',
      `<code>#${orderId}</code>`,
      '',
      '<b>👤 Клієнт</b>',
      `   ${shippingInfo.firstName} ${shippingInfo.lastName}`,
      `   ${shippingInfo.email}`,
      shippingInfo.phone ? `   ${shippingInfo.phone}` : '',
      '',
      '<b>📍 Доставка</b>',
      `   ${shippingInfo.address}${shippingInfo.apartment ? ', ' + shippingInfo.apartment : ''}`,
      `   ${shippingInfo.city}, ${shippingInfo.country}, ${shippingInfo.postalCode}`,
      `   📦 ${shippingMethod}`,
      '',
      '<b>🛍 Товари</b>',
      itemsList,
      '',
      '<b>💳 Оплата при отриманні</b>',
      '━━━━━━━━━━━━━━━━',
      `💰 <b>$${total.toFixed(2)}</b>`,
    ].filter(Boolean).join('\n');

    if (TOKEN && CHAT_ID) {
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
      body: JSON.stringify({
        success: true,
        orderId,
        message: 'Order placed successfully!',
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
