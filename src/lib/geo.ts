/**
 * Small geography helpers shared by the map and the search results.
 *
 * Coordinates are `[lng, lat]` tuples everywhere, matching GeoJSON and MapLibre.
 * The pilot area is Amora & Seixal, on the south bank opposite Lisbon.
 */
import type { Feature, Polygon } from 'geojson';

export type LngLat = [lng: number, lat: number];

/** Rua da Cooperativa 14, Amora — the sample customer address. */
export const HOME: LngLat = [-9.1165, 38.6283];

/** Radius the search covers, in km. Matches "within 5 km" in the panel copy. */
export const SEARCH_RADIUS_KM = 5;

const EARTH_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(s));
}

/**
 * Rough door-to-door arrival estimate for a van in a suburb: a few minutes to
 * pack up, then ~24 km/h through town. Rounded to the minute, never under 5.
 */
export function etaMinutes(km: number): number {
  return Math.max(5, Math.round(4 + (km / 24) * 60));
}

/** Midpoint of two points — good enough at city scale. */
export function midpoint(a: LngLat, b: LngLat): LngLat {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** Bounding box `[[west, south], [east, north]]` around a set of points. */
export function bounds(points: LngLat[]): [LngLat, LngLat] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lng, lat] of points) {
    w = Math.min(w, lng);
    e = Math.max(e, lng);
    s = Math.min(s, lat);
    n = Math.max(n, lat);
  }
  return [
    [w, s],
    [e, n],
  ];
}

/**
 * A circle as a GeoJSON polygon, so it can be drawn as a map layer that scales
 * with zoom (a CSS circle would not).
 */
export function circlePolygon(center: LngLat, radiusKm: number, steps = 64): Feature<Polygon> {
  const [lng, lat] = center;
  const dLat = radiusKm / 110.574;
  const dLng = radiusKm / (111.32 * Math.cos(rad(lat)));
  const ring: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    ring.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}
