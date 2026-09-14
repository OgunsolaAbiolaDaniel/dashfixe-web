/**
 * Dashfixe credit — the account's wallet (docs/ARCHITECTURE.md §6).
 *
 * Walkthrough credit, never real money: promo codes add it, and approving an
 * estimate spends it automatically (it appears as a "Dashfixe credit" line on the
 * job and its receipt). Per-browser localStorage, like the jobs store, until the
 * Phase 6 payments backend owns balances.
 */
import { useSyncExternalStore } from 'react';

export type CreditEntry =
  | { id: string; date: string; amount: number; kind: 'code'; code: string }
  | { id: string; date: string; amount: number; kind: 'job'; jobId: string };

export type Wallet = { credit: number; history: CreditEntry[]; redeemed: string[] };

/** Pilot promo codes — sample credit for the walkthrough. */
export const PROMO_CODES: Readonly<Record<string, number>> = { PILOT10: 10, BEMVINDO5: 5 };

const KEY = 'dfx.wallet';
const EMPTY: Wallet = { credit: 0, history: [], redeemed: [] };
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let last: Wallet = EMPTY;

function parse(raw: string | null): Wallet {
  if (!raw) return EMPTY;
  try {
    const w = JSON.parse(raw) as Partial<Wallet>;
    return {
      credit: typeof w.credit === 'number' && w.credit > 0 ? w.credit : 0,
      history: Array.isArray(w.history) ? w.history : [],
      redeemed: Array.isArray(w.redeemed) ? w.redeemed : [],
    };
  } catch {
    return EMPTY;
  }
}

export function getWallet(): Wallet {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    last = parse(raw);
  }
  return last;
}

function write(w: Wallet) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* full or blocked */
  }
  listeners.forEach((l) => l());
}

const today = () => new Date().toISOString().slice(0, 10);
const id = () => Math.random().toString(36).slice(2, 10);

export type RedeemResult = { status: 'ok'; amount: number } | { status: 'used' } | { status: 'unknown' };

export function redeemCode(raw: string): RedeemResult {
  const code = raw.trim().toUpperCase();
  const amount = PROMO_CODES[code];
  if (!amount) return { status: 'unknown' };
  const w = getWallet();
  if (w.redeemed.includes(code)) return { status: 'used' };
  write({
    credit: w.credit + amount,
    redeemed: [...w.redeemed, code],
    history: [{ id: id(), date: today(), amount, kind: 'code', code }, ...w.history],
  });
  return { status: 'ok', amount };
}

/** How much credit a job of `total` would use right now. */
export function creditFor(total: number): number {
  return Math.min(getWallet().credit, Math.max(0, total));
}

/** Spend credit on a booked job (the amount already came off its total). */
export function spendCredit(amount: number, jobId: string) {
  if (amount <= 0) return;
  const w = getWallet();
  write({
    ...w,
    credit: Math.max(0, w.credit - amount),
    history: [{ id: id(), date: today(), amount: -amount, kind: 'job', jobId }, ...w.history],
  });
}

/** "DFX-ANA78" — the invite code, stable for a name and phone. */
export function referralCode(name: string | null, phone: string | null): string {
  const letters = (name ?? 'FRIEND')
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4);
  return `DFX-${letters || 'FRND'}${(phone ?? '00').slice(-2)}`;
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

export function useWallet(): Wallet {
  return useSyncExternalStore(subscribe, getWallet, getWallet);
}
