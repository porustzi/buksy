import { createClient } from '@supabase/supabase-js';

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

  let supabase;
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (e) {
    return json({ error: 'Supabase init failed' }, 500);
  }

  const { data: orders, error } = await supabase.from('orders').select('*');
  if (error) return json({ error: error.message }, 500);

  const list = orders || [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;

  const inPeriod = (o, ms) => now - new Date(o.created_at).getTime() <= ms;
  const total = (o) => Number(o.total) || 0;
  const sumPeriod = (ms) => list.filter((o) => inPeriod(o, ms)).reduce((s, o) => s + total(o), 0);

  const revenue24h = sumPeriod(DAY);
  const revenueWeek = sumPeriod(WEEK);
  const revenueMonth = sumPeriod(MONTH);
  const revenueAll = list.reduce((s, o) => s + total(o), 0);

  const items24h = list
    .filter((o) => inPeriod(o, DAY))
    .reduce((s, o) => s + ((o.items || []).reduce((x, i) => x + (Number(i.qty) || 0), 0)), 0);

  const countryMap = {};
  for (const o of list) {
    const c = (o.shipping && o.shipping.country) || '—';
    if (!countryMap[c]) countryMap[c] = { country: c, orders: 0, revenue: 0 };
    countryMap[c].orders++;
    countryMap[c].revenue += total(o);
  }
  const countries = Object.values(countryMap).sort((a, b) => b.revenue - a.revenue);

  const biggestOrder = list.reduce(
    (max, o) => (total(o) > max.total ? { orderId: o.order_id, total: total(o) } : max),
    { orderId: null, total: 0 }
  );

  const productMap = {};
  for (const o of list) {
    for (const i of o.items || []) {
      const key = i.name || i.slug || '—';
      if (!productMap[key]) productMap[key] = { name: key, qty: 0, revenue: 0 };
      productMap[key].qty += Number(i.qty) || 0;
      productMap[key].revenue += (Number(i.price) || 0) * (Number(i.qty) || 0);
    }
  }
  const products = Object.values(productMap).sort((a, b) => b.qty - a.qty);

  return json({
    totalOrders: list.length,
    revenue24h,
    revenueWeek,
    revenueMonth,
    revenueAll,
    items24h,
    countries,
    biggestOrder,
    topProduct: products[0] || null,
    topProducts: products.slice(0, 10),
  });
}
