import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './uk.json';

const savedLang = localStorage.getItem('buksy_lang') || 'uk';

i18n.use(initReactI18next).init({
  resources: { uk: { translation: uk } },
  lng: savedLang,
  fallbackLng: 'uk',
  interpolation: { escapeValue: false },
  returnObjects: false,
});

export default i18n;
