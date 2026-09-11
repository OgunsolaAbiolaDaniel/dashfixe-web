/**
 * Sample jobs — the account walkthrough's history and its one live job.
 * Everything /job/:id and /activity render comes from here, so amounts, artisans
 * and stories can never disagree between pages. Replaced by GET /api/jobs in
 * Phase 5; the shapes below are the API contract draft (ARCHITECTURE.md §6).
 */
import type { Lang } from '../types';
import type { LngLat } from './geo';
import type { Trade } from '../components/explore/artisans';

export type JobStatus = 'agreed' | 'travelling' | 'working' | 'done';

export type Bilingual = Record<Lang, string>;

export type ReceiptLine = { label: Bilingual; amount: number };

export type Job = {
  id: string;
  /** Matches an id in the sample supply when the artisan has a profile. */
  artisanId: string;
  artisanName: string;
  initials: string;
  trade: Trade;
  title: Bilingual;
  status: JobStatus;
  /** ISO date of the visit. */
  date: string;
  /** Only while travelling: where the artisan is coming from, and when they land. */
  from?: LngLat;
  arrives?: string;
  lines: ReceiptLine[];
  total: number;
  paid: boolean;
  /** Stars already given, if the customer rated it. */
  rating?: number;
};

const JOBS: Job[] = [
  {
    id: 'dfx-1042',
    artisanId: 'tf',
    artisanName: 'Tiago Ferreira',
    initials: 'TF',
    trade: 'plumbing',
    title: { EN: 'Leaking mixer tap', PT: 'Misturadora a pingar' },
    status: 'travelling',
    date: '2026-09-11',
    from: [-9.1118, 38.6338],
    arrives: '14:35',
    lines: [
      { label: { EN: 'Mixer cartridge', PT: 'Cartucho da misturadora' }, amount: 14 },
      { label: { EN: 'Labour (est. 1 h)', PT: 'Mão de obra (est. 1 h)' }, amount: 49 },
    ],
    total: 63,
    paid: false,
  },
  {
    id: 'dfx-1031',
    artisanId: 'ri',
    artisanName: 'Rita Almeida',
    initials: 'RA',
    trade: 'electrical',
    title: { EN: 'Bathroom light replaced', PT: 'Luz da casa de banho substituída' },
    status: 'done',
    date: '2026-09-02',
    lines: [
      { label: { EN: 'Ceiling fixture', PT: 'Armadura de teto' }, amount: 18 },
      { label: { EN: 'Labour (45 min)', PT: 'Mão de obra (45 min)' }, amount: 30 },
    ],
    total: 48,
    paid: true,
  },
  {
    id: 'dfx-1027',
    artisanId: 'cp',
    artisanName: 'Carla Pinto',
    initials: 'CP',
    trade: 'cleaning',
    title: { EN: 'Deep clean, two bedrooms', PT: 'Limpeza profunda, dois quartos' },
    status: 'done',
    date: '2026-08-18',
    lines: [{ label: { EN: 'Deep clean, two bedrooms', PT: 'Limpeza profunda, dois quartos' }, amount: 95 }],
    total: 95,
    paid: true,
    rating: 5,
  },
];

export function getJob(id: string): Job | null {
  return JOBS.find((j) => j.id === id) ?? null;
}

/** The one live job the walkthrough tracks, if any. */
export const ACTIVE_JOB_ID = 'dfx-1042';

export function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}
