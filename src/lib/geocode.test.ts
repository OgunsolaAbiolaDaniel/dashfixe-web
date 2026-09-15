import { afterEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocode, searchAddress, searchFallback } from './geocode';

afterEach(() => vi.unstubAllGlobals());

describe('searchFallback', () => {
  it('matches without accents or case', () => {
    expect(searchFallback('praca 1').map((p) => p.label)).toEqual(['Praça 1.º de Maio, Seixal']);
    expect(searchFallback('COOPERATIVA')[0]?.label).toContain('Cooperativa');
  });

  it('is empty for an empty query', () => {
    expect(searchFallback('  ')).toEqual([]);
  });
});

describe('searchAddress', () => {
  it('shortens Nominatim results to street + town', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            lat: '38.63',
            lon: '-9.11',
            display_name: 'Rua Longa, Amora, Seixal, Setúbal, Portugal',
            address: { road: 'Rua Longa', house_number: '3', suburb: 'Amora' },
          },
        ],
      })),
    );
    const places = await searchAddress('rua longa 3');
    expect(places).toEqual([{ label: 'Rua Longa 3, Amora', lngLat: [-9.11, 38.63] }]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain('bounded=1');
  });

  it('falls back to the pilot list when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const places = await searchAddress('seixal');
    expect(places.length).toBeGreaterThan(0);
    expect(places.every((p) => p.label.includes('Seixal'))).toBe(true);
  });

  it('skips the network for short queries', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await searchAddress('ru')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('reverseGeocode', () => {
  it('labels coordinates when the lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    const place = await reverseGeocode([-9.1165, 38.6283]);
    expect(place.label).toBe('38.6283, -9.1165');
    expect(place.lngLat).toEqual([-9.1165, 38.6283]);
  });
});
