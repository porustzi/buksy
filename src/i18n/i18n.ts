import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations';

const resources: Record<string, { translation: Record<string, unknown> }> = {};
for (const [lang, keys] of Object.entries(translations)) {
  resources[lang] = { translation: keys };
}

const savedLang = typeof window !== 'undefined' ? (localStorage.getItem('buksy_lang') || 'uk') : 'uk';

i18n.use(initReactI18next).init({
  resources,
  lng: ['uk', 'en', 'pl'].includes(savedLang) ? savedLang : 'uk',
  fallbackLng: 'uk',
  interpolation: { escapeValue: false },
  supportedLngs: ['uk', 'en', 'pl'],
  nonExplicitSupportedLngs: true,
});

export default i18n;
