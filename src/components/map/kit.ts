import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre parses tiles in a Web Worker it locates relative to its own module URL.
// That path survives neither Vite's dep pre-bundling nor a production build, and the
// failure is silent (no tiles, no `load`). Hand it a URL Vite has bundled instead.
// See docs/HANDOVER.md → gotchas before touching ANY of this file.
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Map as MapLibre } from 'maplibre-gl';
import type { LngLat } from '../../lib/geo';

maplibregl.setWorkerUrl(mapWorkerUrl);

export { maplibregl };
export type { MapLibre };

/**
 * Vector tiles from OpenFreeMap — free, no key, OpenStreetMap data. Positron is
 * the light, desaturated look the design system asks for: the map recedes and
 * our markers carry the colour.
 */
export const MAP_STYLE: string =
  import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/positron';

export function createMap(container: HTMLElement, center: LngLat, interactive: boolean): MapLibre {
  return new maplibregl.Map({
    container,
    style: MAP_STYLE,
    center,
    zoom: 13,
    minZoom: 10,
    maxZoom: 17,
    interactive,
    attributionControl: { compact: true },
    // The design draws its own controls.
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
  });
}

/**
 * Positron ships a grey Tagus. Nudge water and parks toward the brand tints so
 * the basemap reads as part of the page rather than a screenshot dropped in.
 */
export function tintBasemap(map: MapLibre) {
  const paint: Array<[layerId: string, prop: 'fill-color' | 'background-color', value: string]> = [
    ['water', 'fill-color', '#d9e3f3'],
    ['background', 'background-color', '#f4f6fa'],
    ['landcover_grass', 'fill-color', '#e8efe6'],
    ['landcover_wood', 'fill-color', '#e3ebe1'],
    ['park', 'fill-color', '#e6eee4'],
  ];
  for (const [id, prop, value] of paint) {
    if (map.getLayer(id)) map.setPaintProperty(id, prop, value);
  }
}

/**
 * A gently curved polyline between two points — the sample "route" the tracking
 * map draws. Not real routing; honest enough for a walkthrough, pretty enough
 * not to look like a ruler line.
 */
export function curveBetween(from: LngLat, to: LngLat, steps = 24): LngLat[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  // Control point: the midpoint pushed perpendicular to the segment.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * 0.18;
  const cy = my + dx * 0.18;
  const pts: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    pts.push([a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2]);
  }
  return pts;
}

/** A point along a polyline at fraction `t` of its vertex count. */
export function alongCurve(pts: LngLat[], t: number): LngLat {
  const clamped = Math.min(1, Math.max(0, t));
  const idx = clamped * (pts.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(pts.length - 1, lo + 1);
  const frac = idx - lo;
  const [x1, y1] = pts[lo]!;
  const [x2, y2] = pts[hi]!;
  return [x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac];
}
