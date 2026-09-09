/**
 * Search results for the explore view — designs/Dashfixe Web.dc.html.
 *
 * Illustrative. No artisans are recruited yet, so nothing here is live supply.
 * Distances and arrival times are derived from the coordinates (see lib/geo.ts)
 * so the list, the map pills and the panel copy can never disagree.
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
  /** Distance from HOME, km, one decimal. Derived. */
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

function derive(seed: Seed): Artisan {
  const km = Math.round(distanceKm(HOME, seed.lngLat) * 10) / 10;
  return { ...seed, km, eta: etaMinutes(km) };
}

/** Available now — listed in the panel and solid on the map. Nearest first. */
export const AVAILABLE: Artisan[] = (
  [
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
  ] satisfies Seed[]
)
  .map(derive)
  .sort((a, b) => a.eta - b.eta);

/** A marker with no panel entry. */
export type Marker = { id: string; initials: string; lngLat: LngLat; at: { left: number; top: number } };

/** Available, on the map only — makes the "4 of 9" count add up. */
export const MAP_ONLY: Marker[] = [
  { id: 'js', initials: 'JS', lngLat: [-9.1010, 38.6180], at: { left: 24, top: 63 } },
];

/** On a job — dashed markers, not listed. */
export const ON_JOB: Marker[] = [
  { id: 'pl', initials: 'PL', lngLat: [-9.1440, 38.6355], at: { left: 60, top: 19 } },
  { id: 'hn', initials: 'HN', lngLat: [-9.0960, 38.6330], at: { left: 80, top: 33 } },
  { id: 'as', initials: 'AS', lngLat: [-9.1230, 38.6190], at: { left: 41, top: 74 } },
];

export const TOTAL_ONLINE = 9;
export const AVAILABLE_COUNT = AVAILABLE.length + MAP_ONLY.length;

/** Median arrival across who is listed — shown in the stats strip. */
export const MEDIAN_ETA = (() => {
  const etas = AVAILABLE.map((a) => a.eta).sort((a, b) => a - b);
  const mid = Math.floor(etas.length / 2);
  return etas.length % 2 ? etas[mid]! : Math.round((etas[mid - 1]! + etas[mid]!) / 2);
})();
