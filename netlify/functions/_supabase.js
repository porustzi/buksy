/**
 * @module _supabase
 * Data Access Layer for Supabase.
 *
 * Principles:
 * - Throw typed errors (DatabaseError, OrderNotFoundError, etc.) for all failures.
 * - Return null ONLY for getOrderByIdempotencyKey not-found.
 * - All RPC calls wrapped in withTimeout.
 * - Input validation at the top of every function.
 * - Error classification by error.code (RPC_ERRORS), never string.includes().
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
var { ERROR_CODES, RPC_ERRORS, DB_TIMEOUT } = require('./_constants');

// ============================================================================
// Client Singleton
// ============================================================================

/** @type {import('@supabase/supabase-js').SupabaseClient|null} */
var client = null;

/**
 * Get or create the Supabase client (singleton).
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {DatabaseError}
 */
function getClient() {
  if (client) return client;
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new DatabaseError('Supabase not configured', 'DB_CONFIG');
  }
  client = createClient(url, key);
  return client;
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Promise with timeout. Rejects if fn takes longer than timeoutMs.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} timeoutMs
 * @returns {Promise<T>}
 */
function withTimeout(promise, timeoutMs) {
  var t = timeoutMs || DB_TIMEOUT;
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new DatabaseError('DB operation timed out after ' + t + 'ms', 'DB_TIMEOUT'));
      }, t);
    }),
  ]);
}

/**
 * Classify RPC error by its error code, not message text.
 * @param {*} error — Supabase error object with .code and .message
 * @param {number} [amountPaid]
 * @param {number} [orderTotal]
 * @throws {StockInsufficientError|AmountMismatchError|DuplicateOrderError|DatabaseError}
 */
function classifyRpcError(error, amountPaid, orderTotal) {
  if (!error) return;
  var code = error.code || '';

  if (code === RPC_ERRORS.STOCK_INSUFFICIENT) {
    throw new StockInsufficientError('stock');
  }
  if (code === RPC_ERRORS.AMOUNT_MISMATCH) {
    throw new AmountMismatchError(amountPaid || 0, orderTotal || 0);
  }
  if (code === RPC_ERRORS.ORDER_ALREADY_PAID) {
    return; // not an error — already paid (idempotent)
  }
  if (code === ERROR_CODES.UNIQUE_VIOLATION) {
    var msg = error.message || '';
    if (msg.indexOf('idempotency_key') !== -1 || msg.indexOf('payment_id') !== -1) {
      throw new DuplicateOrderError('(via unique constraint)');
    }
  }
  throw new DatabaseError(
    (error.message || 'Unknown DB error'),
    code || 'DB_ERROR',
    error
  );
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * @param {string} orderId
 * @throws {ValidationError}
 */
function _validateOrderId(orderId) {
  if (!orderId || typeof orderId !== 'string' || !/^BUK-[A-F0-9]{8}-[A-F0-9]{6}$/.test(orderId)) {
    throw new ValidationError('Invalid order_id: ' + orderId, 'orderId');
  }
}

/**
 * @param {string} key
 * @throws {ValidationError}
 */
function _validateIdempotencyKey(key) {
  if (key && (typeof key !== 'string' || key.length > 128)) {
    throw new ValidationError('Invalid idempotency_key', 'idempotencyKey');
  }
}

/**
 * @param {Array} items
 * @throws {ValidationError}
 */
function _validateItemsArray(items) {
  if (items && (!Array.isArray(items) || !items.length)) {
    throw new ValidationError('Items must be a non-empty array', 'items');
  }
}

// ============================================================================
// Order Operations
// ============================================================================

/**
 * Save a new order. Throws DuplicateOrderError on idempotency collision.
 *
 * @param {object} order
 * @param {string} order.order_id
 * @param {string} [order.idempotency_key]
 * @returns {Promise<{ order_id: string, total: number, status: string }>}
 * @throws {DuplicateOrderError|DatabaseError|ValidationError}
 */
async function saveOrder(order) {
  _validateOrderId(order.order_id);
  _validateIdempotencyKey(order.idempotency_key);

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.from('orders').insert(order).select('order_id, total, status').single()
  );
  if (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION && error.message && error.message.indexOf('idempotency_key') !== -1) {
      throw new DuplicateOrderError(order.idempotency_key || 'unknown');
    }
    classifyRpcError(error);
  }
  return data;
}

/**
 * Find an order by idempotency_key.
 *
 * @param {string} key
 * @returns {Promise<object|null>} null if not found
 * @throws {DatabaseError|ValidationError}
 */
async function getOrderByIdempotencyKey(key) {
  _validateIdempotencyKey(key);

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.from('orders').select('*').eq('idempotency_key', key).single()
  );
  if (error) {
    if (error.code === ERROR_CODES.NO_ROWS) return null;
    classifyRpcError(error);
  }
  return data;
}

/**
 * Find an order by order_id. Throws if not found.
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 * @throws {OrderNotFoundError|DatabaseError|ValidationError}
 */
async function getOrderByRef(orderId) {
  _validateOrderId(orderId);

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.from('orders').select('*').eq('order_id', orderId).single()
  );
  if (error) {
    if (error.code === ERROR_CODES.NO_ROWS) throw new OrderNotFoundError(orderId);
    classifyRpcError(error);
  }
  return data;
}

/**
 * Update order status. Throws if no rows were affected.
 *
 * @param {string} orderId
 * @param {object} updates — { status?, tracking_number?, shipped_at? }
 * @returns {Promise<boolean>} true
 * @throws {OrderNotFoundError|DatabaseError|ValidationError}
 */
async function updateOrderStatus(orderId, updates) {
  _validateOrderId(orderId);
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    throw new ValidationError('No update fields provided', 'updates');
  }

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.from('orders').update(updates).eq('order_id', orderId).select('id').single()
  );
  if (error) {
    if (error.code === ERROR_CODES.NO_ROWS) throw new OrderNotFoundError(orderId);
    classifyRpcError(error);
  }
  // data is null if .select('id').single() returns nothing ⇒ no rows matched
  if (!data) {
    throw new OrderNotFoundError(orderId);
  }
  return true;
}

// ============================================================================
// Payment Operations
// ============================================================================

/**
 * Atomically mark order as paid, verify amount, decrease stock.
 * All in a single DB transaction.
 *
 * @param {string}  orderId
 * @param {string}  paymentId
 * @param {number}  amountPaid
 * @param {number}  orderTotal
 * @param {Array|null} items — [{ slug, qty, default_stock }]
 * @returns {Promise<boolean>} true if newly paid, false if already paid
 * @throws {AmountMismatchError|StockInsufficientError|DatabaseError|ValidationError}
 */
async function markOrderPaidWithStock(orderId, paymentId, amountPaid, orderTotal, items) {
  _validateOrderId(orderId);
  if (!paymentId || typeof paymentId !== 'string') {
    throw new ValidationError('Invalid payment_id', 'paymentId');
  }
  if (typeof amountPaid !== 'number' || amountPaid <= 0) {
    throw new ValidationError('Invalid amount_paid: ' + amountPaid, 'amountPaid');
  }
  if (typeof orderTotal !== 'number' || orderTotal <= 0) {
    throw new ValidationError('Invalid order_total: ' + orderTotal, 'orderTotal');
  }
  _validateItemsArray(items);

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.rpc('mark_order_paid_with_stock', {
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount_paid: amountPaid,
      p_order_total: orderTotal,
      p_items: items && items.length ? items : null,
    })
  );
  if (error) {
    classifyRpcError(error, amountPaid, orderTotal);
  }
  return !!data;
}

// ============================================================================
// Inventory Operations
// ============================================================================

/**
 * Atomically decrease stock for ALL items in ONE RPC call.
 * Entire operation rolls back if any item fails.
 *
 * @param {Array<{ slug: string, qty: number, default_stock?: number }>} items
 * @returns {Promise<boolean>} true on success
 * @throws {StockInsufficientError|DatabaseError|ValidationError}
 */
async function decreaseStockBulk(items) {
  _validateItemsArray(items);

  var payload = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var slug = it.slug || it.product?.slug;
    var qty = Number(it.quantity || it.qty) || 0;
    var def = Number(it.default_stock) || require('./_constants').PAYMENT.DEFAULT_STOCK;
    if (!slug) throw new ValidationError('Missing slug at index ' + i, 'items[' + i + '].slug');
    if (qty <= 0) throw new ValidationError('Invalid qty at index ' + i, 'items[' + i + '].qty');
    payload.push({ slug: slug, qty: qty, default_stock: def });
  }

  var supabase = getClient();
  var { error } = await withTimeout(
    supabase.rpc('decrease_stock_bulk', { p_items: payload })
  );
  if (error) {
    classifyRpcError(error);
  }
  return true;
}

/**
 * Get current inventory stock.
 *
 * @param {string} slug
 * @returns {Promise<number>}
 * @throws {DatabaseError|ValidationError}
 */
async function getStock(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new ValidationError('Invalid slug', 'slug');
  }

  var supabase = getClient();
  var { data, error } = await withTimeout(
    supabase.rpc('get_stock', { product_slug: slug })
  );
  if (error) {
    classifyRpcError(error);
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
  decreaseStockBulk,
  getStock,
};
