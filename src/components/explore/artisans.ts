/**
 * Sample supply for the explore view and the home page — designs/Dashfixe Web.dc.html.
 *
 * Illustrative. No artisans are recruited yet, so nothing here is live supply.
 * Distances and arrival times are derived from the coordinates (see lib/geo.ts)
 * relative to wherever the customer is, so the list, the map pills and the panel
 * copy can never disagree.
 */
import { HOME, distanceKm, etaMinutes, type LngLat } from '../../lib/geo';
import type { Lang } from '../../types';

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

/** A card in the home page's "Free in Amora right now" row. */
export type NearbyPro = {
  id: string;
  initials: string;
  name: string;
  trade: Trade;
  price: string;
  /** Free right now, or free from `from`. */
  free: boolean;
  from?: string;
  lngLat: LngLat;
  km: number;
  eta: number;
  /** Also listed on /explore, so the card can pre-select them there. */
  listed: boolean;
};

type NearbySeed = Omit<NearbyPro, 'km' | 'eta' | 'listed'>;

const NEARBY_SEEDS: NearbySeed[] = [
  { id: 'tf', initials: 'TF', name: 'Tiago Ferreira', trade: 'plumbing', price: '€60–75', free: true, lngLat: SEEDS[0]!.lngLat },
  { id: 'ri', initials: 'RA', name: 'Rita Almeida', trade: 'electrical', price: '€70–90', free: true, lngLat: [-9.133, 38.63] },
  { id: 'cp', initials: 'CP', name: 'Carla Pinto', trade: 'cleaning', price: '€40–60', free: true, lngLat: [-9.115, 38.62] },
  { id: 'ms', initials: 'MS', name: 'Miguel Santos', trade: 'carpentry', price: '€55–70', free: false, from: '17:00', lngLat: [-9.105, 38.616] },
];

/** The home page's sample row, with distance and arrival worked out from `home`. */
export function getNearby(home: LngLat = HOME): NearbyPro[] {
  return NEARBY_SEEDS.map((seed) => {
    const km = Math.round(distanceKm(home, seed.lngLat) * 10) / 10;
    return { ...seed, km, eta: etaMinutes(km), listed: SEEDS.some((s) => s.id === seed.id) };
  });
}

/** A sample review — kept in Portuguese on purpose; that is what real ones will look like. */
export type Review = { name: string; date: string; stars: number; text: string };

export type Profile = {
  about: Record<Lang, string>;
  years: number;
  languages: string[];
  reviews: Review[];
};

/**
 * Profiles for the listed sample artisans — the trust page's content
 * (ARCHITECTURE.md §4, /artisan/:id). Illustrative, badged as sample where shown.
 */
const PROFILES: Record<string, Profile> = {
  tf: {
    about: {
      EN: 'Plumber in Amora for 12 years. Tidy work, explains what he is doing as he goes, and carries the common cartridges and washers on the van so most small jobs finish in one visit.',
      PT: 'Canalizador na Amora há 12 anos. Trabalho limpo, explica o que está a fazer, e leva na carrinha os cartuchos e vedantes mais comuns — a maioria dos trabalhos pequenos fica pronta numa visita.',
    },
    years: 12,
    languages: ['Português', 'English'],
    reviews: [
      { name: 'Sofia M.', date: '28 Ago', stars: 5, text: 'Chegou à hora, preço igual ao combinado no chat, torneira como nova. Recomendo.' },
      { name: 'James T.', date: '15 Ago', stars: 5, text: 'Explained everything in English, fixed the leak in 40 minutes. Exactly the price we agreed.' },
      { name: 'Rui P.', date: '2 Ago', stars: 4, text: 'Bom trabalho no esquentador. Deixou tudo limpo. Só demorou um pouco mais do que o previsto.' },
    ],
  },
  ra: {
    about: {
      EN: 'Nine years on bathrooms and kitchens around Corroios. Straight talker: sends the itemised price in chat and sticks to it.',
      PT: 'Nove anos em casas de banho e cozinhas na zona de Corroios. Direto: envia o preço discriminado no chat e cumpre-o.',
    },
    years: 9,
    languages: ['Português'],
    reviews: [
      { name: 'Marta L.', date: '30 Ago', stars: 5, text: 'Resolveu um entupimento difícil sem partir nada. Preço justo.' },
      { name: 'Pedro C.', date: '11 Ago', stars: 4, text: 'Trabalho sólido na canalização da cozinha. Voltaria a chamar.' },
    ],
  },
  mc: {
    about: {
      EN: 'Seven years in Paio Pires. Small repairs are her speciality — taps, siphons, flush mechanisms — usually same-day.',
      PT: 'Sete anos em Paio Pires. Especialista em pequenas reparações — torneiras, sifões, autoclismos — normalmente no próprio dia.',
    },
    years: 7,
    languages: ['Português', 'English'],
    reviews: [
      { name: 'Beatriz F.', date: '25 Ago', stars: 5, text: 'Rápida e simpática. O autoclismo ficou perfeito e o preço não mudou.' },
      { name: 'Anna K.', date: '9 Ago', stars: 4, text: 'Came the same afternoon. Clear about the price before starting.' },
    ],
  },
};

export function getProfile(id: string): Profile | null {
  return PROFILES[id] ?? null;
}
