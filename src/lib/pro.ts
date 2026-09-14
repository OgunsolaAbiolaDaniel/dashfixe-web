/**
 * The artisan app walkthrough (/pro): its money rules and its per-browser store.
 *
 * Money follows designs/Dashfixe Artisan App.dc.html: lines → subtotal, IVA 23%
 * on top, the customer pays the total, and the commission (12%, the design's
 * example pilot rate — not a published tariff) comes out of the total on a
 * finished job only. No lead fees, ever. Everything is rounded to the cent at
 * each step, so what the artisan sees is what adds up.
 *
 * Sample data: one pilot artisan (Tiago), a sample customer and a seeded week of
 * payouts. The job taken in the walkthrough is added to that week. Nothing is
 * sent anywhere; Phase 6 replaces this with the artisan API.
 */
import { useSyncExternalStore } from 'react';
import type { Bilingual } from './jobs';

export const IVA_RATE = 0.23;
export const COMMISSION_RATE = 0.12;

export type LineKind = 'part' | 'labour' | 'callout';
export type QuoteLine = { id: string; kind: LineKind; label: string; detail: string; amount: number };

const cents = (n: number) => Math.round(n * 100) / 100;

/** An estimate: what the customer pays, and what the artisan receives. */
export function quote(lines: QuoteLine[]) {
  const subtotal = cents(lines.reduce((sum, l) => sum + (Number.isFinite(l.amount) && l.amount > 0 ? l.amount : 0), 0));
  const iva = cents(subtotal * IVA_RATE);
  const total = cents(subtotal + iva);
  return { subtotal, iva, total, ...payout(total) };
}

/** The commission on a finished job of `total` (IVA included), and the payout. */
export function payout(total: number) {
  const commission = cents(total * COMMISSION_RATE);
  return { commission, net: cents(total - commission) };
}

// ── The store ───────────────────────────────────────────────────────────────

export type Paid = { id: string; initials: string; title: Bilingual; at: number; total: number; net: number };
type State = { online: boolean; weekend: boolean; paid: Paid[] };

const DAY_MS = 86_400_000;
const LOADED = Date.now();

/** A seeded week of finished jobs (sample), so Earnings has a week to show. */
const SEED: Paid[] = (
  [
    ['s1', 'JC', 'Shower mixer', 'Misturadora de duche', 1, 16, 20, 110],
    ['s2', 'AR', 'Radiator bleed × 6', 'Purga de radiadores × 6', 2, 11, 5, 59.32],
    ['s3', 'MV', 'Toilet cistern valve', 'Válvula do autoclismo', 3, 14, 40, 66.36],
    ['s4', 'RP', 'Kitchen sink trap', 'Sifão do lava-loiça', 3, 9, 15, 46.93],
    ['s5', 'CT', 'Outside tap', 'Torneira exterior', 4, 17, 50, 50.68],
    ['s6', 'LN', 'Washing-machine hose', 'Mangueira da máquina de lavar', 5, 10, 30, 54.77],
  ] as const
).map(([id, initials, EN, PT, days, h, m, total]) => {
  // A working-hours time on that day, not "now minus n days".
  const at = new Date(LOADED - days * DAY_MS);
  at.setHours(h, m, 0, 0);
  return { id, initials, title: { EN, PT }, at: at.getTime(), total, net: payout(total).net };
});

const KEY = 'dfx.pro';
const EMPTY: State = { online: false, weekend: false, paid: [] };
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let last: State = EMPTY;

function read(): State {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const s = raw ? (JSON.parse(raw) as Partial<State>) : {};
      last = { online: !!s.online, weekend: !!s.weekend, paid: Array.isArray(s.paid) ? s.paid : [] };
    } catch {
      last = EMPTY;
    }
  }
  return last;
}

function write(patch: Partial<State>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    /* full or blocked */
  }
  listeners.forEach((l) => l());
}

export const setOnline = (online: boolean) => write({ online });
export const setWeekend = (weekend: boolean) => write({ weekend });

/** Record a finished walkthrough job in this week's payout. */
export function recordPaid(job: Omit<Paid, 'id' | 'at' | 'net'>) {
  const entry: Paid = { ...job, id: `w${Date.now()}`, at: Date.now(), net: payout(job.total).net };
  write({ paid: [entry, ...read().paid] });
  return entry;
}

/** Start the walkthrough over: offline, and only the seeded week. */
export const resetPro = () => write(EMPTY);

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function usePro(): State {
  return useSyncExternalStore(subscribe, read, read);
}

/** Whole days between `at` and now (0 = today). */
export const daysAgo = (at: number, now = Date.now()) => {
  const a = new Date(at);
  const b = new Date(now);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
};

/** This week's finished jobs, newest first: the walkthrough's, then the seeded ones. */
export function week(paid: Paid[], now = Date.now()) {
  const jobs = [...paid, ...SEED].filter((p) => daysAgo(p.at, now) < 7).sort((a, b) => b.at - a.at);
  const gross = cents(jobs.reduce((s, j) => s + j.total, 0));
  const net = cents(jobs.reduce((s, j) => s + j.net, 0));
  return { jobs, gross, net, commission: cents(gross - net) };
}
