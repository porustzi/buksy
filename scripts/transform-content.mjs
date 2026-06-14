import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJson(dir, file) {
  return JSON.parse(readFileSync(join(root, dir, file), 'utf-8'));
}

function readDir(dir) {
  const full = join(root, dir);
  if (!readdirSync) return [];
  return readdirSync(full).filter(f => f.endsWith('.json')).map(f => readJson(dir, f));
}

const homepage = readJson('content/pages', 'homepage.json');
const about = readJson('content/pages', 'about.json');
const editorial = readJson('content/pages', 'editorial.json');
const contact = readJson('content/pages', 'contact.json');
const footer = readJson('content/pages', 'footer.json');
const faq = readDir('content/faq');
const timeline = readDir('content/timeline');
const values = readDir('content/values');

const outPath = join(root, 'src', 'data', 'content.ts');

const content = `export const homepage = ${JSON.stringify(homepage, null, 2)};

export const aboutPage = ${JSON.stringify(about, null, 2)};

export const editorialPage = ${JSON.stringify(editorial, null, 2)};

export const contactInfo = ${JSON.stringify(contact, null, 2)};

export const footerData = ${JSON.stringify(footer, null, 2)};

export const faqItems = ${JSON.stringify(faq, null, 2)};

export const timelineEvents = ${JSON.stringify(timeline, null, 2)};

export const valueItems = ${JSON.stringify(values, null, 2)};
`;

writeFileSync(outPath, content, 'utf-8');
console.log(`✅ Generated content.ts — homepage, about, editorial, contact, footer, faq, timeline, values`);
