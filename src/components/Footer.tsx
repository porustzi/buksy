import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { footerData } from '../data/content';

export function Footer() {
  const { t } = useTranslation();
  const f = footerData || {};

  const navLinks = f.navigation?.links?.length ? f.navigation.links : [
    { name: t('footer.home'), href: '/' },
    { name: t('footer.shop'), href: '/shop' },
    { name: t('footer.about'), href: '/about' },
    { name: t('footer.contact'), href: '/contact' },
  ];

  const supportLinks = f.support?.links?.length ? f.support.links : [
    { name: t('footer.shippingReturns'), href: '/shipping' },
    { name: t('footer.sizeGuide'), href: '/size-guide' },
    { name: t('footer.faq'), href: '/faq' },
    { name: t('footer.trackOrder'), href: '/track' },
  ];

  const legalLinks = f.legal?.links?.length ? f.legal.links : [
    { name: t('footer.privacyPolicy'), href: '/privacy' },
    { name: t('footer.termsOfService'), href: '/terms' },
    { name: t('footer.cookiePolicy'), href: '/cookies' },
  ];

  return (
    <footer className="bg-ash border-t border-white/5">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blood/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-white/50 font-body text-sm text-center sm:text-left max-w-md">
              {f.newsletter?.description || t('footer.joinTelegram')}
            </p>
            <div className="flex items-center gap-4">
              <a href={f.newsletter?.telegramUrl || 'https://t.me/+OQrO3Aya1NQ4YmZi'} target="_blank" rel="noopener noreferrer"
                className="font-heading text-xl sm:text-2xl tracking-wider hover:text-blood transition-colors duration-300">
                {f.newsletter?.title || t('footer.joinDarkSide')}
              </a>
              <a href={f.newsletter?.telegramUrl || 'https://t.me/+OQrO3Aya1NQ4YmZi'} target="_blank" rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs">
                <Send size={18} />{f.newsletter?.tg || t('footer.tg')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-14 h-14">
                <img src="/logo.png" alt="BUKSY" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="font-heading text-xl tracking-[0.2em]">BUKSY</span>
            </Link>
            <p className="text-white/60 font-body text-sm leading-relaxed mb-6">{f.brand?.description || t('footer.premiumStreetwear')}</p>
            <div className="flex gap-4">
              <a href={f.social?.instagram || 'https://instagram.com'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/60 hover:border-blood hover:text-blood transition-all duration-300"><Instagram size={18} /></a>
              <a href={f.social?.twitter || 'https://twitter.com'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/60 hover:border-blood hover:text-blood transition-all duration-300"><Twitter size={18} /></a>
              <a href={f.social?.youtube || 'https://youtube.com'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/60 hover:border-blood hover:text-blood transition-all duration-300"><Youtube size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm tracking-[0.3em] mb-6 text-white/40">{f.navigation?.title || t('footer.navigation')}</h4>
            <ul className="space-y-3">
              {navLinks.map((link: any) => (
                <li key={link.href}><Link to={link.href} className="text-white/70 hover:text-blood transition-colors duration-300 font-body">{link.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm tracking-[0.3em] mb-6 text-white/40">{f.support?.title || t('footer.support')}</h4>
            <ul className="space-y-3">
              {supportLinks.map((link: any) => (
                <li key={link.href}><Link to={link.href} className="text-white/70 hover:text-blood transition-colors duration-300 font-body">{link.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm tracking-[0.3em] mb-6 text-white/40">{f.legal?.title || t('footer.legal')}</h4>
            <ul className="space-y-3">
              {legalLinks.map((link: any) => (
                <li key={link.href}><Link to={link.href} className="text-white/70 hover:text-blood transition-colors duration-300 font-body">{link.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative overflow-hidden rounded-full w-full md:w-auto max-w-xs mx-auto px-5 py-3 md:py-2.5 bg-white shadow-lg">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 -right-3 w-16 h-16 bg-rose-300/50 rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-3 w-12 h-12 bg-rose-400/40 rounded-full blur-lg" />
                <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-rose-200/30 rounded-full blur-md" />
              </div>
              <a href="https://krvtsv.netlify.app" target="_blank" rel="noopener noreferrer" className="relative block text-center text-rose-600 font-bold text-[11px] md:text-[10px] uppercase tracking-widest whitespace-nowrap hover:text-rose-500 transition-colors">
                Сайт зроблений KRVTSV CORP
              </a>
            </div>
            <div className="text-center text-sm text-white/40 font-body">
              <p>&copy; {new Date().getFullYear()} BUKSY. {f.copyright?.allRights || t('footer.allRightsReserved')}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
