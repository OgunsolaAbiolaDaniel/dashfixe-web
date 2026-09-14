/**
 * The Dashfixe Pro application this device sent (/pro/apply → /pro/application).
 *
 * The application itself goes to the server (POST /api/artisans/apply); this is
 * only what the applicant's own status page needs to show — the reference, when,
 * and a few answers — kept in this browser. Phase 6 replaces it with the artisan
 * account's status from the API.
 */
import { useSyncExternalStore } from 'react';

export type ProApplicationRecord = {
  reference: string;
  /** ISO timestamp. */
  submittedAt: string;
  fullName: string;
  trade: string;
  phone: string;
  areas: string[];
  /** For the dashboard's "get ready" checklist (rev 2.5); absent on older records. */
  licences?: string[];
  insurance?: boolean;
  availability?: string[];
};

const KEY = 'dfx.proApplication';
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let last: ProApplicationRecord | null = null;

export function getApplication(): ProApplicationRecord | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const r = raw ? (JSON.parse(raw) as Partial<ProApplicationRecord>) : null;
      last = r && typeof r.reference === 'string' && typeof r.fullName === 'string' ? (r as ProApplicationRecord) : null;
    } catch {
      last = null;
    }
  }
  return last;
}

function write(value: ProApplicationRecord | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    /* full or blocked */
  }
  listeners.forEach((l) => l());
}

export const saveApplication = (record: ProApplicationRecord) => write(record);
export const clearApplication = () => write(null);

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useApplication(): ProApplicationRecord | null {
  return useSyncExternalStore(subscribe, getApplication, getApplication);
}
