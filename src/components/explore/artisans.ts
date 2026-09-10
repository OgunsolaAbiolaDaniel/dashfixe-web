/**
 * Sample supply for the explore view and the home page — designs/Dashfixe Web.dc.html.
 *
 * Illustrative. No artisans are recruited yet, so nothing here is live supply.
 * Distances and arrival times are derived from the coordinates (see lib/geo.ts)
 * relative to wherever the customer is, so the list, the map pills and the panel
 * copy can never disagree.
 */
import { HOME, distanceKm, etaMinutes, type LngLat } from '../../lib/geo';

export type Trade = 'plumbing' | 'electrical' | 'painting' | 'carpentry' | 'cleaning';

export type Artisan = {
  id: string;
  initials: string;
  name: string;
  trade: Trade;
  rating: number;
  jobs: number;
  /** Distance from the customer, km, one decimal. Derived. */
  km: number;
  price: string;
  /** Minutes until they could be at the door. Derived. */
  eta: number;
  verified?: boolean;
  badges?: string[];
  /** Where they are right now. */
  lngLat: LngLat;
  /** Marker position on the static fallback canvas, in percent. */
  at: { left: number; top: number };
};

type Seed = Omit<Artisan, 'km' | 'eta'>;

const SEEDS: Seed[] = [
  {
    id: 'tf',
    initials: 'TF',
    name: 'Tiago Ferreira',
    trade: 'plumbing',
    rating: 4.9,
    jobs: 203,
    price: '€60–75',
    verified: true,
    badges: ['ID verified', 'Insured', 'Certified'],
    lngLat: [-9.1118, 38.6338], // Cruz de Pau, between Amora and Seixal
    at: { left: 53, top: 38 },
  },
  {
    id: 'ra',
    initials: 'RA',
    name: 'Rui Almeida',
    trade: 'plumbing',
    rating: 4.8,
    jobs: 126,
    price: '€55–70',
    lngLat: [-9.1352, 38.6238], // Corroios side
    at: { left: 31, top: 24 },
  },
  {
    id: 'mc',
    initials: 'MC',
    name: 'Marta Cunha',
    trade: 'plumbing',
    rating: 4.7,
    jobs: 88,
    price: '€50–65',
    lngLat: [-9.0905, 38.6262], // Paio Pires
    at: { left: 71, top: 56 },
  },
];

/** A marker with no panel entry. */
export type Marker = { id: string; initials: string; lngLat: LngLat; at: { left: number; top: number } };

/** Available, on the map only — makes the "4 of 9" count add up. */
export const MAP_ONLY: Marker[] = [
  { id: 'js', initials: 'JS', lngLat: [-9.101, 38.618], at: { left: 24, top: 63 } },
];

/** On a job — dashed markers, not listed. */
export const ON_JOB: Marker[] = [
  { id: 'pl', initials: 'PL', lngLat: [-9.144, 38.6355], at: { left: 60, top: 19 } },
  { id: 'hn', initials: 'HN', lngLat: [-9.096, 38.633], at: { left: 80, top: 33 } },
  { id: 'as', initials: 'AS', lngLat: [-9.123, 38.619], at: { left: 41, top: 74 } },
];

export const TOTAL_ONLINE = 9;
export const AVAILABLE_COUNT = SEEDS.length + MAP_ONLY.length;

export type Supply = {
  /** Listed in the panel, nearest first. */
  available: Artisan[];
  medianEta: number;
};

const cache = new Map<string, Supply>();

/** The sample supply as seen from `home`. Memoised per location. */
export function getSupply(home: LngLat = HOME): Supply {
  const key = `${home[0].toFixed(4)},${home[1].toFixed(4)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const available = SEEDS.map((seed) => {
    const km = Math.round(distanceKm(home, seed.lngLat) * 10) / 10;
    return { ...seed, km, eta: etaMinutes(km) };
  }).sort((a, b) => a.eta - b.eta);

  const etas = available.map((a) => a.eta);
  const mid = Math.floor(etas.length / 2);
  const medianEta = etas.length % 2 ? etas[mid]! : Math.round((etas[mid - 1]! + etas[mid]!) / 2);

  const supply = { available, medianEta };
  cache.set(key, supply);
  return supply;
}

/** Convenience for the sample home, used by the home page and tests. */
export const AVAILABLE: Artisan[] = getSupply(HOME).available;
export const MEDIAN_ETA = getSupply(HOME).medianEta;
