import { useEffect, useRef } from 'react';

interface SeoMeta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT_TITLE = 'BUKSY | Dark Luxury Streetwear';
const DEFAULT_DESC = 'Premium dark streetwear for the unconventional. Luxury gothic fashion with contemporary edge.';
const DEFAULT_IMAGE = '/logo.png';
const SITE_URL = 'https://buksy.shop';

export function useSeo({ title, description, image, url }: SeoMeta = {}) {
  const prevRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const pageTitle = title ? `${title} — BUKSY` : DEFAULT_TITLE;
    document.title = pageTitle;
    const desc = description || DEFAULT_DESC;
    const pageUrl = url || window.location.href;
    const ogImage = image || SITE_URL + DEFAULT_IMAGE;

    const setMeta = (attr: string, name: string, content: string) => {
      const selector = `meta[${attr}="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      prevRef.current[`${attr}:${name}`] = el;
    };

    const setCanonical = (href: string) => {
      let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
      prevRef.current['canonical'] = el;
    };

    // Canonical
    const canonicalUrl = pageUrl.split('?')[0].split('#')[0];
    setCanonical(canonicalUrl);

    // Description
    setMeta('name', 'description', desc);

    // Open Graph
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', 'BUKSY');
    setMeta('property', 'og:locale', 'uk_UA');

    // Twitter
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', ogImage);

    return () => {
      document.title = DEFAULT_TITLE;
      Object.values(prevRef.current).forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      prevRef.current = {};
    };
  }, [title, description, image, url]);
}
