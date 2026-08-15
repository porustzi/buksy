import { useTranslation } from 'react-i18next';
import { contentByLang } from '../data/content';
import { productsByLang } from '../data/products';

function pickLang<T>(byLang: Record<string, T>, lang: string, fallback: T): T {
  return byLang[lang] ?? byLang.uk ?? fallback;
}

export function useContent() {
  const { i18n } = useTranslation();
  return pickLang(contentByLang, i18n.language, contentByLang.uk);
}

export function useProducts() {
  const { i18n } = useTranslation();
  return pickLang(productsByLang, i18n.language, productsByLang.uk);
}
