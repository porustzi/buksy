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

async function markOrderPaid(orderId, paymentId) {
  const supabase = getClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .neq('status', 'paid')
    .select('id')
    .single();
  if (error) {
    if (error.code === 'PGRST116') return false; // no rows = already paid
    console.error('Supabase markOrderPaid error:', error.message);
    return false;
  }
  return !!data;
}

async function decreaseStock(items) {
  const supabase = getClient();
  if (!supabase) return;
  for (const item of items) {
    const slug = item.product?.slug;
    const qty = Number(item.quantity) || 0;
    if (!slug || qty <= 0) continue;
    // Ensure product exists in inventory (insert with default stock if missing)
    await supabase.from('inventory')
      .upsert({ slug, name: slug, stock: 99, updated_at: new Date().toISOString() }, { onConflict: 'slug', ignoreDuplicates: true })
      .then(function () {}, function (err) { console.error('Inventory upsert failed for ' + slug + ':', err.message); });
    const { error } = await supabase.rpc('decrease_stock', { product_slug: slug, qty });
    if (error) console.error('Stock decrease failed for ' + slug + ':', error.message);
  }
}

async function getOrderByRef(orderId) {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();
  if (error) { console.error('Supabase getOrderByRef error:', error.message); return null; }
  return data;
}

module.exports = { saveOrder, updateOrderStatus, markOrderPaid, decreaseStock, getOrderByRef };
