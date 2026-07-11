import { getStock } from '../lib/supabase.js';

export async function onRequest(context) {
  try {
    const stock = await getStock(context.env, 'buksyshirt');
    return new Response(JSON.stringify({ ok: true, stock }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message, code: e.code }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
}
