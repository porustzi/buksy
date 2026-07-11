import { RATE_LIMIT } from '../lib/constants.js';

export async function onRequest(context) {
  return new Response(JSON.stringify({ ok: true, rateLimit: RATE_LIMIT }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
