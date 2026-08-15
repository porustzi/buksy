import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Search, User, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../store/CartContext';

const navLinks = [
  { nameKey: 'header.home', href: '/' },
  { nameKey: 'header.shop', href: '/shop' },
  { nameKey: 'header.about', href: '/about' },
  { nameKey: 'header.contact', href: '/contact' },
];

const languages = [
  { code: 'uk', label: 'UA' },
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { toggleCart, totalItems } = useCart();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('buksy_lang', code);
    setIsLangOpen(false);
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-noir/95 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center"
              >
                <div className="w-16 h-16 relative">
                  <img src="/logo.png" alt="BUKSY" className="w-full h-full object-contain brightness-0 invert" />
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="relative group"
                >
                  <span
                    className={`font-body text-sm tracking-widest uppercase transition-colors duration-300 ${
                      location.pathname === link.href
                        ? 'text-blood'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {t(link.nameKey)}
                  </span>
                  <span
                    className={`absolute -bottom-2 left-0 h-px bg-blood transition-all duration-300 ${
                      location.pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="p-2 text-white/70 hover:text-white transition-colors duration-300 flex items-center gap-1"
                >
                  <Globe size={18} />
                  <span className="font-body text-xs tracking-wider">{languages.find((l) => l.code === i18n.language)?.label || 'UA'}</span>
                </button>
                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-noir border border-white/10 shadow-xl z-50 min-w-[80px]"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full px-4 py-2 text-left font-body text-xs tracking-wider transition-colors duration-200 ${
                            i18n.language === lang.code
                              ? 'text-blood bg-white/5'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-white/70 hover:text-white transition-colors duration-300 hidden md:block"
              >
                <Search size={20} />
              </button>
              <Link
                to="/contact"
                className="p-2 text-white/70 hover:text-white transition-colors duration-300 hidden md:block"
              >
                <User size={20} />
              </Link>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleCart}
                className="relative p-2 text-white/70 hover:text-white transition-colors duration-300"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-blood rounded-full flex items-center justify-center text-xs font-medium"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white md:hidden"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 bg-noir md:hidden pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.href}
                    className={`text-3xl font-heading tracking-[0.2em] ${
                      location.pathname === link.href ? 'text-blood' : 'text-white'
                    }`}
                  >
                    {t(link.nameKey)}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <div className="flex gap-6">
                  <button onClick={() => { setIsSearchOpen(true); setIsMobileMenuOpen(false); }} className="p-3 text-white/70">
                    <Search size={24} />
                  </button>
                  <Link to="/contact" className="p-3 text-white/70">
                    <User size={24} />
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-4 py-2 font-body text-sm tracking-wider border transition-colors duration-200 ${
                        i18n.language === lang.code
                          ? 'border-blood text-blood'
                          : 'border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-noir/95 backdrop-blur-xl flex items-start justify-center             pt-32 safe-area-top"
            onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('header.searchProducts')}
                    className="w-full px-6 py-5 pl-14 bg-ash border border-white/10 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-blood/50 transition-colors duration-300 font-body"
                  />
                </div>
              </form>
              <div className="mt-4 text-white/40 text-sm font-body text-center">
                {t('header.pressEnter')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
