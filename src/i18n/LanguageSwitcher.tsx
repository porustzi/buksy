import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import { loadTranslations } from './translateService';
import uk from './uk.json';

const languages = [
  { code: 'uk', label: 'UA' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const currentLang = i18n.language?.split('-')[0] || 'uk';

  const switchLang = async (code: string) => {
    if (code === currentLang) { setIsOpen(false); return; }

    if (code !== 'uk' && !i18n.hasResourceBundle(code, 'translation')) {
      setLoading(code);
      const translated = await loadTranslations(code, uk);
      i18n.addResourceBundle(code, 'translation', translated, true, true);
      setLoading(null);
    }

    i18n.changeLanguage(code);
    localStorage.setItem('buksy_lang', code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/70 hover:text-white transition-colors duration-300 flex items-center gap-1"
      >
        <Globe size={16} />
        <span className="font-mono text-xs">
          {loading ? '...' : currentLang.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-ash border border-white/10 min-w-[80px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                disabled={loading === lang.code}
                className={`w-full px-4 py-2 text-sm font-mono text-left transition-colors duration-200 ${
                  currentLang === lang.code
                    ? 'text-blood bg-blood/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {loading === lang.code ? '...' : lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
