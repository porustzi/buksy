async function sendEmail({ to, subject, html }) {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'orders@buksy.studio';

  if (!webhookUrl) {
    console.log('[EMAIL] Not configured — skipped');
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[EMAIL] Failed: ${res.status}`);
      return false;
    }
    console.log(`[EMAIL] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Error:', err.message);
    return false;
  }
}

function orderConfirmationHtml({ orderId, items, total, shippingInfo, trackingNumber }) {
  const itemsHtml = items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #333">${i.quantity}× ${i.product.name} (${i.size || '-'})</td><td style="padding:8px;border-bottom:1px solid #333;text-align:right">$${(i.product.price * i.quantity).toFixed(2)}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#111;color:#eee;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;padding:30px">
    <h1 style="color:#b10006;font-size:24px;margin:0 0 20px">BUKSY</h1>
    <h2 style="font-size:18px;margin:0 0 10px">Замовлення підтверджено</h2>
    <p style="color:#999;margin:0 0 20px">Номер замовлення: <strong style="color:#b10006">#${orderId}</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">${itemsHtml}</table>
    <p style="text-align:right;font-size:18px"><strong>$${total.toFixed(2)}</strong></p>
    <hr style="border-color:#333;margin:20px 0">
    <p style="color:#999;font-size:14px;margin:0 0 10px"><strong>Доставка:</strong><br>${shippingInfo.firstName} ${shippingInfo.lastName}<br>${shippingInfo.address}${shippingInfo.apartment ? ', ' + shippingInfo.apartment : ''}<br>${shippingInfo.city}, ${shippingInfo.country}, ${shippingInfo.postalCode}</p>
    ${trackingNumber ? `<p style="color:#b10006;font-size:14px;margin:0 0 10px"><strong>ТТН Нова Пошта:</strong> ${trackingNumber}</p>` : ''}
    <hr style="border-color:#333;margin:20px 0">
    <p style="color:#666;font-size:12px">BUKSY — Dark Luxury Streetwear<br>info@buksy.studio</p>
  </div>
</body></html>`;
}

function paymentConfirmedHtml({ orderId, amount, currency, paymentId, items }) {
  const itemsHtml = items
    ? items.map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #333">${i.qty}× ${i.name} (${i.size || '-'})</td></tr>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#111;color:#eee;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;padding:30px">
    <h1 style="color:#b10006;font-size:24px;margin:0 0 20px">BUKSY</h1>
    <h2 style="font-size:18px;margin:0 0 10px">Оплата отримана ✅</h2>
    <p style="color:#999;margin:0 0 20px">Замовлення <strong style="color:#b10006">#${orderId}</strong> оплачено.</p>
    <p style="font-size:18px;margin:0 0 20px"><strong>${Number(amount).toFixed(2)} ${currency}</strong></p>
    ${paymentId ? `<p style="color:#999;font-size:12px">Платіж: ${paymentId}</p>` : ''}
    ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;margin:20px 0">${itemsHtml}</table>` : ''}
    <hr style="border-color:#333;margin:20px 0">
    <p style="color:#999;font-size:14px">Ми повідомимо вас, коли замовлення буде відправлено.</p>
    <hr style="border-color:#333;margin:20px 0">
    <p style="color:#666;font-size:12px">BUKSY — Dark Luxury Streetwear<br>info@buksy.studio</p>
  </div>
</body></html>`;
}

function trackingUpdateHtml({ orderId, trackingNumber }) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#111;color:#eee;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;padding:30px">
    <h1 style="color:#b10006;font-size:24px;margin:0 0 20px">BUKSY</h1>
    <h2 style="font-size:18px;margin:0 0 10px">Замовлення відправлено 📦</h2>
    <p style="color:#999;margin:0 0 20px">Замовлення <strong style="color:#b10006">#${orderId}</strong> в дорозі.</p>
    <p style="font-size:16px;margin:0 0 20px">ТТН Нова Пошта: <strong style="color:#b10006;font-size:20px">${trackingNumber}</strong></p>
    <p style="color:#999;font-size:14px">Відстежити можна на <a href="https://novaposhta.ua" style="color:#b10006">novaposhta.ua</a></p>
    <hr style="border-color:#333;margin:20px 0">
    <p style="color:#666;font-size:12px">BUKSY — Dark Luxury Streetwear<br>info@buksy.studio</p>
  </div>
</body></html>`;
}

module.exports = { sendEmail, orderConfirmationHtml, paymentConfirmedHtml, trackingUpdateHtml };
