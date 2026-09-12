/**
 * Titles, descriptions and indexability for every route — docs/ARCHITECTURE.md §4.
 *
 * ONE table, two consumers:
 *  - the app (`RouteMeta` in AppRoutes.tsx) updates <title> and the meta tags in
 *    place on every navigation and language change;
 *  - the build (`seoPages()` in vite.config.ts) writes a static index.html per
 *    public route with the same tags baked in, plus sitemap.xml and robots.txt —
 *    link-preview crawlers (WhatsApp, LinkedIn, X) never run JavaScript.
 *
 * Keep this module free of React and of `import.meta.env`: Node imports it at
 * build time.
 */
import { translate, type StringKey } from './i18n/strings';
import type { Lang } from './types';
import { ROUTES, TRADE_SLUGS, isTradeSlug, tradeUrl } from './routes';
import { AVAILABLE } from './components/explore/artisans';

export const SITE_NAME = 'Dashfixe';
export const OG_IMAGE = '/og.png';

export type PageMeta = {
  title: string;
  description: string;
  /** Canonical path, no trailing slash (except the home). */
  path: string;
  /** Private or sample-only pages stay out of search results. */
  noindex: boolean;
};

type Entry = { title: StringKey; description: StringKey; noindex?: boolean };

const PAGES: Record<string, Entry> = {
  [ROUTES.home]: { title: 'seo.home.title', description: 'seo.home.desc' },
  [ROUTES.explore]: { title: 'seo.explore.title', description: 'seo.explore.desc' },
  [ROUTES.waitlist]: { title: 'seo.waitlist.title', description: 'seo.waitlist.desc' },
  [ROUTES.forArtisans]: { title: 'seo.forArtisans.title', description: 'seo.forArtisans.desc' },
  [ROUTES.about]: { title: 'footer.about', description: 'seo.about.desc' },
  [ROUTES.help]: { title: 'footer.helpCentre', description: 'seo.help.desc' },
  [ROUTES.privacy]: { title: 'footer.privacy', description: 'seo.legal.desc' },
  [ROUTES.terms]: { title: 'footer.terms', description: 'seo.legal.desc' },
  [ROUTES.cookies]: { title: 'footer.cookies', description: 'seo.legal.desc' },
  [ROUTES.login]: { title: 'seo.login.title', description: 'seo.home.desc', noindex: true },
  [ROUTES.activity]: { title: 'nav.activity', description: 'seo.home.desc', noindex: true },
};

function normalise(pathname: string): string {
  const p = pathname.split(/[?#]/)[0] || '/';
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

const withSite = (title: string) => `${title} · ${SITE_NAME}`;

export function pageMeta(pathname: string, lang: Lang): PageMeta {
  const t = (key: StringKey, vars?: Record<string, string>) => translate(lang, key, vars);
  const path = normalise(pathname);

  const trade = /^\/trade\/([a-z]+)$/.exec(path)?.[1];
  if (isTradeSlug(trade)) {
    return {
      title: withSite(t('trade.h1', { pros: t(`trade.${trade}.pros`) })),
      description: t(`trade.${trade}.intro`),
      path,
      noindex: false,
    };
  }

  // Sample profiles and private job pages: titled for the tab, kept out of the index.
  const artisan = /^\/artisan\/([\w-]+)$/.exec(path)?.[1];
  if (artisan) {
    const name = AVAILABLE.find((a) => a.id === artisan)?.name;
    return { title: withSite(name ?? t('seo.explore.title')), description: t('seo.home.desc'), path, noindex: true };
  }
  if (/^\/job\//.test(path)) {
    return { title: withSite(t('seo.job.title')), description: t('seo.home.desc'), path, noindex: true };
  }

  const entry = PAGES[path];
  if (!entry) return { ...pageMeta(ROUTES.home, lang), path: ROUTES.home };
  return {
    title: path === ROUTES.home ? t(entry.title) : withSite(t(entry.title)),
    description: t(entry.description),
    path,
    noindex: entry.noindex ?? false,
  };
}

/** Every public, indexable page — the sitemap and the pre-rendered heads. */
export function indexablePaths(launched: boolean): string[] {
  return [
    ROUTES.home,
    ROUTES.explore,
    ...(launched ? [] : [ROUTES.waitlist]),
    ...TRADE_SLUGS.map(tradeUrl),
    ROUTES.forArtisans,
    ROUTES.about,
    ROUTES.help,
    ROUTES.privacy,
    ROUTES.terms,
    ROUTES.cookies,
  ];
}

// ─── Build side (Node) ──────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Bake one page's tags into the built index.html. Strict on purpose: if a tag
 * this expects has gone missing from index.html, the build fails instead of
 * silently shipping pages that all share the home page's preview.
 */
export function renderHead(html: string, meta: PageMeta, siteUrl: string): string {
  const url = siteUrl + (meta.path === '/' ? '/' : meta.path);
  const image = siteUrl + OG_IMAGE;
  const swaps: Array<[RegExp, string]> = [
    [/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`],
    [/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`],
    [/(<meta name="robots" content=")[^"]*(")/, `$1${meta.noindex ? 'noindex, nofollow' : 'index, follow'}$2`],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`],
    [/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`],
    [/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`],
    [/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`],
  ];
  let out = html;
  const missing: string[] = [];
  for (const [re, to] of swaps) {
    if (!re.test(out)) missing.push(re.source);
    out = out.replace(re, to);
  }
  if (missing.length) throw new Error(`index.html is missing SEO tags: ${missing.join(', ')}`);
  return out;
}

export function sitemapXml(siteUrl: string, paths: string[], lastmod: string): string {
  const urls = paths
    .map((p) => `  <url><loc>${esc(siteUrl + (p === '/' ? '/' : p))}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(siteUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /login',
    'Disallow: /activity',
    'Disallow: /job/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

// ─── Browser side ───────────────────────────────────────────────────────────

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (attr: 'name' | 'property', key: string) => () => {
  const el = document.createElement('meta');
  el.setAttribute(attr, key);
  return el;
};

/** Update the live document to match a page — the runtime half of the table. */
export function applyMeta(m: PageMeta, origin: string) {
  const url = origin + (m.path === '/' ? '/' : m.path);
  document.title = m.title;
  setTag('meta[name="description"]', meta('name', 'description'), 'content', m.description);
  setTag('meta[name="robots"]', meta('name', 'robots'), 'content', m.noindex ? 'noindex, nofollow' : 'index, follow');
  setTag('meta[property="og:title"]', meta('property', 'og:title'), 'content', m.title);
  setTag('meta[property="og:description"]', meta('property', 'og:description'), 'content', m.description);
  setTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', url);
  setTag('meta[name="twitter:title"]', meta('name', 'twitter:title'), 'content', m.title);
  setTag('meta[name="twitter:description"]', meta('name', 'twitter:description'), 'content', m.description);
  setTag(
    'link[rel="canonical"]',
    () => {
      const el = document.createElement('link');
      el.rel = 'canonical';
      return el;
    },
    'href',
    url,
  );
}
