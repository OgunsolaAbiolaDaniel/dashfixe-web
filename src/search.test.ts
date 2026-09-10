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
      lngLat: null,
      trade: '',
      when: 'later',
      artisan: 'tf',
    });
  });
});

describe('coordinates in the URL', () => {
  it('carry a resolved address as rounded lng/lat', () => {
    const url = exploreUrl({ address: 'Rua X', lngLat: [-9.1165, 38.6283] });
    expect(url).toBe('/explore?address=Rua+X&lng=-9.11650&lat=38.62830');
    expect(parseSearch(new URLSearchParams(url.split('?')[1])).lngLat).toEqual([-9.1165, 38.6283]);
  });

  it('are ignored when half-missing, non-numeric or out of range', () => {
    expect(parseSearch(new URLSearchParams('lng=-9.1')).lngLat).toBeNull();
    expect(parseSearch(new URLSearchParams('lng=abc&lat=38')).lngLat).toBeNull();
    expect(parseSearch(new URLSearchParams('lng=-200&lat=38')).lngLat).toBeNull();
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
