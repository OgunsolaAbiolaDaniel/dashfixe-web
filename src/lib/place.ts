/**
 * The customer's current place — ONE value every surface reads (ARCHITECTURE.md §6).
 *
 * Picking an address anywhere (the home hero, the signed-in home, /explore) saves
 * it here, so the maps, the pins, the distances and every ETA on every page are
 * worked out from the same point, and it survives navigation and reloads. The URL
 * still wins on /explore (a shared search opens where it was made).
 *
 * Only pilot-area places are kept: the sample supply only exists around Amora, and
 * a pin 30 km away would make every artisan "unavailable" in a dishonest way.
 * Per-browser localStorage until accounts carry saved places (Phase 6).
 */
import { useSyncExternalStore } from 'react';
import { HOME, type LngLat } from './geo';
import { inPilotArea, type Place } from './geocode';
import { DEFAULT_ADDRESS } from '../search';

/** The sample customer's address — where everything starts. */
export const PILOT_HOME: Place = { label: DEFAULT_ADDRESS, lngLat: HOME };

const KEY = 'dfx.place';
const listeners = new Set<() => void>();

function parse(raw: string | null): Place | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as { label?: unknown; lngLat?: unknown };
    const ll = p.lngLat;
    if (
      typeof p.label === 'string' &&
      Array.isArray(ll) &&
      ll.length === 2 &&
      ll.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
      inPilotArea(ll as LngLat)
    ) {
      return { label: p.label, lngLat: [ll[0], ll[1]] as LngLat };
    }
  } catch {
    /* corrupt value — fall through to the default */
  }
  return null;
}

// Memoised on the raw string so the snapshot keeps its identity between reads
// (useSyncExternalStore needs that) and a cleared storage resets it for free.
let lastRaw: string | null | undefined;
let lastPlace: Place = PILOT_HOME;

export function getPlace(): Place {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked — the default stands */
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastPlace = parse(raw) ?? PILOT_HOME;
  }
  return lastPlace;
}

/** Save a place. Ignored outside the pilot area. Notifies every subscriber. */
export function setPlace(place: Place) {
  if (!inPilotArea(place.lngLat)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ label: place.label, lngLat: place.lngLat }));
  } catch {
    // Storage full or blocked: keep it for this page's lifetime anyway.
    lastRaw = null;
    lastPlace = place;
  }
  listeners.forEach((l) => l());
}

export function isPilotHome(place: Place): boolean {
  return place.label === PILOT_HOME.label && place.lngLat[0] === HOME[0] && place.lngLat[1] === HOME[1];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the place: follow it.
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** The current place, re-rendering whenever it changes (in this tab or another). */
export function usePlace(): Place {
  return useSyncExternalStore(subscribe, getPlace, getPlace);
}
