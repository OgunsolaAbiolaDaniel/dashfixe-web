/**
 * The artisan dashboard's own choices (/pro/dashboard, rev 2.5): which "get ready"
 * items are ticked off, and when and how far they'll take live jobs. Saved on
 * this device — nothing is uploaded; onboarding sets it up for real, and Phase 6
 * moves it onto the artisan account.
 */
import { useSyncExternalStore } from 'react';

export type ProDash = {
  /** Checklist item ids marked ready. */
  ready: string[];
  /** null until chosen: the dashboard falls back to the application's answer. */
  availability: string[] | null;
  /** Kilometres from home. */
  radius: number;
};

const KEY = 'dfx.proDash';
const EMPTY: ProDash = { ready: [], availability: null, radius: 5 };
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let last: ProDash = EMPTY;

export function getProDash(): ProDash {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const d = raw ? (JSON.parse(raw) as Partial<ProDash>) : {};
      last = {
        ready: Array.isArray(d.ready) ? d.ready : [],
        availability: Array.isArray(d.availability) ? d.availability : null,
        radius: typeof d.radius === 'number' ? d.radius : 5,
      };
    } catch {
      last = EMPTY;
    }
  }
  return last;
}

function write(patch: Partial<ProDash>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getProDash(), ...patch }));
  } catch {
    /* full or blocked */
  }
  listeners.forEach((l) => l());
}

export function toggleReady(id: string) {
  const { ready } = getProDash();
  write({ ready: ready.includes(id) ? ready.filter((x) => x !== id) : [...ready, id] });
}
export const setAvailability = (availability: string[]) => write({ availability });
export const setRadius = (radius: number) => write({ radius });

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useProDash(): ProDash {
  return useSyncExternalStore(subscribe, getProDash, getProDash);
}
