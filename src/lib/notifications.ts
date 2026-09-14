/**
 * Notifications — the bell (docs/ARCHITECTURE.md §6).
 *
 * No push backend yet, so notifications are derived from what this browser
 * already knows: each job's status (lib/jobs) and the credit added (lib/wallet).
 * One notice per job state, so a job that moves on (booked → on the way → done)
 * raises a new, unread notice. Only "which notices were seen" is stored.
 * Phase 6 swaps the derivation for a notifications feed; the Notice shape stays.
 */
import { useSyncExternalStore } from 'react';
import { formatEuro, type Job } from './jobs';
import type { Wallet } from './wallet';
import type { StringKey } from '../i18n/strings';
import { ROUTES, jobUrl } from '../routes';

export type NoticeKind = 'travelling' | 'booked' | 'working' | 'receipt' | 'rate' | 'cancelled' | 'credit';

export type Notice = {
  /** Stable per job *state*, so a new state is a new notice. */
  id: string;
  kind: NoticeKind;
  /** ISO day it's about. */
  date: string;
  key: StringKey;
  vars: Record<string, string | number>;
  to: string;
};

/** Every notice, newest first (same-day notices keep their natural order). */
export function buildNotices(jobs: Job[], wallet: Wallet): Notice[] {
  const out: Notice[] = [];
  for (const j of jobs) {
    const name = j.artisanName.split(' ')[0] ?? j.artisanName;
    const at = { date: j.date, to: jobUrl(j.id) };
    if (j.status === 'travelling') out.push({ ...at, id: `${j.id}:travelling`, kind: 'travelling', key: 'notif.travelling', vars: { name, time: j.arrives ?? '' } });
    if (j.status === 'agreed') out.push({ ...at, id: `${j.id}:agreed`, kind: 'booked', key: 'notif.booked', vars: { name, window: j.slot?.window ?? '' } });
    if (j.status === 'working') out.push({ ...at, id: `${j.id}:working`, kind: 'working', key: 'notif.working', vars: { name } });
    if (j.status === 'done') {
      out.push({ ...at, id: `${j.id}:receipt`, kind: 'receipt', key: 'notif.receipt', vars: { name, total: formatEuro(j.total) } });
      if (!j.rating) out.push({ ...at, id: `${j.id}:rate`, kind: 'rate', key: 'notif.rate', vars: { name } });
    }
    if (j.status === 'cancelled') out.push({ ...at, id: `${j.id}:cancelled`, kind: 'cancelled', key: 'notif.cancelled', vars: { name } });
  }
  for (const e of wallet.history) {
    if (e.kind === 'code') {
      out.push({ id: `credit:${e.id}`, kind: 'credit', date: e.date, key: 'notif.credit', vars: { amount: formatEuro(e.amount), code: e.code }, to: ROUTES.account });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Which notices were seen (per browser) ─────────────────────────────────

const KEY = 'dfx.notif';
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let last: string[] = EMPTY;

export function getSeen(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      last = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : EMPTY;
    } catch {
      last = EMPTY;
    }
  }
  return last;
}

/** Mark notices as seen (keeps the most recent 200 ids). */
export function markSeen(ids: string[]) {
  const seen = getSeen();
  const next = [...seen, ...ids.filter((id) => !seen.includes(id))].slice(-200);
  if (next.length === seen.length) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* full or blocked */
  }
  listeners.forEach((l) => l());
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

export function useSeen(): string[] {
  return useSyncExternalStore(subscribe, getSeen, getSeen);
}
