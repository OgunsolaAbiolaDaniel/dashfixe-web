/**
 * Jobs — the account's history, its live job, and every job booked in this
 * browser's walkthrough. /job/:id, /activity and the home banner all read from
 * here, so amounts, artisans and states can never disagree between pages.
 *
 * Seeded sample history + per-browser jobs (localStorage) created when a
 * customer approves an estimate in chat. Replaced by GET/POST /api/jobs in
 * Phase 6; the shapes below are the API contract draft (ARCHITECTURE.md §6).
 */
import { useSyncExternalStore } from 'react';
import type { Lang } from '../types';
import type { LngLat } from './geo';
import type { Trade } from '../components/explore/artisans';

export type JobStatus = 'agreed' | 'travelling' | 'working' | 'done' | 'cancelled';

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
  /** Where the artisan is coming from, and the customer's address. */
  from?: LngLat;
  to?: LngLat;
  address?: string;
  /** Travelling: when they land (HH:MM). */
  arrives?: string;
  /** Booked ahead: the two-hour window on `date`. */
  slot?: { window: string };
  lines: ReceiptLine[];
  total: number;
  paid: boolean;
  /** Stars given, once the customer rated it. */
  rating?: number;
  /** Booked in this browser's walkthrough (vs the seeded history). */
  mine?: boolean;
};

const SEED: Job[] = [
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
  {
    id: 'dfx-1019',
    artisanId: 'ms',
    artisanName: 'Miguel Santos',
    initials: 'MS',
    trade: 'carpentry',
    title: { EN: 'Wardrobe door adjustment', PT: 'Ajuste da porta do roupeiro' },
    status: 'cancelled',
    date: '2026-08-11',
    lines: [],
    total: 0,
    paid: false,
  },
];

/** The seeded live job the walkthrough starts with. */
export const ACTIVE_JOB_ID = 'dfx-1042';

// ── The store ───────────────────────────────────────────────────────────────
// Stored jobs are this browser's own bookings plus edits to seeded ones (a
// finished or rated sample job). Memoised on the raw string so snapshots keep
// their identity between reads, as useSyncExternalStore requires.

const KEY = 'dfx.jobs';
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let lastAll: Job[] = SEED;

function stored(): Job[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed.filter((j) => j && typeof j.id === 'string') as Job[]) : [];
  } catch {
    return [];
  }
}

/** Every job, newest first. */
export function listJobs(): Job[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked: the seeded history stands */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    const own = stored();
    const ids = new Set(own.map((j) => j.id));
    lastAll = [...own, ...SEED.filter((j) => !ids.has(j.id))].sort((a, b) => b.date.localeCompare(a.date));
  }
  return lastAll;
}

function write(jobs: Job[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs));
  } catch {
    /* full or blocked — the walkthrough carries on without persistence */
  }
  listeners.forEach((l) => l());
}

export function getJob(id: string): Job | null {
  return listJobs().find((j) => j.id === id) ?? null;
}

/** The job in progress, if any: booked, on the way, or being worked on. */
export function activeJob(jobs: Job[] = listJobs()): Job | null {
  return jobs.find((j) => j.status === 'agreed' || j.status === 'travelling' || j.status === 'working') ?? null;
}

export type NewJob = Omit<Job, 'id' | 'date' | 'paid' | 'mine'> & { dayOffset?: number };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Book a job — what approving an estimate in chat does. */
export function createJob({ dayOffset = 0, ...input }: NewJob): Job {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const own = stored();
  const job: Job = { ...input, id: `dfx-${2001 + own.filter((j) => j.mine).length}`, date: iso(date), paid: false, mine: true };
  write([job, ...own]);
  return job;
}

export function updateJob(id: string, patch: Partial<Job>) {
  const job = getJob(id);
  if (!job) return;
  write([{ ...job, ...patch }, ...stored().filter((j) => j.id !== id)]);
}

/** Walkthrough: the work is done and paid in the app. */
export function finishJob(id: string) {
  updateJob(id, { status: 'done', paid: true, arrives: undefined });
}

export function rateJob(id: string, stars: number) {
  updateJob(id, { rating: stars });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Every job, re-rendering whenever one is booked, finished or rated. */
export function useJobs(): Job[] {
  return useSyncExternalStore(subscribe, listJobs, listJobs);
}

// ── Formatting ──────────────────────────────────────────────────────────────

export function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

/** "2 Sep" / "2 set." — the visit date as people say it. */
export function formatDate(isoDate: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'PT' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

/** "14:35", `minutes` from now. */
export function clockIn(minutes: number, now = Date.now()): string {
  const d = new Date(now + minutes * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
