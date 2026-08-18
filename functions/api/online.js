import { countOnlineVisitors } from '../lib/supabase.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request, env } = context;

  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_PASSWORD || auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase not configured' }, 500);
  }

  try {
    const onlineVisitors = await countOnlineVisitors(env, 2);
    return json({ onlineVisitors });
  } catch (e) {
    console.error('[ONLINE]', e.message);
    return json({ error: 'failed' }, 500);
  }
}