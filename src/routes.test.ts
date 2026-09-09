import { describe, expect, it } from 'vitest';
import { ROUTES, link } from './routes';

describe('link', () => {
  it('sends built pages to their real route', () => {
    expect(link('explore')).toBe('/explore');
  });

  it('sends unbuilt artisan pages to the only real artisan sign-up', () => {
    expect(link('forArtisans')).toBe('/waitlist#artisans');
    expect(link('artisanApply')).toBe('/waitlist#artisans');
  });

  it('never returns an empty destination', () => {
    for (const name of ['fix', 'book', 'help', 'coverage', 'about', 'privacy', 'terms', 'cookies'] as const) {
      expect(link(name)).toMatch(/^\//);
    }
  });

  it('keeps the two front doors', () => {
    expect(ROUTES.home).toBe('/');
    expect(ROUTES.waitlist).toBe('/waitlist');
  });
});
