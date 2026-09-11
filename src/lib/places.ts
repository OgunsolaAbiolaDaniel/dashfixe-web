/**
 * Saved places, per browser — localStorage until accounts get a backend
 * (Phase 6). Kept tiny and defensive: storage can be absent or full, and the
 * page must keep working either way.
 */
export type SavedPlace = { name: string; address: string };

const KEY = 'dfx.places';

export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is SavedPlace =>
        typeof p === 'object' && p !== null && typeof (p as SavedPlace).name === 'string' && typeof (p as SavedPlace).address === 'string',
    );
  } catch {
    return [];
  }
}

export function addSavedPlace(place: SavedPlace): SavedPlace[] {
  const next = [...getSavedPlaces(), place];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — the in-memory list still renders */
  }
  return next;
}

export function removeSavedPlace(index: number): SavedPlace[] {
  const next = getSavedPlaces().filter((_, i) => i !== index);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
