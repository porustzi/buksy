import { countOnlineVisitors } from '../lib/supabase.js';

export async function onRequest(context) {
  const { env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ online: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const count = await countOnlineVisitors(env, 2);
    return new Response(JSON.stringify({ online: count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return new Response(JSON.stringify({ online: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
