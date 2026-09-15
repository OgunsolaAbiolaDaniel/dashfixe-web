import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { indexablePaths, pageMeta, renderHead, robotsTxt, sitemapXml, structuredData } from './seo';

const SITE = 'https://dashfixe.example';

describe('pageMeta', () => {
  it('titles the home without a suffix and every other page with one', () => {
    expect(pageMeta('/', 'EN').title).toBe('Dashfixe — vetted local artisans in Amora & Seixal');
    expect(pageMeta('/help', 'EN').title).toBe('Help centre · Dashfixe');
    expect(pageMeta('/help/', 'PT').title).toBe('Centro de ajuda · Dashfixe');
  });

  it('gives every trade page its own title and description', () => {
    const plumbing = pageMeta('/trade/plumbing', 'EN');
    expect(plumbing.title).toBe('Plumbers in Amora & Seixal · Dashfixe');
    expect(plumbing.description).toMatch(/dripping tap/);
    expect(pageMeta('/trade/electrical', 'PT').title).toBe('Eletricistas na Amora e no Seixal · Dashfixe');
  });

  it('keeps private and sample-only pages out of the index', () => {
    for (const p of ['/login', '/activity', '/job/dfx-1042', '/artisan/tf']) expect(pageMeta(p, 'EN').noindex, p).toBe(true);
    expect(pageMeta('/artisan/tf', 'EN').title).toBe('Tiago Ferreira · Dashfixe');
    expect(pageMeta('/explore', 'EN').noindex).toBe(false);
  });

  it('titles unknown paths as not found and keeps them out of the index', () => {
    expect(pageMeta('/nope', 'EN')).toMatchObject({ title: 'Page not found · Dashfixe', noindex: true });
    expect(pageMeta('/trade/juggling', 'EN').noindex).toBe(true);
  });
});

describe('indexablePaths', () => {
  it('lists the public pages and one per trade', () => {
    const paths = indexablePaths(false);
    expect(paths).toContain('/trade/cleaning');
    expect(paths).toContain('/how-it-works');
    expect(paths).not.toContain('/login');
  });

  it('keeps the parked waitlist out of search, before and after launch', () => {
    expect(indexablePaths(false)).not.toContain('/waitlist');
    expect(indexablePaths(true)).not.toContain('/waitlist');
    expect(pageMeta('/waitlist', 'EN').noindex).toBe(true);
  });
});

describe('the build-side renderers', () => {
  const shell = readFileSync('index.html', 'utf8');

  it('bakes a page into the real index.html, absolute and escaped', () => {
    const html = renderHead(shell, pageMeta('/trade/plumbing', 'EN'), SITE);
    expect(html).toContain('<title>Plumbers in Amora &amp; Seixal · Dashfixe</title>');
    expect(html).toContain(`<link rel="canonical" href="${SITE}/trade/plumbing"`);
    expect(html).toContain(`<meta property="og:url" content="${SITE}/trade/plumbing"`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og.jpg"`);
    expect(html).toContain('<meta name="robots" content="index, follow"');
  });

  it('fails loudly if index.html loses a tag', () => {
    const broken = shell.replace(/<meta property="og:title"[^>]*>/, '');
    expect(() => renderHead(broken, pageMeta('/', 'EN'), SITE)).toThrow(/og:title/);
  });

  it('writes a sitemap and robots that point at each other', () => {
    const xml = sitemapXml(SITE, indexablePaths(false), '2026-09-12');
    expect(xml).toContain(`<loc>${SITE}/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/trade/painting</loc>`);
    expect(robotsTxt(SITE)).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt(SITE)).toContain('Disallow: /job/');
  });

  it('lists both language variants in the sitemap, each pointing at the other', () => {
    const xml = sitemapXml(SITE, ['/help'], '2026-09-15');
    expect(xml).toContain(`<loc>${SITE}/help?lang=pt</loc>`);
    expect(xml.match(/hreflang="pt-PT" href="https:\/\/dashfixe\.example\/help\?lang=pt"/g)).toHaveLength(2);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('bakes hreflang and the Service JSON-LD into a trade page', () => {
    const html = renderHead(shell, pageMeta('/trade/plumbing', 'EN'), SITE);
    expect(html).toContain(`<link rel="alternate" hreflang="pt-PT" href="${SITE}/trade/plumbing?lang=pt" />`);
    expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${SITE}/trade/plumbing" />`);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
    expect(ld).toEqual([expect.objectContaining({ '@type': 'Service', serviceType: 'Plumbers', areaServed: expect.any(Array) })]);
    expect(html.indexOf('application/ld+json')).toBeLessThan(html.indexOf('</head>'));
  });

  it('bakes nothing extra into private pages', () => {
    const html = renderHead(shell, pageMeta('/login', 'EN'), SITE);
    expect(html).not.toContain('hreflang');
    expect(html).not.toContain('application/ld+json');
  });
});

describe('structuredData', () => {
  it('describes the organisation and the site on the home', () => {
    expect(structuredData(pageMeta('/', 'EN'), SITE).map((d) => d['@type'])).toEqual(['Organization', 'WebSite']);
  });

  it('turns the help pages into FAQPage from the very answers they show', () => {
    const [help] = structuredData(pageMeta('/help', 'PT'), SITE) as Array<{ mainEntity: Array<{ name: string }>; url: string; inLanguage: string }>;
    expect(help!.mainEntity).toHaveLength(4);
    expect(help!.url).toBe(`${SITE}/help?lang=pt`);
    expect(help!.inLanguage).toBe('pt-PT');
    const [pro] = structuredData(pageMeta('/pro/help', 'EN'), SITE) as Array<{ mainEntity: unknown[] }>;
    expect(pro!.mainEntity).toHaveLength(15);
  });

  it('claims no ratings or reviews, and nothing on private pages', () => {
    for (const p of indexablePaths(false)) expect(JSON.stringify(structuredData(pageMeta(p, 'EN'), SITE))).not.toMatch(/rating|review/i);
    expect(structuredData(pageMeta('/account', 'EN'), SITE)).toEqual([]);
  });

  it('never lets a string close the script tag early', () => {
    const shell = readFileSync('index.html', 'utf8');
    const html = renderHead(shell, { ...pageMeta('/trade/plumbing', 'EN'), description: '</script><b>' }, SITE);
    // The app's own module script and the JSON-LD block — no third, forged close.
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    expect(html).toContain('\\u003c/script>\\u003cb>');
  });
});
