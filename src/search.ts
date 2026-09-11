/**
 * The search a customer is building, carried from the home composer into /explore.
 *
 * Held in the URL so a search is shareable, survives a reload and works with the
 * back button — the composer on the home page and the panel on /explore read the
 * same values.
 */
import { HOME, type LngLat } from './lib/geo';

export type When = 'now' | 'later';

export type Search = {
  /** Free text: "kitchen tap dripping". */
  need: string;
  /** Trade slug, when one was picked explicitly. */
  trade: string;
  address: string;
  /** Where the address is, when it was resolved. The map centres here. */
  lngLat: LngLat | null;
  when: When;
  /** Later mode: chosen day offset (0–6) and two-hour window index (0–5). */
  day: number | null;
  win: number | null;
  /** Artisan pre-selected on arrival, e.g. from a "book again" card. */
  artisan: string;
};

export const TRADES = [
  { slug: 'plumbing', label: 'Plumbing' },
  { slug: 'electrical', label: 'Electrical' },
  { slug: 'painting', label: 'Painting' },
  { slug: 'carpentry', label: 'Carpentry' },
  { slug: 'cleaning', label: 'Cleaning' },
  { slug: 'other', label: 'Something else' },
] as const;

export const DEFAULT_ADDRESS = 'Rua da Cooperativa 14, Amora';

export function tradeLabel(slug: string): string {
  return TRADES.find((t) => t.slug === slug)?.label ?? 'Any trade';
}

function parseLngLat(params: URLSearchParams): LngLat | null {
  const lng = Number(params.get('lng'));
  const lat = Number(params.get('lat'));
  if (!params.has('lng') || !params.has('lat') || Number.isNaN(lng) || Number.isNaN(lat)) return null;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return [lng, lat];
}

function intParam(params: URLSearchParams, name: string, max: number): number | null {
  if (!params.has(name)) return null;
  const v = Number(params.get(name));
  return Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}

export function parseSearch(params: URLSearchParams): Search {
  return {
    need: params.get('need') ?? '',
    trade: params.get('trade') ?? '',
    address: params.get('address') ?? '',
    lngLat: parseLngLat(params),
    when: params.get('when') === 'later' ? 'later' : 'now',
    day: intParam(params, 'day', 6),
    win: intParam(params, 'win', 5),
    artisan: params.get('artisan') ?? '',
  };
}

/** Where the search is anchored: the resolved address, or the sample home. */
export function searchHome(search: Pick<Search, 'lngLat'>): LngLat {
  return search.lngLat ?? HOME;
}

/** Build an /explore URL, omitting anything empty so links stay readable. */
export function exploreUrl(search: Partial<Search>): string {
  const params = new URLSearchParams();
  if (search.need) params.set('need', search.need);
  if (search.trade) params.set('trade', search.trade);
  if (search.address) params.set('address', search.address);
  if (search.lngLat) {
    params.set('lng', search.lngLat[0].toFixed(5));
    params.set('lat', search.lngLat[1].toFixed(5));
  }
  if (search.when === 'later') params.set('when', 'later');
  if (search.day != null) params.set('day', String(search.day));
  if (search.win != null) params.set('win', String(search.win));
  if (search.artisan) params.set('artisan', search.artisan);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : '/explore';
}
