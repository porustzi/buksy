import { guard, esc, parseBody, okResponse, errorResponse, sendTg } from '../lib/utils.js';
import { sendEmail } from '../lib/email.js';
import { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS } from '../lib/constants.js';

export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');

  const blocked = guard(request, env, RATE_LIMIT.CONTACT);
  if (blocked) return blocked;

  let parsed = await parseBody(request, ORDER_LIMITS.MAX_CONTACT_BODY);
  if (parsed.error) return errorResponse(400, parsed.error);
  const body = parsed.data;

  const name = (body.name || '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.NAME).trim();
  const email = (body.email || '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.EMAIL).trim();
  const subject = (body.subject || '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.SUBJECT).trim();
  const message = (body.message || '').replace(/[<>"']/g, '').slice(0, FIELD_LIMITS.MESSAGE).trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(400, 'Valid email required');
  if (!message) return errorResponse(400, 'Message required');

  // Telegram notification (waitUntil keeps Worker alive)
  const tgText = `📬 ПОВІДОМЛЕННЯ\n\n👤 ${name || 'Анонім'}\n📧 ${email}\n📋 ${subject || 'Без теми'}\n\n${message}`;
  waitUntil(sendTg(env, tgText));

  // Email notification to store
  const to = env.CONTACT_EMAIL || env.EMAIL_SMTP_USER || 'buksy.shop@gmail.com';
  waitUntil(sendEmail(env, {
    to,
    subject: 'Нове повідомлення: ' + (subject || 'Без теми') + ' — BUKSY',
    html: `<h2>Нове повідомлення з сайту</h2><p><strong>Ім'я:</strong> ${esc(name) || '—'}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Тема:</strong> ${esc(subject) || '—'}</p><p><strong>Повідомлення:</strong></p><blockquote style="padding:12px;background:#f5f5f5;border-left:3px solid #b10006">${esc(message).replace(/\n/g, '<br>')}</blockquote>`,
  }).catch(e => console.error('[EMAIL-CONTACT] send failed:', e.message)));

  return okResponse({ success: true });
}
