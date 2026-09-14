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
  /** Result ordering. Arrival is the default and stays out of the URL. */
  sort: 'arrival' | 'price';
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

/** The bookable two-hour windows, shared by the explore picker and the home card. */
export const WINDOWS = ['08\u201310', '10\u201312', '12\u201314', '14\u201316', '16\u201318', '18\u201320'] as const;

/** How far ahead a slot can be held \u2014 the "up to 30 days ahead" promise. Day 0 is today. */
export const HORIZON_DAYS = 30;

/** A same-day window needs this much notice, in hours, before it starts. */
const NOTICE_H = 1;

/** Can window `win` still be booked on day `day` (0 = today)? */
export function windowOpen(day: number, win: number, now: Date = new Date()): boolean {
  if (day > 0) return true;
  const start = 8 + 2 * win;
  return start >= now.getHours() + now.getMinutes() / 60 + NOTICE_H;
}

/** The first window still open on `day`, or -1 when the day is over. */
export function firstOpenWindow(day: number, now: Date = new Date()): number {
  return WINDOWS.findIndex((_, i) => windowOpen(day, i, now));
}

/**
 * A slot that can actually be booked: inside the horizon, not a day that's over,
 * not a window that has passed. What the picker shows is what gets booked.
 */
export function normalizeSlot(day: number, win: number, now: Date = new Date()): { day: number; win: number } {
  let d = Math.min(Math.max(0, day), HORIZON_DAYS - 1);
  if (firstOpenWindow(d, now) < 0) d += 1;
  const w = Math.min(Math.max(0, win), WINDOWS.length - 1);
  return { day: d, win: windowOpen(d, w, now) ? w : firstOpenWindow(d, now) };
}

/** '€60–75' → 60, for price ordering. */
export function priceFrom(price: string): number {
  return Number.parseInt(price.replace(/[^\d]/g, ' ').trim().split(' ')[0] ?? '0', 10);
}

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
    day: intParam(params, 'day', HORIZON_DAYS - 1),
    win: intParam(params, 'win', 5),
    sort: params.get('sort') === 'price' ? 'price' : 'arrival',
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
  if (search.sort === 'price') params.set('sort', 'price');
  if (search.artisan) params.set('artisan', search.artisan);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : '/explore';
}
