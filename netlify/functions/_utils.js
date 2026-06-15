function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const rateMap = new Map();
let lastCleanup = Date.now();

function cleanupRateMap() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [ip, entry] of rateMap) {
    if (now - entry.ts > 120000) rateMap.delete(ip);
  }
}

function rateLimit(ip, maxPerMin) {
  if (!maxPerMin) maxPerMin = 10;
  cleanupRateMap();
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > 60000) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= maxPerMin) return false;
  entry.count++;
  return true;
}

function isSameOrigin(event) {
  const origin = event.headers.origin || event.headers.referer || '';
  const host = event.headers.host || '';
  if (!origin) return false; // block requests without Origin header
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch { return false; }
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function guard(event, maxPerMin) {
  if (!maxPerMin) maxPerMin = 10;
  // Only use client-ip (set by Netlify edge, not spoofable)
  const ip = event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip, maxPerMin)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }
  if (!isSameOrigin(event)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }
  return null;
}

module.exports = { esc, rateLimit, isSameOrigin, validateEmail, guard };
