import { describe, expect, it } from 'vitest';
import { ROUTES, link } from './routes';

/** The route table mirrors ARCHITECTURE.md §4 — cuts resolve, nothing dead-ends. */
describe('link', () => {
  it('keeps the two front doors and the product surface', () => {
    expect(ROUTES.home).toBe('/');
    expect(ROUTES.waitlist).toBe('/waitlist');
    expect(link('explore')).toBe('/explore');
  });

  it('sends the cut pages to where their job moved', () => {
    expect(link('fix')).toBe('/explore');
    expect(link('book')).toBe('/explore?when=later');
    expect(link('coverage')).toBe('/about#coverage');
    expect(link('artisanDetails')).toBe('/for-artisans');
    expect(link('artisanApp')).toBe('/for-artisans#app');
  });

  it('anchors the artisan depth into the one artisan page', () => {
    expect(link('forArtisans')).toBe('/for-artisans');
    expect(link('artisanApply')).toBe('/for-artisans#apply');
    expect(link('artisanPay')).toBe('/for-artisans#pay');
    expect(link('artisanVetting')).toBe('/for-artisans#vetting');
  });

  it('gives support links real destinations on /help', () => {
    expect(link('help')).toBe('/help');
    expect(link('safety')).toBe('/help#safety');
    expect(link('cancellations')).toBe('/help#cancellations');
    expect(link('contact')).toBe('/help#contact');
  });

  it('never resolves to the waitlist as a fallback any more', () => {
    for (const name of ['forArtisans', 'artisanApply', 'artisanApp', 'artisanDetails'] as const) {
      expect(link(name)).not.toContain('/waitlist');
    }
  });
});
