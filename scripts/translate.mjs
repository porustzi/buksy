import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const cachePath = join(root, 'content', '.translations-cache.json');

let cache = {};
try {
  if (existsSync(cachePath)) cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
} catch { cache = {}; }

const SKIP_KEYS = new Set([
  'slug', 'id', 'category', 'value', 'year', 'rating', 'reviewCount',
  'price', 'originalPrice', 'stock', 'image', 'image1', 'image2', 'image3',
  'images', 'icon', 'href', 'url', 'instagram', 'tiktok', 'telegram',
  'email', 'emailUser', 'emailDomain', 'code', 'date', 'verified', 'video',
]);

function looksNonTranslatable(v) {
  if (typeof v !== 'string') return false;
  return /^https?:\/\//i.test(v)
    || /^\/[^\s]*/.test(v)
    || /\.(jpg|jpeg|png|webp|svg|gif)(\?.*)?$/i.test(v)
    || /^[\d]+$/.test(v)
    || /^[+\d\s\-()]{6,}$/.test(v)
    || /^[A-Za-z0-9_\-]+$/.test(v);
}

function hasCyrillic(v) {
  return /[\u0400-\u04FF\u0456\u0457\u0454\u0490\u0491]/.test(v);
}

export async function translateText(text, targetLang, sourceLang = 'uk') {
  if (!text || typeof text !== 'string' || !text.trim()) return text;
  if (!hasCyrillic(text)) return text;
  const key = `${targetLang}:${text}`;
  if (cache[key]) return cache[key];
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = (Array.isArray(data) && Array.isArray(data[0])
      ? data[0].map((seg) => seg && seg[0] ? seg[0] : '').join('')
      : '');
    if (translated && translated.trim()) {
      cache[key] = translated.trim();
      return translated.trim();
    }
    return text;
  } catch {
    return text;
  }
}

export async function translateDeep(value, targetLang, key = '') {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (SKIP_KEYS.has(key) || looksNonTranslatable(value)) return value;
    return translateText(value, targetLang);
  }
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) result.push(await translateDeep(item, targetLang, key));
    return result;
  }
  if (typeof value === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = await translateDeep(v, targetLang, k);
    }
    return result;
  }
  return value;
}

export function saveCache() {
  try {
    mkdirSync(join(root, 'content'), { recursive: true });
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    console.error('[translate] cache save failed:', e.message);
  }
}
