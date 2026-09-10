/**
 * Address lookup for the composer.
 *
 * Online: OpenStreetMap Nominatim, bounded to the Setúbal peninsula so "Rua da
 * Cooperativa" finds the one in Amora and not one in Braga. Nominatim's usage
 * policy asks for light, attributed, debounced use — the field debounces at
 * 350 ms and every request carries a referer via the browser.
 *
 * Offline or blocked: a small list of pilot-area streets so the flow still
 * works in a demo with no network.
 */
import type { LngLat } from './geo';

export type Place = { label: string; lngLat: LngLat };

/** west, south, east, north — Corroios to Paio Pires, Amora to Fernão Ferro. */
export const PILOT_VIEWBOX = [-9.19, 38.58, -9.05, 38.67] as const;

const ENDPOINT = 'https://nominatim.openstreetmap.org';

/** Whether a point falls inside the pilot area (the same box the search is bounded to). */
export function inPilotArea([lng, lat]: LngLat): boolean {
  const [w, south, e, n] = PILOT_VIEWBOX;
  return lng >= w && lng <= e && lat >= south && lat <= n;
}

const FALLBACK: Place[] = [
  { label: 'Rua da Cooperativa 14, Amora', lngLat: [-9.1165, 38.6283] },
  { label: 'Avenida da Liberdade, Amora', lngLat: [-9.1181, 38.6275] },
  { label: 'Rua Quinta da Princesa, Amora', lngLat: [-9.1245, 38.6318] },
  { label: 'Praça 1.º de Maio, Seixal', lngLat: [-9.1012, 38.6403] },
  { label: 'Rua Cândido dos Reis, Seixal', lngLat: [-9.1040, 38.6390] },
  { label: 'Avenida 25 de Abril, Cruz de Pau', lngLat: [-9.1118, 38.6338] },
  { label: 'Rua de Angola, Corroios', lngLat: [-9.1490, 38.6350] },
  { label: 'Rua 1.º de Maio, Arrentela', lngLat: [-9.1090, 38.6290] },
  { label: 'Avenida Vale de Milhaços, Corroios', lngLat: [-9.1480, 38.6300] },
  { label: 'Rua Miguel Bombarda, Paio Pires', lngLat: [-9.0905, 38.6262] },
];

const cache = new Map<string, Place[]>();

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function searchFallback(query: string): Place[] {
  const q = norm(query);
  if (!q) return [];
  return FALLBACK.filter((p) => norm(p.label).includes(q)).slice(0, 5);
}

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

/** "Rua X 14, Amora" from Nominatim's long display_name. */
function shortLabel(hit: NominatimHit): string {
  const a = hit.address ?? {};
  const street = [a.road ?? a.pedestrian ?? a.residential ?? a.neighbourhood, a.house_number]
    .filter(Boolean)
    .join(' ');
  const town = a.suburb ?? a.village ?? a.town ?? a.city_district ?? a.city ?? a.municipality;
  if (street && town) return `${street}, ${town}`;
  return hit.display_name.split(',').slice(0, 2).join(',').trim();
}

/**
 * Search addresses. Resolves to the fallback list when the network is unavailable
 * or the request is aborted, so callers never need to handle a rejection.
 */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const hit = cache.get(norm(q));
  if (hit) return hit;

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'pt',
    limit: '5',
    viewbox: PILOT_VIEWBOX.join(','),
    bounded: '1',
    q,
  });

  try {
    const res = await fetch(`${ENDPOINT}/search?${params}`, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const hits = (await res.json()) as NominatimHit[];
    const places = hits.map((h) => ({ label: shortLabel(h), lngLat: [Number(h.lon), Number(h.lat)] as LngLat }));
    const merged = places.length ? places : searchFallback(q);
    cache.set(norm(q), merged);
    return merged;
  } catch {
    return searchFallback(q);
  }
}

/** Coordinates → "Rua X, Amora". Falls back to a rounded lat/lng label. */
export async function reverseGeocode(lngLat: LngLat, signal?: AbortSignal): Promise<Place> {
  const [lng, lat] = lngLat;
  const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', lat: String(lat), lon: String(lng) });
  try {
    const res = await fetch(`${ENDPOINT}/reverse?${params}`, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const hit = (await res.json()) as NominatimHit;
    return { label: shortLabel(hit), lngLat };
  } catch {
    return { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lngLat };
  }
}

/** Browser geolocation as a promise; rejects with the GeolocationPositionError. */
export function locate(): Promise<LngLat> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}
