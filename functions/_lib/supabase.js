import { DatabaseError, DuplicateOrderError, OrderNotFoundError, StockInsufficientError, AmountMismatchError, ValidationError } from './errors.js';
import { ERROR_CODES, RPC_ERRORS, DB_TIMEOUT } from './constants.js';
import { validateOrderId, validateIdempotencyKey } from './utils.js';

let baseUrl = null;
let apiKey = null;

function getConfig(env) {
  if (baseUrl && apiKey) return { baseUrl, apiKey };
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new DatabaseError('Supabase not configured', 'DB_CONFIG');
  baseUrl = url.replace(/\/$/, '');
  apiKey = key;
  return { baseUrl, apiKey };
}

async function supabaseFetch(env, path, options) {
  const { baseUrl, apiKey } = getConfig(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DB_TIMEOUT);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': options.headers?.Prefer || 'return=representation',
        ...options.headers,
      },
    });
    const text = await res.text();
    if (!res.ok) {
      let errBody;
      try { errBody = JSON.parse(text); } catch { errBody = { message: text }; }
      const error = { code: errBody.code || '', message: errBody.message || text, status: res.status };
      throw error;
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timeout);
  }
}

function classifyRpcError(error, amountPaid, orderTotal) {
  if (!error) return;
  const code = error.code || '';
  if (code === RPC_ERRORS.STOCK_INSUFFICIENT) throw new StockInsufficientError('stock');
  if (code === RPC_ERRORS.AMOUNT_MISMATCH) throw new AmountMismatchError(amountPaid || 0, orderTotal || 0);
  if (code === RPC_ERRORS.ORDER_ALREADY_PAID) return;
  if (code === ERROR_CODES.UNIQUE_VIOLATION) {
    const msg = error.message || '';
    if (msg.includes('idempotency_key') || msg.includes('payment_id')) throw new DuplicateOrderError('via unique');
  }
  throw new DatabaseError(error.message || 'DB error', code || 'DB_ERROR', error);
}

// ============================================================================
// Order Operations
// ============================================================================
export async function saveOrder(env, order) {
  validateOrderId(order.order_id);
  validateIdempotencyKey(order.idempotency_key);
  try {
    const data = await supabaseFetch(env, '/rest/v1/orders', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(order),
    });
    const row = Array.isArray(data) ? data[0] : data;
    return { order_id: row.order_id, total: row.total, status: row.status };
  } catch (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION && (error.message || '').includes('idempotency_key')) {
      throw new DuplicateOrderError(order.idempotency_key || 'unknown');
    }
    classifyRpcError(error);
    throw error;
  }
}

export async function getOrderByIdempotencyKey(env, key) {
  validateIdempotencyKey(key);
  try {
    const data = await supabaseFetch(env, `/rest/v1/orders?idempotency_key=eq.${encodeURIComponent(key)}&select=*`, { method: 'GET' });
    return Array.isArray(data) && data.length ? data[0] : null;
  } catch (error) {
    classifyRpcError(error);
    throw error;
  }
}

export async function getOrderByRef(env, orderId) {
  validateOrderId(orderId);
  try {
    const data = await supabaseFetch(env, `/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}&select=*`, { method: 'GET' });
    if (!Array.isArray(data) || !data.length) throw new OrderNotFoundError(orderId);
    return data[0];
  } catch (error) {
    if (error instanceof OrderNotFoundError) throw error;
    classifyRpcError(error);
    throw error;
  }
}

export async function updateOrderStatus(env, orderId, updates) {
  validateOrderId(orderId);
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) throw new ValidationError('No update fields', 'updates');
  try {
    const data = await supabaseFetch(env, `/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!Array.isArray(data) || !data.length) throw new OrderNotFoundError(orderId);
    return true;
  } catch (error) {
    if (error instanceof OrderNotFoundError) throw error;
    classifyRpcError(error);
    throw error;
  }
}

// ============================================================================
// Payment Operations
// ============================================================================
export async function markOrderPaidWithStock(env, orderId, paymentId, amountPaid, orderTotal, items) {
  validateOrderId(orderId);
  if (!paymentId || typeof paymentId !== 'string') throw new ValidationError('Invalid payment_id', 'paymentId');
  if (typeof amountPaid !== 'number' || amountPaid <= 0) throw new ValidationError('Invalid amount_paid', 'amountPaid');
  if (typeof orderTotal !== 'number' || orderTotal <= 0) throw new ValidationError('Invalid order_total', 'orderTotal');
  if (items && (!Array.isArray(items) || !items.length)) throw new ValidationError('Items must be non-empty array', 'items');

  try {
    const rpcPayload = {
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount_paid: amountPaid,
      p_order_total: orderTotal,
      p_items: items && items.length ? items : null,
    };
    const data = await supabaseFetch(env, '/rest/v1/rpc/mark_order_paid_with_stock', {
      method: 'POST',
      body: JSON.stringify(rpcPayload),
    });
    return !!data;
  } catch (error) {
    classifyRpcError(error, amountPaid, orderTotal);
    throw error;
  }
}

// ============================================================================
// Inventory Operations
// ============================================================================
export async function decreaseStockBulk(env, items) {
  if (!items || !Array.isArray(items) || !items.length) throw new ValidationError('Items must be non-empty array', 'items');
  const payload = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const slug = it.slug || it.product?.slug;
    const qty = Number(it.quantity || it.qty) || 0;
    const def = Number(it.default_stock) || 99;
    if (!slug) throw new ValidationError('Missing slug at ' + i, 'items[' + i + ']');
    if (qty <= 0) throw new ValidationError('Invalid qty at ' + i, 'items[' + i + ']');
    payload.push({ slug, qty, default_stock: def });
  }
  try {
    await supabaseFetch(env, '/rest/v1/rpc/decrease_stock_bulk', {
      method: 'POST',
      body: JSON.stringify({ p_items: payload }),
    });
    return true;
  } catch (error) {
    classifyRpcError(error);
    throw error;
  }
}

export async function getStock(env, slug) {
  if (!slug || typeof slug !== 'string') throw new ValidationError('Invalid slug', 'slug');
  try {
    const data = await supabaseFetch(env, '/rest/v1/rpc/get_stock', {
      method: 'POST',
      body: JSON.stringify({ product_slug: slug }),
    });
    return data;
  } catch (error) {
    classifyRpcError(error);
    throw error;
  }
}
