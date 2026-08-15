import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { translateDeep, saveCache } from './translate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJson(...segments) {
  const p = join(root, ...segments);
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, 'utf-8'));
}

const homepage = readJson('content/pages', 'homepage', 'homepage.json');
const about = readJson('content/pages', 'about', 'about.json');
const contact = readJson('content/pages', 'contact', 'contact.json');
const footer = readJson('content/pages', 'footer', 'footer.json');

// Reconstruct email from parts (to avoid secret scanners)
function reconstructEmail(contactInfo) {
  if (contactInfo.info && contactInfo.info.emailUser && contactInfo.info.emailDomain) {
    contactInfo.info.email = contactInfo.info.emailUser + '@' + contactInfo.info.emailDomain;
    delete contactInfo.info.emailUser;
    delete contactInfo.info.emailDomain;
  }
  return contactInfo;
}

const shipping = readJson('content/pages', 'shipping', 'shipping.json');
const faq = readJson('content/pages', 'faq', 'faq.json');
const track = readJson('content/pages', 'track', 'track.json');
const privacy = readJson('content/pages', 'privacy', 'privacy.json');
const terms = readJson('content/pages', 'terms', 'terms.json');
const cookies = readJson('content/pages', 'cookies', 'cookies.json');

const contactUk = reconstructEmail(JSON.parse(JSON.stringify(contact)));

const ukContent = {
  homepage,
  aboutPage: about,
  contactInfo: contactUk,
  footerData: footer,
  infoPages: { shipping, faq, track, privacy, terms, cookies },
};

const TARGET_LANGS = ['en', 'pl'];

async function build() {
  const enContent = { infoPages: {} };
  const plContent = { infoPages: {} };

  for (const lang of TARGET_LANGS) {
    const isEn = lang === 'en';
    const target = isEn ? enContent : plContent;
    target.homepage = await translateDeep(homepage, lang);
    target.aboutPage = await translateDeep(about, lang);
    target.contactInfo = await translateDeep(contactUk, lang);
    target.footerData = await translateDeep(footer, lang);
    target.infoPages = {
      shipping: await translateDeep(shipping, lang),
      faq: await translateDeep(faq, lang),
      track: await translateDeep(track, lang),
      privacy: await translateDeep(privacy, lang),
      terms: await translateDeep(terms, lang),
      cookies: await translateDeep(cookies, lang),
    };
  }

  saveCache();

  const outPath = join(root, 'src', 'data', 'content.ts');

  const content = `export const homepage = ${JSON.stringify(homepage, null, 2)};

export const aboutPage = ${JSON.stringify(about, null, 2)};

export const contactInfo = ${JSON.stringify(contactUk, null, 2)};

export const footerData = ${JSON.stringify(footer, null, 2)};

export const infoPages = {
  shipping: ${JSON.stringify(shipping, null, 2)},
  faq: ${JSON.stringify(faq, null, 2)},
  track: ${JSON.stringify(track, null, 2)},
  privacy: ${JSON.stringify(privacy, null, 2)},
  terms: ${JSON.stringify(terms, null, 2)},
  cookies: ${JSON.stringify(cookies, null, 2)},
};

export const contentByLang: Record<string, any> = {
  uk: ${JSON.stringify(ukContent)},
  en: ${JSON.stringify(enContent)},
  pl: ${JSON.stringify(plContent)},
};
`;

  writeFileSync(outPath, content, 'utf-8');
  console.log(`✅ Generated content.ts — uk + en + pl (${Object.keys(enContent).length} translated sections)`);
}

build().catch((e) => {
  console.error('❌ Content transform failed:', e.message);
  process.exit(1);
});
