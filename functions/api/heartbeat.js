import { guard, errorResponse, jsonResponse } from '../lib/utils.js';
import { touchVisitor, purgeVisitors } from '../lib/supabase.js';
import { RATE_LIMIT } from '../lib/constants.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');

  const blocked = guard(request, env, RATE_LIMIT.HEARTBEAT);
  if (blocked) return blocked;

  let id = '';
  try {
    const b = await request.json();
    id = String(b.id || '').slice(0, 64);
  } catch {}

  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return errorResponse(400, 'Invalid id');

  try {
    await touchVisitor(env, id);
    if (Math.random() < 0.05) await purgeVisitors(env, 10).catch(() => {});
    return jsonResponse(200, { ok: true });
  } catch (e) {
    console.error('[HEARTBEAT]', e.message);
    return jsonResponse(200, { ok: false });
  }
}