const { createClient } = require('@supabase/supabase-js');

let client = null;

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('Supabase not configured — skipping DB operations');
    return null;
  }
  client = createClient(url, key);
  return client;
}

async function saveOrder(order) {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('orders').insert(order).select('id').single();
  if (error) { console.error('Supabase saveOrder error:', error.message); return null; }
  return data;
}

async function updateOrderStatus(orderId, updates) {
  const supabase = getClient();
  if (!supabase) return null;
  const { error } = await supabase.from('orders').update(updates).eq('order_id', orderId);
  if (error) console.error('Supabase updateOrder error:', error.message);
  return !error;
}

async function decreaseStock(items) {
  const supabase = getClient();
  if (!supabase) return;
  for (const item of items) {
    const slug = item.product?.slug;
    const qty = Number(item.quantity) || 0;
    if (!slug || qty <= 0) continue;
    const { error } = await supabase.rpc('decrease_stock', { product_slug: slug, qty });
    if (error) console.error(`Stock decrease failed for ${slug}:`, error.message);
  }
}

module.exports = { saveOrder, updateOrderStatus, decreaseStock };
