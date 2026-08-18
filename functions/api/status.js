import { getSettings } from '../lib/settings.js';

function json(data) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { env } = context;
  const settings = await getSettings(env);
  return json({ closed: !!settings.closed, deliveryCost: Number(settings.deliveryCost) || 0 });
}
