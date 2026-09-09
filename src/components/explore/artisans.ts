/**
 * Search results for the explore view — designs/Dashfixe Web.dc.html.
 *
 * Illustrative. No artisans are recruited yet, so nothing here is live supply.
 */
export type Artisan = {
  id: string;
  initials: string;
  name: string;
  rating: number;
  jobs: number;
  km: number;
  price: string;
  eta: number;
  verified?: boolean;
  badges?: string[];
  /** Marker position on the map canvas, in percent. */
  at: { left: number; top: number };
};

/** Available now — listed in the panel and solid on the map. */
export const AVAILABLE: Artisan[] = [
  {
    id: 'tf',
    initials: 'TF',
    name: 'Tiago Ferreira',
    rating: 4.9,
    jobs: 203,
    km: 1.4,
    price: '€60–75',
    eta: 18,
    verified: true,
    badges: ['ID verified', 'Insured', 'Certified'],
    at: { left: 53, top: 38 },
  },
  {
    id: 'ra',
    initials: 'RA',
    name: 'Rui Almeida',
    rating: 4.8,
    jobs: 126,
    km: 1.9,
    price: '€55–70',
    eta: 22,
    at: { left: 31, top: 24 },
  },
  {
    id: 'mc',
    initials: 'MC',
    name: 'Marta Cunha',
    rating: 4.7,
    jobs: 88,
    km: 3.1,
    price: '€50–65',
    eta: 31,
    at: { left: 71, top: 56 },
  },
];

/** A marker with no panel entry. */
export type Marker = { id: string; initials: string; at: { left: number; top: number } };

/** Available, on the map only — makes the "4 of 9" count add up. */
export const MAP_ONLY: Marker[] = [{ id: 'js', initials: 'JS', at: { left: 24, top: 63 } }];

/** On a job — dashed markers, not listed. */
export const ON_JOB: Marker[] = [
  { id: 'pl', initials: 'PL', at: { left: 60, top: 19 } },
  { id: 'hn', initials: 'HN', at: { left: 80, top: 33 } },
  { id: 'as', initials: 'AS', at: { left: 41, top: 74 } },
];

export const TOTAL_ONLINE = 9;
export const AVAILABLE_COUNT = AVAILABLE.length + MAP_ONLY.length;
