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
 * Every indexable page also carries its language variants (hreflang: English at
 * the plain URL, Portuguese at `?lang=pt`, which i18n reads) and schema.org
 * structured data: the organisation on the home, a Service per trade page, and
 * FAQPage on the two help pages, built from the same list the pages render.
 *
 * Keep this module free of React and of `import.meta.env`: Node imports it at
 * build time.
 */
import { translate, type StringKey } from './i18n/strings';
import type { Lang } from './types';
import { ROUTES, TRADE_SLUGS, isTradeSlug, tradeUrl } from './routes';
import { AVAILABLE } from './components/explore/artisans';
import { HELP_QA, PRO_HELP_TOPICS } from './lib/faq';

export const SITE_NAME = 'Dashfixe';
/** 1200×630 JPEG — link previews (WhatsApp especially) want it well under 300 kB. */
export const OG_IMAGE = '/og.jpg';

export type PageMeta = {
  title: string;
  description: string;
  /** Canonical path, no trailing slash (except the home). */
  path: string;
  /** Private or sample-only pages stay out of search results. */
  noindex: boolean;
  lang: Lang;
};

type Entry = { title: StringKey; description: StringKey; noindex?: boolean };

const PAGES: Record<string, Entry> = {
  [ROUTES.home]: { title: 'seo.home.title', description: 'seo.home.desc' },
  [ROUTES.explore]: { title: 'seo.explore.title', description: 'seo.explore.desc' },
  // Parked: reachable at /waitlist, but no longer a front door — kept out of search.
  [ROUTES.waitlist]: { title: 'seo.waitlist.title', description: 'seo.waitlist.desc', noindex: true },
  // Dashfixe Pro (rev 2.2): the landing is the old /for-artisans page, and indexed like it.
  [ROUTES.pro]: { title: 'seo.forArtisans.title', description: 'seo.forArtisans.desc' },
  [ROUTES.howItWorks]: { title: 'seo.how.title', description: 'seo.how.desc' },
  [ROUTES.about]: { title: 'footer.about', description: 'seo.about.desc' },
  [ROUTES.help]: { title: 'footer.helpCentre', description: 'seo.help.desc' },
  [ROUTES.privacy]: { title: 'footer.privacy', description: 'seo.legal.desc' },
  [ROUTES.terms]: { title: 'footer.terms', description: 'seo.legal.desc' },
  [ROUTES.cookies]: { title: 'footer.cookies', description: 'seo.legal.desc' },
  [ROUTES.login]: { title: 'seo.login.title', description: 'seo.home.desc', noindex: true },
  [ROUTES.activity]: { title: 'nav.activity', description: 'seo.home.desc', noindex: true },
  [ROUTES.account]: { title: 'nav.account', description: 'seo.home.desc', noindex: true },
  [ROUTES.proApply]: { title: 'seo.proApply.title', description: 'seo.proApply.desc' },
  [ROUTES.proHelp]: { title: 'seo.proHelp.title', description: 'seo.proHelp.desc' },
  [ROUTES.proLogin]: { title: 'auth.pro.title', description: 'seo.proApply.desc', noindex: true },
  [ROUTES.proDashboard]: { title: 'pro.dash.title', description: 'seo.proApply.desc', noindex: true },
  // One device's application status: private.
  [ROUTES.proApplication]: { title: 'seo.proStatus.title', description: 'seo.proApply.desc', noindex: true },
  // The founders' tool: never indexed, and robots-disallowed.
  [ROUTES.ops]: { title: 'ops.title', description: 'seo.proApply.desc', noindex: true },
  // The app showcase is sample stills, like /artisan/*: shareable, not indexed.
  [ROUTES.proApp]: { title: 'seo.pro.title', description: 'seo.pro.desc', noindex: true },
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
      lang,
    };
  }

  // Sample profiles and private job pages: titled for the tab, kept out of the index.
  const artisan = /^\/artisan\/([\w-]+)$/.exec(path)?.[1];
  if (artisan) {
    const name = AVAILABLE.find((a) => a.id === artisan)?.name;
    return { title: withSite(name ?? t('seo.explore.title')), description: t('seo.home.desc'), path, noindex: true, lang };
  }
  if (/^\/job\//.test(path)) {
    return { title: withSite(t('seo.job.title')), description: t('seo.home.desc'), path, noindex: true, lang };
  }

  const entry = PAGES[path];
  // Unknown paths render the 404 page: titled for the tab, never indexed.
  if (!entry) return { title: withSite(t('seo.notFound.title')), description: t('seo.home.desc'), path, noindex: true, lang };
  return {
    title: path === ROUTES.home ? t(entry.title) : withSite(t(entry.title)),
    description: t(entry.description),
    path,
    noindex: entry.noindex ?? false,
    lang,
  };
}

/**
 * Every public, indexable page — the sitemap and the pre-rendered heads. The
 * waitlist is parked (reachable, not promoted), so it is never listed; the
 * `launched` switch is kept for pages that change at launch.
 */
export function indexablePaths(_launched: boolean): string[] {
  void _launched;
  return [
    ROUTES.home,
    ROUTES.explore,
    ...TRADE_SLUGS.map(tradeUrl),
    ROUTES.howItWorks,
    ROUTES.pro,
    ROUTES.proApply,
    ROUTES.proHelp,
    ROUTES.about,
    ROUTES.help,
    ROUTES.privacy,
    ROUTES.terms,
    ROUTES.cookies,
  ];
}

// ─── Language variants and structured data (both sides) ────────────────────

const pageUrl = (siteUrl: string, path: string) => siteUrl + (path === '/' ? '/' : path);

/** A page's URL in one language: English is the plain URL, Portuguese adds `?lang=pt`. */
export const langUrl = (url: string, lang: Lang) => (lang === 'PT' ? `${url}?lang=pt` : url);

/** hreflang alternates for an indexable page: [hreflang, href]. */
export function alternates(url: string): Array<[string, string]> {
  return [
    ['en', langUrl(url, 'EN')],
    ['pt-PT', langUrl(url, 'PT')],
    ['x-default', url],
  ];
}

/** The pilot's service area. No street address: there is no shopfront to send anyone to. */
const AREA = [
  { '@type': 'City', name: 'Amora' },
  { '@type': 'City', name: 'Seixal' },
];

const FAQS: Record<string, Array<[StringKey, StringKey]>> = {
  [ROUTES.help]: HELP_QA.map(({ q, a }) => [q, a]),
  [ROUTES.proHelp]: PRO_HELP_TOPICS.flatMap((topic) => topic.qa),
};

/**
 * schema.org JSON-LD for a page — only for indexable pages, and only facts the
 * page itself states. No ratings or reviews: the pilot has none to show yet.
 */
export function structuredData(meta: PageMeta, siteUrl: string): Array<Record<string, unknown>> {
  if (meta.noindex) return [];
  const t = (key: StringKey, vars?: Record<string, string>) => translate(meta.lang, key, vars);
  const url = langUrl(pageUrl(siteUrl, meta.path), meta.lang);
  const inLanguage = meta.lang === 'PT' ? 'pt-PT' : 'en';
  const context = 'https://schema.org';
  const org = {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: `${siteUrl}/`,
    logo: `${siteUrl}/apple-touch-icon.png`,
    areaServed: AREA,
  };

  if (meta.path === ROUTES.home) {
    return [
      { '@context': context, ...org },
      { '@context': context, '@type': 'WebSite', name: SITE_NAME, url: `${siteUrl}/`, inLanguage: ['en', 'pt-PT'], publisher: { '@id': org['@id'] } },
    ];
  }

  const trade = /^\/trade\/([a-z]+)$/.exec(meta.path)?.[1];
  if (isTradeSlug(trade)) {
    return [
      {
        '@context': context,
        '@type': 'Service',
        name: t('trade.h1', { pros: t(`trade.${trade}.pros`) }),
        serviceType: t(`trade.${trade}.pros`),
        description: meta.description,
        url,
        areaServed: AREA,
        provider: { '@id': org['@id'], '@type': 'Organization', name: SITE_NAME, url: `${siteUrl}/` },
      },
    ];
  }

  const faq = FAQS[meta.path];
  if (faq) {
    return [
      {
        '@context': context,
        '@type': 'FAQPage',
        url,
        inLanguage,
        mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: t(q), acceptedAnswer: { '@type': 'Answer', text: t(a) } })),
      },
    ];
  }
  return [];
}

/** JSON inside <script>: never let a string close the tag early. */
const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

// ─── Build side (Node) ──────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Bake one page's tags into the built index.html. Strict on purpose: if a tag
 * this expects has gone missing from index.html, the build fails instead of
 * silently shipping pages that all share the home page's preview.
 */
export function renderHead(html: string, meta: PageMeta, siteUrl: string): string {
  const url = langUrl(pageUrl(siteUrl, meta.path), meta.lang);
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
  if (!out.includes('</head>')) missing.push('</head>');
  // A function, not a string: answers may contain `$`, which replace() would read as a pattern.
  out = out.replace('</head>', () => `${headExtras(meta, siteUrl)}</head>`);
  if (missing.length) throw new Error(`index.html is missing SEO tags: ${missing.join(', ')}`);
  return out;
}

/** hreflang links and JSON-LD for an indexable page; nothing for the rest. */
function headExtras(meta: PageMeta, siteUrl: string): string {
  if (meta.noindex) return '';
  const links = alternates(pageUrl(siteUrl, meta.path)).map(
    ([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${esc(href)}" />`,
  );
  const scripts = structuredData(meta, siteUrl).map((data) => `<script type="application/ld+json">${jsonForScript(data)}</script>`);
  return [...links, ...scripts].map((tag) => `    ${tag}\n`).join('') + '  ';
}

/** One <url> per language variant, each listing all of them (Google's sitemap hreflang format). */
export function sitemapXml(siteUrl: string, paths: string[], lastmod: string): string {
  const urls = paths
    .flatMap((p) => {
      const url = pageUrl(siteUrl, p);
      const links = alternates(url)
        .map(([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${esc(href)}"/>`)
        .join('');
      return (['EN', 'PT'] as const).map(
        (lang) => `  <url><loc>${esc(langUrl(url, lang))}</loc><lastmod>${lastmod}</lastmod>${links}</url>`,
      );
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(siteUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /login',
    'Disallow: /activity',
    'Disallow: /account',
    'Disallow: /pro/login',
    'Disallow: /pro/dashboard',
    'Disallow: /pro/application',
    'Disallow: /job/',
    'Disallow: /ops',
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
  const plain = pageUrl(origin, m.path);
  const url = langUrl(plain, m.lang);
  document.title = m.title;
  setTag('meta[name="description"]', meta('name', 'description'), 'content', m.description);
  setTag('meta[name="robots"]', meta('name', 'robots'), 'content', m.noindex ? 'noindex, nofollow' : 'index, follow');
  setTag('meta[property="og:title"]', meta('property', 'og:title'), 'content', m.title);
  setTag('meta[property="og:description"]', meta('property', 'og:description'), 'content', m.description);
  setTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', url);
  setTag('meta[property="og:locale"]', meta('property', 'og:locale'), 'content', m.lang === 'PT' ? 'pt_PT' : 'en_GB');
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

  // Language variants and structured data follow the page (none on private pages).
  document.head.querySelectorAll('link[rel="alternate"][hreflang], script[type="application/ld+json"]').forEach((el) => el.remove());
  if (m.noindex) return;
  for (const [hreflang, href] of alternates(plain)) {
    const el = document.createElement('link');
    el.rel = 'alternate';
    el.hreflang = hreflang;
    el.href = href;
    document.head.appendChild(el);
  }
  for (const data of structuredData(m, origin)) {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  }
}
