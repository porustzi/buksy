const cache = new Map<string, Record<string, any>>();

function flattenObj(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' && v.trim()) {
      result[key] = v;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(result, flattenObj(v, key));
    }
  }
  return result;
}

function unflattenObj(flat: Record<string, string>): any {
  const result: any = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = val;
  }
  return result;
}

async function batchTranslate(texts: Record<string, string>, to: string): Promise<Record<string, string>> {
  const entries = Object.entries(texts);
  const translated: Record<string, string> = {};

  for (const [key, text] of entries) {
    if (!text.trim()) {
      translated[key] = text;
      continue;
    }
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      const translatedText = data[0]?.map((s: any) => s[0]).join('') || text;
      translated[key] = translatedText;
    } catch {
      translated[key] = text;
    }
  }

  return translated;
}

export async function loadTranslations(lang: string, sourceObj: any, namespace = 'default'): Promise<any> {
  if (lang === 'uk') return sourceObj;

  const cacheKey = `buksy_trans_${lang}_${namespace}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      cache.set(cacheKey, parsed);
      return parsed;
    } catch { /* ignore corrupt cache */ }
  }

  const flat = flattenObj(sourceObj);
  const translated = await batchTranslate(flat, lang === 'ru' ? 'ru' : 'en');
  const result = unflattenObj(translated);

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch { /* storage full, ignore */ }
  cache.set(cacheKey, result);

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
