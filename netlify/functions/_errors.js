/**
 * @module _errors
 * Typed error classes for the payment system.
 * Replaces string-matching across all handlers.
 */

/**
 * Base error for all database-related failures.
 * @extends Error
 */
class DatabaseError extends Error {
  /** @param {string} message */
  /** @param {string} [code] — Supabase/PG error code */
  /** @param {*} [cause] — original error */
  constructor(message, code, cause) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code || 'DB_UNKNOWN';
    this.cause = cause || null;
  }
}

/**
 * Thrown when an order is not found by order_id or idempotency_key.
 * @extends DatabaseError
 */
class OrderNotFoundError extends DatabaseError {
  /** @param {string} orderId */
  constructor(orderId) {
    super(`Order not found: ${orderId}`, 'ORDER_NOT_FOUND');
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Thrown when a duplicate idempotency_key is detected.
 * @extends DatabaseError
 */
class DuplicateOrderError extends DatabaseError {
  /** @param {string} idempotencyKey */
  constructor(idempotencyKey) {
    super(`Duplicate order: idempotency_key=${idempotencyKey}`, 'DUPLICATE_ORDER');
    this.name = 'DuplicateOrderError';
  }
}

/**
 * Thrown when stock is insufficient for one or more items.
 * @extends DatabaseError
 */
class StockInsufficientError extends DatabaseError {
  /** @param {string} slug */
  constructor(slug) {
    super(`Insufficient stock for: ${slug}`, 'STOCK_INSUFFICIENT');
    this.name = 'StockInsufficientError';
  }
}

/**
 * Thrown when paid amount does not match order total.
 * @extends DatabaseError
 */
class AmountMismatchError extends DatabaseError {
  /** @param {number} paid */
  /** @param {number} total */
  constructor(paid, total) {
    super(`Amount mismatch: paid ${paid}, order total ${total}`, 'AMOUNT_MISMATCH');
    this.name = 'AmountMismatchError';
  }
}

/**
 * Thrown when input validation fails.
 * @extends Error
 */
class ValidationError extends Error {
  /** @param {string} message */
  /** @param {string} field */
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field || null;
  }
}

/**
 * Thrown when rate limit is exceeded.
 * @extends Error
 */
class RateLimitError extends Error {
  constructor() {
    super('Too many requests');
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown on signature verification failure (webhooks).
 * @extends Error
 */
class SignatureError extends Error {
  constructor() {
    super('Invalid signature');
    this.name = 'SignatureError';
  }
}

module.exports = {
  DatabaseError,
  OrderNotFoundError,
  DuplicateOrderError,
  StockInsufficientError,
  AmountMismatchError,
  ValidationError,
  RateLimitError,
  SignatureError,
};
