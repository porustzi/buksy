import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, Send } from 'lucide-react';
import { footerData } from '../data/content';

const ft = footerData;

export function Footer() {
  return (
    <footer className="bg-ash border-t border-white/5">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blood/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-white/50 font-body text-sm text-center sm:text-left max-w-md">
              {ft.newsletter.description}
            </p>
            <div className="flex items-center gap-4">
              <a href={ft.newsletter.telegramUrl} target="_blank" rel="noopener noreferrer"
                className="font-heading text-xl sm:text-2xl tracking-wider hover:text-blood transition-colors duration-300">
                {ft.newsletter.title}
              </a>
              <a href={ft.newsletter.telegramUrl} target="_blank" rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs">
                <Send size={18} />{ft.newsletter.tg}
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
            <p className="text-white/60 font-body text-sm leading-relaxed mb-6">{ft.brand.description}</p>
            <div className="flex gap-4">
              {[
                { icon: Instagram, url: ft.social.instagram },
                { icon: Twitter, url: ft.social.twitter },
                { icon: Youtube, url: ft.social.youtube },
              ].map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/60 hover:border-blood hover:text-blood transition-all duration-300">
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: ft.navigation.title, links: ft.navigation.links },
            { title: ft.support.title, links: ft.support.links },
            { title: ft.legal.title, links: ft.legal.links },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-heading text-sm tracking-[0.3em] mb-6 text-white/40">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link: any, j: number) => (
                  <li key={j}>
                    <Link to={link.href} className="text-white/70 hover:text-blood transition-colors duration-300 font-body">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40 font-body">
            <p>&copy; {new Date().getFullYear()} BUKSY. {ft.copyright.allRights}</p>
            <p className="flex items-center gap-2">
              {ft.copyright.designedFor} <span className="text-blood">{ft.copyright.dark}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
