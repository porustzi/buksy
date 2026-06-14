import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { translate } from '@vitalets/google-translate-api';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCE_LANG = 'uk';
const TARGET_LANGS = ['ru', 'en'];

const DATA_GLOBS = ['content/pages'];

function hasCyrillic(text) {
  return /[а-яА-ЯіІїЇєЄґҐ]/.test(text);
}

function shouldTranslate(value) {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  if (t.length < 2) return false;
  if (t.length > 500) return false;
  if (/^https?:\/\//.test(t)) return false;
  if (!hasCyrillic(t)) return false;
  return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadFiles() {
  const files = [];
  for (const dir of DATA_GLOBS) {
    const fullDir = join(root, dir);
    if (!existsSync(fullDir)) continue;
    const entries = readdirSync(fullDir);
    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        files.push({ path: join(fullDir, entry), name: entry });
      }
    }
  }
  return files;
}

async function translateText(text, target) {
  try {
    const res = await translate(text, { from: SOURCE_LANG, to: target });
    return res.text;
  } catch (err) {
    console.error(`  ✗ translate error: ${err.message}`);
    return null;
  }
}

async function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const toTranslate = [];

  const findMissing = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) findMissing(item);
      } else if (obj[key] && typeof obj[key] === 'object') {
        findMissing(obj[key]);
      } else if (typeof obj[key] === 'string') {
        const m = key.match(/^(.+)_(ru|en)$/);
        if (m) continue;
        if (!shouldTranslate(obj[key])) continue;
        for (const lang of TARGET_LANGS) {
          const lf = `${key}_${lang}`;
          if (obj[lf] && obj[lf].trim().length > 0) continue;
          toTranslate.push({ obj, field: key, base: obj[key], lang });
        }
      }
    }
  };

  findMissing(data);

  if (toTranslate.length === 0) {
    console.log(`  ✓ ${filePath.split('/').pop()}`);
    return;
  }

  console.log(`\n→ ${filePath.split('/').pop()}`);
  let modified = false;

  for (const { obj, field, base, lang } of toTranslate) {
    const lf = `${field}_${lang}`;
    if (obj[lf] && obj[lf].trim().length > 0) continue;

    process.stdout.write(`  ${field} → ${lang}... `);
    const translated = await translateText(base, lang);
    if (translated) {
      obj[lf] = translated;
      modified = true;
      console.log(`✓`);
    } else {
      console.log(`⏭`);
    }
    await sleep(1000);
  }

  if (modified) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  ✓ saved\n`);
  }
}

async function main() {
  console.log('🔍 Scanning for missing translations...\n');
  const files = loadFiles();
  console.log(`Found ${files.length} page files\n`);

  for (const file of files) {
    await processFile(file.path);
  }

  console.log('\n✅ Translation complete!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
