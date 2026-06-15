import { useEffect, useRef } from 'react';

interface SeoMeta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT_TITLE = 'BUKSY | Dark Luxury Streetwear';
const DEFAULT_DESC = 'Premium dark streetwear for the unconventional. Luxury gothic fashion with contemporary edge.';

export function useSeo({ title, description, image, url }: SeoMeta = {}) {
  const prevRef = useRef<Record<string, HTMLMetaElement | null>>({});

  useEffect(() => {
    const pageTitle = title ? `${title} — BUKSY` : DEFAULT_TITLE;
    document.title = pageTitle;

    const setMeta = (name: string, property: string | undefined, content: string) => {
      const key = property || name;
      const selector = property
        ? `meta[property="${property}"]`
        : `meta[name="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (property) el.setAttribute('property', property);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      prevRef.current[key] = el;
      return el;
    };

    setMeta('description', undefined, description || DEFAULT_DESC);
    setMeta('og:title', 'og:title', pageTitle);
    setMeta('og:description', 'og:description', description || DEFAULT_DESC);
    setMeta('og:type', 'og:type', 'website');
    setMeta('twitter:card', 'twitter:card', 'summary_large_image');

    if (image) {
      setMeta('og:image', 'og:image', image);
      setMeta('twitter:image', 'twitter:image', image);
    } else {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.remove();
      const twImg = document.querySelector('meta[property="twitter:image"]');
      if (twImg) twImg.remove();
    }

    if (url) {
      setMeta('og:url', 'og:url', url);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      Object.values(prevRef.current).forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      prevRef.current = {};
    };
  }, [title, description, image, url]);
}
