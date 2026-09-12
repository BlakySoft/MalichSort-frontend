import { useEffect } from 'react';

const defaultTitle = 'Ivan Malich Sorteos';
const defaultDescription = 'Participa en sorteos digitales con transparencia, seguridad y premios reales.';
const defaultUrl = 'https://www.ivanmalichsorteos.com';

export default function Seo({ title = defaultTitle, description = defaultDescription, path = '/' }) {
  const canonicalUrl = `${defaultUrl}${path === '/' ? '' : path}`;

  useEffect(() => {
    document.title = title;

    const setMeta = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const attr = selector.startsWith('meta[name') ? 'name' : 'property';
        element.setAttribute(attr, selector.includes('name="description"') ? 'description' : 'og:title');
      }
      element.setAttribute(attribute, value);
      if (!document.head.contains(element)) {
        document.head.appendChild(element);
      }
    };

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', description);
    document.head.appendChild(metaDescription);

    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', title);
    document.head.appendChild(ogTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', description);
    document.head.appendChild(ogDescription);

    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', canonicalUrl);
    document.head.appendChild(canonical);

    const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', canonicalUrl);
    document.head.appendChild(ogUrl);
  }, [title, description, canonicalUrl]);

  return null;
}
