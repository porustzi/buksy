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

    const setOg = (name: string, content: string) => {
      const selector = `meta[property="og:${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', `og:${name}`);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      prevRef.current[`og:${name}`] = el;
    };
    const setTwitter = (name: string, content: string) => {
      const selector = `meta[name="twitter:${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', `twitter:${name}`);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      prevRef.current[`twitter:${name}`] = el;
    };

    (function () {
      var sel = 'meta[name="description"]';
      var el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'description'); document.head.appendChild(el); }
      el.setAttribute('content', description || DEFAULT_DESC);
      prevRef.current['description'] = el;
    })();

    setOg('title', pageTitle);
    setOg('description', description || DEFAULT_DESC);
    setOg('type', 'website');
    setTwitter('card', 'summary_large_image');

    if (image) {
      setOg('image', image);
      setTwitter('image', image);
    } else {
      ['og:image', 'twitter:image'].forEach(function (k) {
        const el = prevRef.current[k];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        prevRef.current[k] = null;
      });
    }

    if (url) {
      setOg('url', url);
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
