/**
 * @module _utils
 * Security utilities: sanitization, validation, rate-limiting, parsing.
 */
var crypto = require('crypto');
var {
  ValidationError,
  RateLimitError,
} = require('./_errors');
var { RATE_LIMIT, FIELD_LIMITS, ORDER_LIMITS } = require('./_constants');

// ============================================================================
// HTML Escape
// ============================================================================

/**
 * Escape HTML special characters for safe rendering.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Strip dangerous characters and truncate to max length.
 * @param {string} s
 * @param {number} [maxLen]
 * @returns {string}
 */
function sanitize(s, maxLen) {
  if (typeof s !== 'string') return '';
  var cleaned = s.replace(/[<>"']/g, '');
  if (maxLen && maxLen > 0) cleaned = cleaned.slice(0, maxLen);
  return cleaned.trim();
}

/**
 * Sanitize all shipping info fields.
 * @param {object} info
 * @returns {object}
 */
function sanitizeShippingInfo(info) {
  if (!info || typeof info !== 'object') return {};
  return {
    firstName: sanitize(String(info.firstName || ''), FIELD_LIMITS.NAME),
    lastName: sanitize(String(info.lastName || ''), FIELD_LIMITS.NAME),
    email: sanitize(String(info.email || ''), FIELD_LIMITS.EMAIL),
    phone: sanitize(String(info.phone || ''), FIELD_LIMITS.PHONE),
    address: sanitize(String(info.address || ''), FIELD_LIMITS.ADDRESS),
    apartment: sanitize(String(info.apartment || ''), FIELD_LIMITS.APARTMENT),
    city: sanitize(String(info.city || ''), FIELD_LIMITS.CITY),
    country: sanitize(String(info.country || ''), FIELD_LIMITS.COUNTRY),
    postalCode: sanitize(String(info.postalCode || ''), FIELD_LIMITS.POSTAL_CODE),
    novaPoshtaBranch: sanitize(String(info.novaPoshtaBranch || ''), FIELD_LIMITS.NOVA_POSHTA_BRANCH),
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate order_id format: BUK-XXXXXXXX-XXXXXX
 * @param {string} orderId
 * @throws {ValidationError}
 */
function validateOrderId(orderId) {
  if (typeof orderId !== 'string' || !/^BUK-[A-F0-9]{8}-[A-F0-9]{6}$/.test(orderId)) {
    throw new ValidationError('Invalid order_id format: ' + orderId, 'orderId');
  }
}

/**
 * Validate payment/invoice ID.
 * @param {string} id
 * @param {string} field
 * @throws {ValidationError}
 */
function validatePaymentId(id, field) {
  if (!id || typeof id !== 'string' || id.length > FIELD_LIMITS.PAYMENT_ID) {
    throw new ValidationError('Invalid ' + (field || 'payment_id'), field || 'paymentId');
  }
}

/**
 * Validate amount (must be positive number).
 * @param {number} amount
 * @param {string} field
 * @throws {ValidationError}
 */
function validateAmount(amount, field) {
  var n = Number(amount);
  if (isNaN(n) || n <= 0) {
    throw new ValidationError('Invalid amount: ' + amount, field || 'amount');
  }
  return n;
}

/**
 * Validate items array.
 * @param {Array} items
 * @throws {ValidationError}
 */
function validateItems(items) {
  if (!items || !Array.isArray(items) || !items.length) {
    throw new ValidationError('Cart is empty', 'items');
  }
  if (items.length > ORDER_LIMITS.MAX_ITEMS) {
    throw new ValidationError('Too many items: max ' + ORDER_LIMITS.MAX_ITEMS, 'items');
  }
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var slug = item.product?.slug;
    if (!slug || typeof slug !== 'string') {
      throw new ValidationError('Missing product slug at index ' + i, 'items[' + i + '].slug');
    }
    var qty = Number(item.quantity);
    if (isNaN(qty) || qty < ORDER_LIMITS.MIN_QUANTITY || qty > ORDER_LIMITS.MAX_QUANTITY) {
      throw new ValidationError(
        'Invalid quantity for ' + slug + ': ' + item.quantity + ' (min ' + ORDER_LIMITS.MIN_QUANTITY + ', max ' + ORDER_LIMITS.MAX_QUANTITY + ')',
        'items[' + i + '].quantity'
      );
    }
  }
}

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate idempotency key.
 * @param {string} key
 * @throws {ValidationError}
 */
function validateIdempotencyKey(key) {
  if (key && (typeof key !== 'string' || key.length > FIELD_LIMITS.IDEMPOTENCY_KEY)) {
    throw new ValidationError('Invalid idempotency key', 'idempotencyKey');
  }
}

/**
 * Validate payment method.
 * @param {string} method
 * @returns {string} normalized method
 * @throws {ValidationError}
 */
function validatePaymentMethod(method) {
  if (!method || typeof method !== 'string') return 'card';
  var valid = ['monobank', 'card'];
  if (valid.indexOf(method) === -1) {
    throw new ValidationError('Invalid payment method: ' + method, 'paymentMethod');
  }
  return method;
}

// ============================================================================
// Body Parsing
// ============================================================================

/**
 * Parse and validate JSON request body with size limit.
 * @param {object} event — Netlify function event
 * @param {number} [maxBytes] — default 65536
 * @returns {{ data?: object, error?: string }}
 */
function parseBody(event, maxBytes) {
  if (!maxBytes) maxBytes = ORDER_LIMITS.MAX_BODY_SIZE;
  var body = event.body || '';
  if (Buffer.byteLength(body, 'utf8') > maxBytes) {
    return { error: 'Request body too large' };
  }
  try {
    var parsed = JSON.parse(body);
    if (typeof parsed !== 'object' || parsed === null) {
      return { error: 'Invalid JSON body' };
    }
    return { data: parsed };
  } catch (e) {
    return { error: 'Malformed JSON' };
  }
}

// ============================================================================
// Order ID Generation
// ============================================================================

/**
 * Generate a cryptographically random order ID.
 * @returns {string} Format: BUK-XXXXXXXX-XXXXXX
 */
function generateOrderId() {
  return 'BUK-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ============================================================================
// Rate Limiter (in-memory, per-instance)
// ============================================================================

var rateMap = new Map();
var lastCleanup = Date.now();

function cleanupRateMap() {
  var now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  rateMap.forEach(function (entry, ip) {
    if (now - entry.ts > 120000) rateMap.delete(ip);
  });
}

/**
 * Check if request is within rate limit.
 * @param {string} ip
 * @param {number} maxPerMin
 * @returns {boolean} true if allowed
 */
function rateLimit(ip, maxPerMin) {
  if (!maxPerMin) maxPerMin = RATE_LIMIT.CHECKOUT;
  cleanupRateMap();
  var now = Date.now();
  var entry = rateMap.get(ip);
  if (!entry || now - entry.ts > 60000) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= maxPerMin) return false;
  entry.count++;
  return true;
}

// ============================================================================
// Origin Check (CSRF protection)
// ============================================================================

/**
 * Verify request comes from the same origin.
 * @param {object} event
 * @returns {boolean}
 */
function isSameOrigin(event) {
  var origin = event.headers.origin || event.headers.referer || '';
  var host = event.headers.host || '';

  if (!origin) {
    if (process.env.NETLIFY_DEV === 'true') return true;
    return false;
  }

  if (process.env.NETLIFY_DEV === 'true') {
    try {
      var originHost = new URL(origin).hostname || new URL(origin).host;
      return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(originHost);
    } catch (e) { return false; }
  }

  try {
    var originHost = new URL(origin).host;
    return originHost === host;
  } catch (e) { return false; }
}

// ============================================================================
// Composite Guard
// ============================================================================

/**
 * Rate-limit + origin check. Returns null if allowed, error response if blocked.
 * @param {object} event
 * @param {number} [maxPerMin]
 * @returns {object|null}
 */
function guard(event, maxPerMin) {
  if (!maxPerMin) maxPerMin = RATE_LIMIT.CHECKOUT;
  var ip = event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip, maxPerMin)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  var sameOrigin = isSameOrigin(event);
  var apiKeyProvided = event.headers['x-api-key'] || '';
  var expectedKey = process.env.API_SECRET || '';

  if (!sameOrigin) {
    if (!expectedKey) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    if (!apiKeyProvided || apiKeyProvided !== expectedKey) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }
  }

  return null;
}

module.exports = {
  esc,
  sanitize,
  sanitizeShippingInfo,
  validateOrderId,
  validatePaymentId,
  validateAmount,
  validateItems,
  validateEmail,
  validateIdempotencyKey,
  validatePaymentMethod,
  parseBody,
  generateOrderId,
  rateLimit,
  isSameOrigin,
  guard,
};
