/**
 * @module _catalog
 * Shared catalog validation — used by both monobank-checkout and order endpoints.
 */
var { sanitize } = require('./_utils');
var { getStock } = require('./_supabase');
var catalog = require('./_catalog.json');
var { FIELD_LIMITS, ORDER_LIMITS, PAYMENT } = require('./_constants');

/**
 * Validate cart items against catalog and DB stock.
 * Returns server-side validated items with catalog prices.
 *
 * @param {Array} items — raw items from request [{ product?: { slug }, quantity, size? }]
 * @param {'monobank'|'order'} shape — return shape
 * @returns {Promise<Array>}
 * @throws {{ statusCode: number, body: string }} HTTP error
 */
async function validateCatalogItems(items, shape) {
  shape = shape || 'monobank';
  var result = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var product = item.product;
    if (!product || typeof product !== 'object') {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Missing product info at index ' + i }) };
    }
    var slug = product.slug;
    if (!slug || typeof slug !== 'string') {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Missing product slug at index ' + i }) };
    }

    var entry = catalog[slug];
    if (!entry) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Unknown product: ' + slug }) };
    }

    var qty = Number(item.quantity);
    if (isNaN(qty) || qty < ORDER_LIMITS.MIN_QUANTITY || qty > ORDER_LIMITS.MAX_QUANTITY) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Invalid quantity for ' + slug + ': ' + item.quantity }) };
    }

    var catStock = Number(entry.stock) || 0;
    if (catStock < qty) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Insufficient stock for ' + entry.name + ': ' + catStock + ' available' }) };
    }

    var dbStock = await getStock(slug);
    if (dbStock !== null && dbStock < qty) {
      throw { statusCode: 400, body: JSON.stringify({ error: 'Insufficient stock for ' + entry.name + ': ' + dbStock + ' available (DB)' }) };
    }

    var sizeVal = item.size ? sanitize(String(item.size), FIELD_LIMITS.PRODUCT_SIZE) : '';
    var price = Number(entry.price) || 0;

    if (shape === 'order') {
      result.push({
        product: { slug: slug, name: entry.name, price: price, images: product.images || [] },
        size: sizeVal,
        quantity: qty,
        pricePerUnit: price,
      });
    } else {
      result.push({ slug: slug, name: entry.name, size: sizeVal, qty: qty, price: price });
    }
  }

  return result;
}

/**
 * Get catalog stock for a slug (for default_stock seeding).
 * @param {string} slug
 * @returns {number}
 */
function getCatalogStock(slug) {
  var entry = catalog[slug];
  return entry ? (Number(entry.stock) || PAYMENT.DEFAULT_STOCK) : PAYMENT.DEFAULT_STOCK;
}

module.exports = { validateCatalogItems, getCatalogStock };
