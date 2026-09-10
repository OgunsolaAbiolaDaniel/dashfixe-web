import { describe, expect, it } from 'vitest';
import { exploreUrl, parseSearch, tradeLabel } from './search';

describe('exploreUrl', () => {
  it('is bare when nothing is set', () => {
    expect(exploreUrl({})).toBe('/explore');
  });

  it('only carries what was given', () => {
    expect(exploreUrl({ need: 'tap', when: 'now' })).toBe('/explore?need=tap');
    expect(exploreUrl({ trade: 'plumbing', when: 'later' })).toBe('/explore?trade=plumbing&when=later');
  });

  it('round-trips through parseSearch', () => {
    const url = exploreUrl({ need: 'kitchen tap', address: 'Rua X 1', when: 'later', artisan: 'tf' });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(parseSearch(params)).toEqual({
      need: 'kitchen tap',
      address: 'Rua X 1',
      trade: '',
      lngLat: null,
      when: 'later',
      artisan: 'tf',
    });
  });
});

describe('parseSearch', () => {
  it('defaults to now', () => {
    expect(parseSearch(new URLSearchParams('when=whenever')).when).toBe('now');
  });
});

describe('tradeLabel', () => {
  it('knows the pilot trades and falls back gracefully', () => {
    expect(tradeLabel('plumbing')).toBe('Plumbing');
    expect(tradeLabel('nope')).toBe('Any trade');
  });
});
