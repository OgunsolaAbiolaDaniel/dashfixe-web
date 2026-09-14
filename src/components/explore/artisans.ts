/**
 * Sample supply for the explore view and the home page — designs/Dashfixe Web.dc.html.
 *
 * Illustrative. No artisans are recruited yet, so nothing here is live supply.
 * Distances and arrival times are derived from the coordinates (see lib/geo.ts)
 * relative to wherever the customer is, so the list, the map pills and the panel
 * copy can never disagree. Every trade has sample artisans, so choosing a trade
 * (lib/classify or the TradePicker) always shows someone nearby.
 */
import { HOME, distanceKm, etaMinutes, type LngLat } from '../../lib/geo';
import type { Lang } from '../../types';

export type Trade = 'plumbing' | 'electrical' | 'painting' | 'carpentry' | 'cleaning';

const TRADES: ReadonlySet<string> = new Set<Trade>(['plumbing', 'electrical', 'painting', 'carpentry', 'cleaning']);
const isTrade = (s: string | undefined): s is Trade => !!s && TRADES.has(s);

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
  // Plumbing
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
  // Electrical
  {
    id: 'ri',
    initials: 'RI',
    name: 'Rita Almeida',
    trade: 'electrical',
    rating: 4.9,
    jobs: 141,
    price: '€70–90',
    verified: true,
    badges: ['ID verified', 'Insured', 'Certified'],
    lngLat: [-9.133, 38.63], // Corroios, near the station
    at: { left: 30, top: 40 },
  },
  {
    id: 'pn',
    initials: 'PN',
    name: 'Pedro Nunes',
    trade: 'electrical',
    rating: 4.7,
    jobs: 64,
    price: '€65–85',
    lngLat: [-9.108, 38.622], // Arrentela
    at: { left: 58, top: 64 },
  },
  // Painting
  {
    id: 'sm',
    initials: 'SM',
    name: 'Sofia Marques',
    trade: 'painting',
    rating: 4.8,
    jobs: 97,
    price: '€90–140',
    verified: true,
    badges: ['ID verified', 'Insured'],
    lngLat: [-9.125, 38.637], // Amora, by the bay
    at: { left: 42, top: 22 },
  },
  {
    id: 'lb',
    initials: 'LB',
    name: 'Luís Barros',
    trade: 'painting',
    rating: 4.6,
    jobs: 52,
    price: '€85–130',
    lngLat: [-9.098, 38.631], // Seixal
    at: { left: 74, top: 42 },
  },
  // Carpentry
  {
    id: 'jc',
    initials: 'JC',
    name: 'João Costa',
    trade: 'carpentry',
    rating: 4.8,
    jobs: 118,
    price: '€55–70',
    verified: true,
    badges: ['ID verified', 'Insured'],
    lngLat: [-9.119, 38.6215], // Amora south
    at: { left: 47, top: 70 },
  },
  // Cleaning
  {
    id: 'cp',
    initials: 'CP',
    name: 'Carla Pinto',
    trade: 'cleaning',
    rating: 4.9,
    jobs: 176,
    price: '€40–60',
    verified: true,
    badges: ['ID verified'],
    lngLat: [-9.113, 38.6195], // Amora
    at: { left: 52, top: 78 },
  },
  {
    id: 'ib',
    initials: 'IB',
    name: 'Inês Baptista',
    trade: 'cleaning',
    rating: 4.7,
    jobs: 83,
    price: '€45–65',
    lngLat: [-9.139, 38.626], // Corroios
    at: { left: 26, top: 52 },
  },
];

/** A marker with no panel entry. */
export type Marker = { id: string; initials: string; lngLat: LngLat; at: { left: number; top: number } };

/** Available, on the map only (not listed) — shown when no trade is chosen. */
export const MAP_ONLY: Marker[] = [
  { id: 'js', initials: 'JS', lngLat: [-9.101, 38.618], at: { left: 24, top: 63 } },
];

/** On a job — dashed markers, not listed. */
export const ON_JOB: Marker[] = [
  { id: 'pl', initials: 'PL', lngLat: [-9.144, 38.6355], at: { left: 60, top: 19 } },
  { id: 'hn', initials: 'HN', lngLat: [-9.096, 38.633], at: { left: 80, top: 33 } },
  { id: 'as', initials: 'AS', lngLat: [-9.123, 38.619], at: { left: 41, top: 74 } },
];

/** Everyone on the map: available (listed or not) plus those on a job. */
export const TOTAL_ONLINE = SEEDS.length + MAP_ONLY.length + ON_JOB.length;
export const AVAILABLE_COUNT = SEEDS.length + MAP_ONLY.length;

/** How many are free for a trade ('' = any trade, which includes the map-only one). */
export function availableCount(trade?: string): number {
  return isTrade(trade) ? SEEDS.filter((s) => s.trade === trade).length : AVAILABLE_COUNT;
}

export type Supply = {
  /** Listed in the panel, nearest first. */
  available: Artisan[];
  medianEta: number;
};

const cache = new Map<string, Supply>();

/** The sample supply as seen from `home`, optionally for one trade. Memoised. */
export function getSupply(home: LngLat = HOME, trade?: string): Supply {
  const only = isTrade(trade) ? trade : '';
  const key = `${home[0].toFixed(4)},${home[1].toFixed(4)},${only}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const available = SEEDS.filter((s) => !only || s.trade === only)
    .map((seed) => {
      const km = Math.round(distanceKm(home, seed.lngLat) * 10) / 10;
      return { ...seed, km, eta: etaMinutes(km) };
    })
    .sort((a, b) => a.eta - b.eta);

  const etas = available.map((a) => a.eta);
  const mid = Math.floor(etas.length / 2);
  const medianEta = etas.length
    ? etas.length % 2
      ? etas[mid]!
      : Math.round((etas[mid - 1]! + etas[mid]!) / 2)
    : 0;

  const supply = { available, medianEta };
  cache.set(key, supply);
  return supply;
}

/** Convenience for the sample home, used by the home page and tests. */
export const AVAILABLE: Artisan[] = getSupply(HOME).available;
export const MEDIAN_ETA = getSupply(HOME).medianEta;

/** A card in the home page's "Free near you right now" row. */
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

const seed = (id: string) => SEEDS.find((s) => s.id === id)!;

const NEARBY_SEEDS: NearbySeed[] = [
  { id: 'tf', initials: 'TF', name: 'Tiago Ferreira', trade: 'plumbing', price: '€60–75', free: true, lngLat: seed('tf').lngLat },
  { id: 'ri', initials: 'RI', name: 'Rita Almeida', trade: 'electrical', price: '€70–90', free: true, lngLat: seed('ri').lngLat },
  { id: 'cp', initials: 'CP', name: 'Carla Pinto', trade: 'cleaning', price: '€40–60', free: true, lngLat: seed('cp').lngLat },
  { id: 'ms', initials: 'MS', name: 'Miguel Santos', trade: 'carpentry', price: '€55–70', free: false, from: '17:00', lngLat: [-9.105, 38.616] },
];

/** The home page's sample row, with distance and arrival worked out from `home`. */
export function getNearby(home: LngLat = HOME): NearbyPro[] {
  return NEARBY_SEEDS.map((s) => {
    const km = Math.round(distanceKm(home, s.lngLat) * 10) / 10;
    return { ...s, km, eta: etaMinutes(km), listed: SEEDS.some((x) => x.id === s.id) };
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
  ri: {
    about: {
      EN: 'Electrician for 11 years, DGEG-recognised. Fault finding is her favourite part: tripping breakers, dead sockets, lights that flicker. Leaves a short note of what she changed.',
      PT: 'Eletricista há 11 anos, reconhecida pela DGEG. O que mais gosta é de encontrar avarias: disjuntores que disparam, tomadas sem corrente, luzes que piscam. Deixa uma nota do que mudou.',
    },
    years: 11,
    languages: ['Português', 'English'],
    reviews: [
      { name: 'Hugo S.', date: '2 Set', stars: 5, text: 'Encontrou o curto-circuito em meia hora. Explicou tudo e o preço foi o combinado.' },
      { name: 'Claire D.', date: '19 Ago', stars: 5, text: 'Replaced our bathroom light and checked the fuse box while she was here. Very tidy.' },
    ],
  },
  pn: {
    about: {
      EN: 'Six years on domestic installations in Arrentela and Seixal. Sockets, switches, new lights and extractor fans, fitted neatly with the cables hidden.',
      PT: 'Seis anos em instalações domésticas na Arrentela e no Seixal. Tomadas, interruptores, luzes novas e exaustores, montados com os cabos escondidos.',
    },
    years: 6,
    languages: ['Português'],
    reviews: [{ name: 'Joana R.', date: '27 Ago', stars: 5, text: 'Montou três candeeiros e um exaustor numa manhã. Muito cuidadoso.' }],
  },
  sm: {
    about: {
      EN: 'Painter and decorator for 14 years. Prices per room from your photos, covers everything before starting, and treats damp and mould properly instead of painting over it.',
      PT: 'Pintora há 14 anos. Dá preço por divisão a partir das suas fotos, protege tudo antes de começar e trata a humidade e o bolor em vez de pintar por cima.',
    },
    years: 14,
    languages: ['Português', 'English', 'Español'],
    reviews: [
      { name: 'Ricardo A.', date: '24 Ago', stars: 5, text: 'Sala e corredor pintados num dia. Não deixou uma mancha no chão.' },
      { name: 'Emma W.', date: '6 Ago', stars: 5, text: 'Sorted the mould in our bathroom ceiling first, then painted. Great result.' },
    ],
  },
  lb: {
    about: {
      EN: 'Eight years painting homes in Seixal. Touch-ups before moving out, railings and gates, and small plaster repairs.',
      PT: 'Oito anos a pintar casas no Seixal. Retoques antes de sair de casa, grades e portões, e pequenas reparações de estuque.',
    },
    years: 8,
    languages: ['Português'],
    reviews: [{ name: 'Ana P.', date: '21 Ago', stars: 4, text: 'Bom trabalho nos retoques do apartamento. Pontual.' }],
  },
  jc: {
    about: {
      EN: 'Carpenter for 16 years. Doors that stick, hinges, shelves, wardrobes and flat-pack. Brings the common fittings so most jobs finish in one visit.',
      PT: 'Carpinteiro há 16 anos. Portas que prendem, dobradiças, prateleiras, roupeiros e montagem de móveis. Leva as ferragens comuns para acabar quase tudo numa visita.',
    },
    years: 16,
    languages: ['Português', 'English'],
    reviews: [
      { name: 'Miguel F.', date: '29 Ago', stars: 5, text: 'Afinou todas as portas da casa e montou um roupeiro. Excelente.' },
      { name: 'Sarah L.', date: '12 Ago', stars: 5, text: 'Fixed a dropped wardrobe door in twenty minutes. Fair price.' },
    ],
  },
  cp: {
    about: {
      EN: 'Runs a small cleaning team in Amora. Deep cleans, end-of-tenancy and after-renovation, priced up front from photos and the size of the place.',
      PT: 'Tem uma pequena equipa de limpezas na Amora. Limpezas profundas, de fim de contrato e pós-obra, com preço à cabeça a partir das fotos e do tamanho da casa.',
    },
    years: 10,
    languages: ['Português', 'English'],
    reviews: [
      { name: 'Teresa M.', date: '18 Ago', stars: 5, text: 'Casa impecável depois das obras. Recomendo muito.' },
      { name: 'Oliver B.', date: '3 Ago', stars: 5, text: 'End-of-tenancy clean, got the full deposit back.' },
    ],
  },
  ib: {
    about: {
      EN: 'Five years of home cleaning around Corroios. Kitchens, ovens, bathrooms and limescale; brings her own products unless you prefer yours.',
      PT: 'Cinco anos de limpezas em casas na zona de Corroios. Cozinhas, fornos, casas de banho e calcário; traz os produtos, a não ser que prefira os seus.',
    },
    years: 5,
    languages: ['Português'],
    reviews: [{ name: 'Rosa C.', date: '26 Ago', stars: 5, text: 'O forno parece novo. Simpática e muito rigorosa.' }],
  },
};

export function getProfile(id: string): Profile | null {
  return PROFILES[id] ?? null;
}
