import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { indexablePaths, pageMeta, renderHead, robotsTxt, sitemapXml } from './seo';

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

  it('falls back to the home for unknown paths (they redirect there)', () => {
    expect(pageMeta('/nope', 'EN')).toEqual(pageMeta('/', 'EN'));
    expect(pageMeta('/trade/juggling', 'EN').path).toBe('/');
  });
});

describe('indexablePaths', () => {
  it('lists the public pages and one per trade', () => {
    const paths = indexablePaths(false);
    expect(paths).toContain('/waitlist');
    expect(paths).toContain('/trade/cleaning');
    expect(paths).not.toContain('/login');
  });

  it('drops the waitlist at launch', () => {
    expect(indexablePaths(true)).not.toContain('/waitlist');
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
});
