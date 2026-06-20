/**
 * @module _constants
 * All magic numbers, error codes, and configuration constants.
 */

/** @enum {string} PostgreSQL / Supabase error codes */
const ERROR_CODES = Object.freeze({
  UNIQUE_VIOLATION: '23505',
  NO_ROWS: 'PGRST116',
});

/** Rate-limiting configuration */
const RATE_LIMIT = Object.freeze({
  /** Max requests per minute for checkout */
  CHECKOUT: 10,
  /** Max requests per minute for contact form */
  CONTACT: 5,
  /** Max requests per minute for webhook callback */
  WEBHOOK: 30,
});

/** Input field length limits */
const FIELD_LIMITS = Object.freeze({
  EMAIL: 256,
  NAME: 128,
  PHONE: 32,
  ADDRESS: 256,
  APARTMENT: 64,
  CITY: 128,
  COUNTRY: 128,
  POSTAL_CODE: 32,
  NOVA_POSHTA_BRANCH: 32,
  PRODUCT_SIZE: 64,
  PRODUCT_NAME: 256,
  IDEMPOTENCY_KEY: 128,
  MESSAGE: 4096,
  SUBJECT: 256,
  PAYMENT_ID: 128,
  TRACKING_NUMBER: 64,
});

/** Order validation limits */
const ORDER_LIMITS = Object.freeze({
  /** Maximum items per order */
  MAX_ITEMS: 20,
  /** Maximum quantity per item */
  MAX_QUANTITY: 10,
  /** Minimum quantity */
  MIN_QUANTITY: 1,
  /** Maximum request body size in bytes */
  MAX_BODY_SIZE: 65536,
  /** Contact form max body size */
  MAX_CONTACT_BODY: 16384,
});

/** Payment configuration */
const PAYMENT = Object.freeze({
  /** Monobank invoice validity in seconds */
  INVOICE_VALIDITY: 3600,
  /** Amount verification tolerance (99%) */
  AMOUNT_TOLERANCE: 0.99,
  /** Default product stock when inventory row is first created */
  DEFAULT_STOCK: 99,
  /** Monobank currency code (UAH) */
  CCY: 980,
});

/** Order status constants */
const ORDER_STATUS = Object.freeze({
  NEW: 'new',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled',
});

/** Payment method constants */
const PAYMENT_METHOD = Object.freeze({
  MONOBANK: 'monobank',
  CARD: 'card',
});

/** PubKey cache TTL (1 hour) */
const PUBKEY_CACHE_TTL = 3600000;

module.exports = {
  ERROR_CODES,
  RATE_LIMIT,
  FIELD_LIMITS,
  ORDER_LIMITS,
  PAYMENT,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PUBKEY_CACHE_TTL,
};
