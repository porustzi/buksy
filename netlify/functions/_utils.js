function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const rateMap = new Map();

function rateLimit(ip, maxPerMin = 10) {
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
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost === host || originHost.endsWith('.netlify.app');
  } catch { return false; }
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function guard(event, maxPerMin = 10) {
  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!rateLimit(ip, maxPerMin)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }
  if (!isSameOrigin(event)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }
  return null;
}

module.exports = { esc, rateLimit, isSameOrigin, validateEmail, guard };
