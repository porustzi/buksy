import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { translateObject } from './translate';
import { homepage } from '../data/content';
import { aboutPage } from '../data/content';
import { editorialPage } from '../data/content';
import { contactInfo } from '../data/content';
import { footerData } from '../data/content';

interface Translations {
  homepage: typeof homepage;
  aboutPage: typeof aboutPage;
  editorialPage: typeof editorialPage;
  contactInfo: typeof contactInfo;
  footerData: typeof footerData;
  loading: boolean;
}

const original: Translations = {
  homepage,
  aboutPage,
  editorialPage,
  contactInfo,
  footerData,
  loading: false,
};

const TranslationContext = createContext<Translations>(original);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [data, setData] = useState<Translations>(original);
  const lang = i18n.language?.split('-')[0] || 'uk';

  useEffect(() => {
    if (lang === 'uk') {
      setData({ ...original, loading: false });
      return;
    }

    setData((prev) => ({ ...prev, loading: true }));
    let cancelled = false;

    Promise.all([
      translateObject(homepage, lang),
      translateObject(aboutPage, lang),
      translateObject(editorialPage, lang),
      translateObject(contactInfo, lang),
      translateObject(footerData, lang),
    ])
      .then(([h, a, e, c, f]) => {
        if (!cancelled) {
          setData({ homepage: h, aboutPage: a, editorialPage: e, contactInfo: c, footerData: f, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) setData((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return <TranslationContext.Provider value={data}>{children}</TranslationContext.Provider>;
}

export function useTranslated() {
  return useContext(TranslationContext);
}
