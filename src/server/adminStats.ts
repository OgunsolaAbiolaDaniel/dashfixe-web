/**
 * The console overview's figures (rev 2.13), computed from the rows — pilot
 * volumes are small, so no aggregate tables yet. Pure: `now` is passed in.
 * Server-only.
 */
import { TARGETS, reportTargetMs } from '../shared/pilot.js';
import type { StoredApplication, StoredReport, StoredWaitlistEntry } from './store.js';

const DAY = 24 * 60 * 60 * 1000;

/** Seven rolling 24-hour buckets, oldest first; the last is "the past 24 hours". */
function lastSevenDays(isos: string[], now: number): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  for (const iso of isos) {
    const daysAgo = Math.floor((now - Date.parse(iso)) / DAY);
    if (daysAgo >= 0 && daysAgo < 7) out[6 - daysAgo]! += 1;
  }
  return out;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function computeStats(apps: StoredApplication[], reports: StoredReport[], waitlist: StoredWaitlistEntry[], now = Date.now()) {
  const age = (iso: string) => now - Date.parse(iso);
  const between = (iso: string, from: number, to: number) => age(iso) >= from && age(iso) < to;

  const byStatus = { received: 0, called: 0, approved: 0, declined: 0 };
  for (const a of apps) byStatus[a.status] += 1;
  const waiting = apps.filter((a) => a.status === 'received');
  const decided = byStatus.approved + byStatus.declined;
  const firstCalls = apps.filter((a) => a.calledAt).map((a) => Date.parse(a.calledAt!) - Date.parse(a.createdAt)).filter((ms) => ms >= 0);

  const open = reports.filter((r) => r.status !== 'resolved');

  // Approved supply by trade (main and other trades) × area.
  const coverage: Record<string, Record<string, number>> = {};
  for (const a of apps) {
    if (a.status !== 'approved') continue;
    for (const trade of new Set([a.trade, ...(a.profile?.trades ?? [])])) {
      for (const area of a.profile?.areas ?? []) {
        coverage[trade] ??= {};
        coverage[trade][area] = (coverage[trade][area] ?? 0) + 1;
      }
    }
  }

  return {
    applications: {
      total: apps.length,
      byStatus,
      new7: apps.filter((a) => between(a.createdAt, 0, 7 * DAY)).length,
      prev7: apps.filter((a) => between(a.createdAt, 7 * DAY, 14 * DAY)).length,
      daily: lastSevenDays(apps.map((a) => a.createdAt), now),
      waiting: waiting.length,
      oldestWaitingAt: waiting.reduce<string | null>((oldest, a) => (!oldest || a.createdAt < oldest ? a.createdAt : oldest), null),
      overdue: waiting.filter((a) => age(a.createdAt) > TARGETS.applicantCallMs).length,
      medianFirstCallMs: median(firstCalls),
      approvalRate: decided ? byStatus.approved / decided : null,
      decided,
    },
    reports: {
      total: reports.length,
      open: open.length,
      safetyOpen: open.filter((r) => r.category === 'safety').length,
      overdue: open.filter((r) => !r.calledAt && age(r.createdAt) > reportTargetMs(r.category)).length,
      daily: lastSevenDays(reports.map((r) => r.createdAt), now),
    },
    waitlist: {
      total: waitlist.length,
      new7: waitlist.filter((w) => between(w.createdAt, 0, 7 * DAY)).length,
      daily: lastSevenDays(waitlist.map((w) => w.createdAt), now),
    },
    coverage,
  };
}

export type ConsoleStats = ReturnType<typeof computeStats>;
