/**
 * @module _supabase
 * Data Access Layer for Supabase.
 *
 * Principles:
 * - Throw typed errors (DatabaseError, OrderNotFoundError, etc.) for all failures.
 * - Return null ONLY for genuine not-found cases (PGRST116) where caller handles it.
 * - Never return null for DB connection/query errors.
 * - All functions are JSDoc-typed.
 */
var { createClient } = require('@supabase/supabase-js');
var {
  DatabaseError,
  OrderNotFoundError,
  DuplicateOrderError,
  StockInsufficientError,
  AmountMismatchError,
  ValidationError,
} = require('./_errors');
var { ERROR_CODES } = require('./_constants');

// ============================================================================
// Client Singleton
// ============================================================================

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
var client = null;

/**
 * Get or create the Supabase client (singleton).
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {DatabaseError} if Supabase is not configured
 */
function getClient() {
  if (client) return client;
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new DatabaseError('Supabase not configured — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing', 'DB_CONFIG');
  }
  client = createClient(url, key);
  return client;
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Wrap a Supabase query error into a typed DatabaseError.
 * @param {*} error — Supabase error object
 * @param {string} context — description of the operation
 * @throws {DuplicateOrderError|DatabaseError}
 */
function handleDbError(error, context) {
  if (!error) return;
  if (error.code === ERROR_CODES.UNIQUE_VIOLATION && error.message && error.message.indexOf('idempotency_key') !== -1) {
    throw new DuplicateOrderError('(unknown)');
  }
  throw new DatabaseError(context + ': ' + (error.message || 'unknown'), error.code || 'DB_ERROR', error);
}

// ============================================================================
// Order Operations
// ============================================================================

/**
 * Save a new order. Throws on DB error. Returns null on duplicate idempotency_key.
 *
 * @param {object} order — full order record
 * @param {string} order.order_id
 * @param {string} [order.idempotency_key]
 * @param {string} order.status
 * @param {string} order.payment_method
 * @param {object} order.customer
 * @param {object} order.shipping
 * @param {Array}  order.items
 * @param {number} order.subtotal
 * @param {number} order.total
 * @returns {Promise<{ order_id: string, total: number, status: string }|null>}
 *    null if idempotency_key collision detected
 * @throws {DatabaseError}
 */
async function saveOrder(order) {
  var supabase = getClient();
  var { data, error } = await supabase.from('orders').insert(order).select('order_id, total, status').single();
  if (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION && error.message && error.message.indexOf('idempotency_key') !== -1) {
      return null;
    }
    handleDbError(error, 'saveOrder');
  }
  return data;
}

/**
 * Find an order by idempotency_key.
 *
 * @param {string} key
 * @returns {Promise<object|null>} null if not found
 * @throws {DatabaseError}
 */
async function getOrderByIdempotencyKey(key) {
  var supabase = getClient();
  var { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('idempotency_key', key)
    .single();
  if (error) {
    if (error.code === ERROR_CODES.NO_ROWS) return null;
    handleDbError(error, 'getOrderByIdempotencyKey');
  }
  return data;
}

/**
 * Find an order by order_id.
 *
 * @param {string} orderId
 * @returns {Promise<object>} the order
 * @throws {OrderNotFoundError|DatabaseError}
 */
async function getOrderByRef(orderId) {
  var supabase = getClient();
  var { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();
  if (error) {
    if (error.code === ERROR_CODES.NO_ROWS) {
      throw new OrderNotFoundError(orderId);
    }
    handleDbError(error, 'getOrderByRef');
  }
  return data;
}

/**
 * Update order status fields.
 *
 * @param {string} orderId
 * @param {object} updates — { status?, tracking_number?, shipped_at? }
 * @returns {Promise<boolean>} true if updated, false if no rows matched
 * @throws {DatabaseError}
 */
async function updateOrderStatus(orderId, updates) {
  var supabase = getClient();
  var { error } = await supabase.from('orders').update(updates).eq('order_id', orderId);
  if (error) {
    handleDbError(error, 'updateOrderStatus');
  }
  return !error;
}

// ============================================================================
// Payment Operations
// ============================================================================

/**
 * Atomically mark an order as paid, verify the paid amount, and decrease stock.
 * All in a single database transaction.
 *
 * @param {string}  orderId
 * @param {string}  paymentId
 * @param {number}  amountPaid — amount received from payment provider (UAH)
 * @param {number}  orderTotal — expected order total from DB
 * @param {Array|null} items — [{ slug, qty, default_stock }] for stock decrease
 * @returns {Promise<boolean>} true if order was newly marked paid, false if already paid
 * @throws {AmountMismatchError|StockInsufficientError|DatabaseError}
 */
async function markOrderPaidWithStock(orderId, paymentId, amountPaid, orderTotal, items) {
  var supabase = getClient();
  var { data, error } = await supabase.rpc('mark_order_paid_with_stock', {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
    p_order_total: orderTotal,
    p_items: items && items.length ? items : null,
  });
  if (error) {
    var msg = error.message || '';
    if (msg.indexOf('Insufficient stock') !== -1) {
      throw new StockInsufficientError(msg.split('Insufficient stock for ')[1] || 'unknown');
    }
    if (msg.indexOf('Amount mismatch') !== -1) {
      throw new AmountMismatchError(amountPaid, orderTotal);
    }
    handleDbError(error, 'markOrderPaidWithStock');
  }
  return !!data;
}

// ============================================================================
// Inventory Operations
// ============================================================================

/**
 * Atomically decrease stock for multiple items in a single RPC call.
 *
 * @param {Array<{ slug: string, qty: number, default_stock?: number }>} items
 * @returns {Promise<Array<string>>} array of slugs that failed (empty if all succeeded)
 * @throws {DatabaseError}
 */
async function decreaseStock(items) {
  var supabase = getClient();
  var errors = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var slug = item.slug || item.product?.slug;
    var qty = Number(item.quantity || item.qty) || 0;
    var defaultStock = Number(item.default_stock) || 99;
    if (!slug || qty <= 0) continue;
    var resp = await supabase.rpc('decrease_stock', {
      product_slug: slug,
      qty: qty,
      default_stock: defaultStock,
    });
    if (resp.error) {
      console.error('decreaseStock failed for', slug, ':', resp.error.message);
      errors.push(slug);
    }
  }
  return errors;
}

/**
 * Get current inventory stock for a product.
 *
 * @param {string} slug
 * @returns {Promise<number>} current stock (99 if not yet in inventory)
 * @throws {DatabaseError}
 */
async function getStock(slug) {
  var supabase = getClient();
  var { data, error } = await supabase.rpc('get_stock', { product_slug: slug });
  if (error) {
    handleDbError(error, 'getStock');
  }
  return data;
}

module.exports = {
  getClient,
  saveOrder,
  getOrderByIdempotencyKey,
  getOrderByRef,
  updateOrderStatus,
  markOrderPaidWithStock,
  decreaseStock,
  getStock,
};
