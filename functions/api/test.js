export async function onRequest(context) {
  try {
    const url = context.env.SUPABASE_URL;
    const key = context.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response(JSON.stringify({ error: 'Missing env vars', url: !!url, key: !!key }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    
    const res = await fetch(url + '/rest/v1/orders?select=order_id&limit=1', {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key },
    });
    const text = await res.text();
    return new Response(JSON.stringify({ status: res.status, body: text.slice(0, 500), url: url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
