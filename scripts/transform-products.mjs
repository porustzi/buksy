import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { translateDeep, saveCache } from './translate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const prodDir = join(root, 'content', 'products');
const outPath = join(root, 'src', 'data', 'products.ts');

const entries = existsSync(prodDir) ? readdirSync(prodDir) : [];
const jsonFiles = entries.filter(f => f.endsWith('.json'));
const mdFiles = entries.filter(f => f.endsWith('.md'));

function processEntry(rawData) {
  const p = rawData;
  if (!p.images) p.images = [p.image1, p.image2, p.image3].filter(Boolean);
  else if (p.images[0] && typeof p.images[0] === 'object') p.images = p.images.map(img => img.src || img.url || img.image || '');
  if (Array.isArray(p.details)) p.details = p.details.map(d => typeof d === 'object' ? (d.detail || '') : d);
  if (Array.isArray(p.care)) p.care = p.care.map(c => typeof c === 'object' ? (c.instruction || '') : c);
  p.reviewCount = (p.reviews || []).length;

  // Per-size stock
  if (Array.isArray(p.sizes) && p.sizes.length) {
    let anySizeStock = false;
    for (const s of p.sizes) {
      if (s && s.stock !== undefined && s.stock !== null) anySizeStock = true;
    }
    if (anySizeStock) {
      p.stock = p.sizes.reduce((sum, s) => sum + (Number(s && s.stock) || 0), 0);
    } else {
      const per = Math.max(1, Math.floor((Number(p.stock) || 0) / p.sizes.length));
      for (const s of p.sizes) s.stock = per;
      p.stock = per * p.sizes.length;
    }
  }
  if (p.stock === undefined || p.stock === null) p.stock = 99;
  return p;
}

const products = [];

for (const f of jsonFiles) {
  let raw = readFileSync(join(prodDir, f), 'utf-8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  products.push(processEntry(JSON.parse(raw)));
}

for (const f of mdFiles) {
  const raw = readFileSync(join(prodDir, f), 'utf-8');
  const { data } = matter(raw);
  if (data && data.name) {
    products.push(processEntry(data));
  }
}

const getCatName = (cat) => {
  const m = { 't-shirts': 'T-Shirts', shorts: 'Shorts', longsleeves: 'Long Sleeves' };
  return m[cat] || cat;
};

const categories = [{ id: 'all', name: 'All' }, ...[...new Set(products.map(p => p.category))].map(id => ({ id, name: getCatName(id) }))];

const homepagePath = join(root, 'content', 'pages', 'homepage.json');
let heroImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
let editorialImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800';

if (existsSync(homepagePath)) {
  const homepage = JSON.parse(readFileSync(homepagePath, 'utf-8'));
  heroImage = homepage.hero?.image || heroImage;
  editorialImage = homepage.philosophy?.image || editorialImage;
}

async function build() {
  const enProducts = [];
  const plProducts = [];
  for (const p of products) {
    enProducts.push(await translateDeep(p, 'en'));
    plProducts.push(await translateDeep(p, 'pl'));
  }

  saveCache();

  const content = `import { Product, Review } from '../types';

export const products: Product[] = ${JSON.stringify(products, null, 2)};

export const productsByLang: Record<string, Product[]> = {
  uk: ${JSON.stringify(products)},
  en: ${JSON.stringify(enProducts)},
  pl: ${JSON.stringify(plProducts)},
};

export const reviews: Review[] = products.flatMap(p => (p.reviews || []).map((r: Review) => ({ ...r, productId: p.id, productSlug: p.slug })));

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = ${JSON.stringify(Object.fromEntries([...new Set(products.map(p => p.category))].map(c => [c, getCatName(c)])))};
  return names[category] || category;
};

export const categories = ${JSON.stringify(categories)};

export const heroImage = '${heroImage}';
export const editorialImage = '${editorialImage}';
`;

  writeFileSync(outPath, content, 'utf-8');
  console.log(`✅ Generated products.ts — ${products.length} products × 3 languages`);

  const catalogPath = join(root, '_catalog.json');
  const catalog = {};
  for (const p of products) {
    const sizeMap = {};
    for (const s of (p.sizes || [])) {
      if (s && s.name) sizeMap[s.name] = Number(s.stock ?? 0);
    }
    catalog[p.slug] = { name: p.name, price: Number(p.price), stock: Number(p.stock ?? 99), sizes: sizeMap };
  }
  writeFileSync(catalogPath, JSON.stringify(catalog), 'utf-8');
  console.log(`✅ Generated _catalog.json — ${Object.keys(catalog).length} products`);

  const fnCatalogPath = join(root, 'functions', 'lib', '_catalog.json');
  writeFileSync(fnCatalogPath, JSON.stringify(catalog), 'utf-8');
  console.log(`✅ Copied _catalog.json to functions/lib/`);
}

build().catch((e) => {
  console.error('❌ Products transform failed:', e.message);
  process.exit(1);
});
