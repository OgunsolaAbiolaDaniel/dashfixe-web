import { describe, expect, it } from 'vitest';
import { exploreUrl, normalizeSlot, parseSearch, tradeLabel, windowOpen } from './search';

describe('slots', () => {
  const nineAm = new Date(2026, 8, 14, 9, 0);
  const ninePm = new Date(2026, 8, 14, 21, 0);

  it('needs an hour of notice for a window today, none for later days', () => {
    expect(windowOpen(0, 0, nineAm)).toBe(false); // 08–10 has started
    expect(windowOpen(0, 1, nineAm)).toBe(true); // 10–12, an hour away
    expect(windowOpen(3, 0, ninePm)).toBe(true);
  });

  it('books what the picker shows: no passed windows, no finished days, no clamping to a week', () => {
    expect(normalizeSlot(0, 0, nineAm)).toEqual({ day: 0, win: 1 });
    expect(normalizeSlot(0, 2, ninePm)).toEqual({ day: 1, win: 2 });
    expect(normalizeSlot(20, 4, nineAm)).toEqual({ day: 20, win: 4 });
    expect(normalizeSlot(90, 9, nineAm)).toEqual({ day: 29, win: 5 });
  });

  it('reads a day up to 30 days ahead from the URL', () => {
    expect(parseSearch(new URLSearchParams('when=later&day=29')).day).toBe(29);
    expect(parseSearch(new URLSearchParams('when=later&day=30')).day).toBeNull();
  });
});

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
      day: null,
      win: null,
      sort: 'arrival',
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

describe('the later-mode slot in the URL', () => {
  it('round-trips day and window', () => {
    const url = exploreUrl({ when: 'later', day: 2, win: 4 });
    expect(url).toBe('/explore?when=later&day=2&win=4');
    const parsed = parseSearch(new URLSearchParams(url.split('?')[1]));
    expect(parsed.day).toBe(2);
    expect(parsed.win).toBe(4);
  });

  it('rejects out-of-range or junk values', () => {
    // The horizon is 30 days (0–29); day 9 is a real slot now.
    expect(parseSearch(new URLSearchParams('day=30&win=abc')).day).toBeNull();
    expect(parseSearch(new URLSearchParams('day=-1')).day).toBeNull();
    expect(parseSearch(new URLSearchParams('day=9&win=abc')).day).toBe(9);
    expect(parseSearch(new URLSearchParams('day=9&win=abc')).win).toBeNull();
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
