const CACHE_KEY = 'buksy_translations';

interface TranslationCache {
  [lang: string]: { timestamp: number; data: any };
}

function loadCache(): TranslationCache {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

function saveCache(lang: string, data: any) {
  const c = loadCache(); c[lang] = { timestamp: Date.now(), data };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

function flattenObj(obj: any, prefix = ''): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' && v.trim()) r[key] = v;
    else if (typeof v === 'object' && v !== null) Object.assign(r, flattenObj(v, key));
  }
  return r;
}

function unflattenObj(flat: Record<string, string>): any {
  const r: any = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = r;
    for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]]; }
    cur[parts[parts.length - 1]] = val;
  }
  return r;
}

async function translateChunk(texts: string[], to: string): Promise<string[]> {
  const joined = texts.join(' ||| ');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${to}&dt=t&q=${encodeURIComponent(joined)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const full = data[0]?.map((s: any) => s[0]).join('') || joined;
    return full.split(' ||| ').map(s => s.replace(/^\s+/, ''));
  } catch {
    return texts;
  }
}

function chunk(arr: string[], size: number): string[][] {
  const r: string[][] = [];
  for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size));
  return r;
}

async function batchTranslate(texts: string[], to: string, onProgress?: (pct: number) => void): Promise<string[]> {
  const CHUNK = 8;
  const chunks = chunk(texts, CHUNK);
  const allResults: string[] = [];
  let done = 0;

  const worker = async (startIdx: number): Promise<void> => {
    for (let i = startIdx; i < chunks.length; i += 3) {
      const results = await translateChunk(chunks[i], to);
      for (let j = 0; j < chunks[i].length; j++) {
        allResults[i * CHUNK + j] = results[j] || chunks[i][j];
      }
      done += chunks[i].length;
      onProgress?.(Math.round((done / texts.length) * 100));
    }
  };

  await Promise.all([worker(0), worker(1), worker(2)]);
  return allResults;
}

export async function loadTranslations(lang: string, sourceObj: any): Promise<any> {
  if (lang === 'uk') return sourceObj;

  const cache = loadCache();
  if (cache[lang]?.data) return cache[lang].data;

  const flat = flattenObj(sourceObj);
  const keys = Object.keys(flat);
  const values = Object.values(flat);

  const translated = await batchTranslate(values, lang === 'ru' ? 'ru' : 'en');

  const resultFlat: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) resultFlat[keys[i]] = translated[i] || values[i];

  const result = unflattenObj(resultFlat);
  saveCache(lang, result);
  return result;
}

export function translateProduct(product: any, lang: string, t: any): any {
  if (lang === 'uk') return { ...product, label: null };
  return {
    ...product,
    name: t(product.name),
    shortDescription: t(product.shortDescription),
    description: t(product.description),
    details: product.details?.map((d: string) => t(d)),
    care: product.care?.map((c: string) => t(c)),
    label: lang.toUpperCase(),
  };
}
