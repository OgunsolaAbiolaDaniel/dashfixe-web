import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibre } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre parses tiles in a Web Worker it locates relative to its own module URL.
// That path survives neither Vite's dep pre-bundling nor a production build, and the
// failure is silent (no tiles, no `load`). Hand it a URL Vite has bundled instead.
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(mapWorkerUrl);
import { Crosshair, HomeSolid } from '../icons';
import { AVAILABLE, MAP_ONLY, ON_JOB, type Artisan, type Marker as MapMarker } from './artisans';
import { HOME, SEARCH_RADIUS_KM, bounds, circlePolygon, midpoint, type LngLat } from '../../lib/geo';
import MapCanvas from './MapCanvas';

type Props =
  | { variant?: 'explore'; selectedId: string; onSelect: (id: string) => void }
  | { variant: 'peek'; home?: LngLat };

/**
 * Vector tiles from OpenFreeMap — free, no key, OpenStreetMap data. Positron is
 * the light, desaturated look the design system asks for: the map recedes and
 * our markers carry the colour.
 */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const CONTROL =
  'grid h-[42px] w-[42px] place-items-center rounded-well bg-panel shadow-[0_6px_18px_-6px_rgba(15,27,61,.3)] transition hover:bg-page';

/**
 * The live map — designs/Dashfixe Web.dc.html, on real tiles.
 *
 * Markers are ordinary React elements rendered through portals into DOM nodes that
 * MapLibre positions, so they use the same Tailwind tokens as everything else. If
 * the tiles cannot load (offline, blocked, no WebGL) the drawn city from
 * MapCanvas takes over, so the page never shows an empty grey box.
 *
 * `variant="peek"` is the non-interactive hero backdrop (BUILD_PLAN Phase 2): same
 * markers and radius, centred on the visitor's resolved address when known, no key
 * panel, no zoom/locate controls, clicks do nothing.
 */
export default function LiveMap(props: Props) {
  const isPeek = props.variant === 'peek';
  const selectedId = isPeek ? undefined : props.selectedId;
  const onSelect = isPeek ? undefined : props.onSelect;
  const center = isPeek ? (props.home ?? HOME) : HOME;

  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // One DOM node per marker, created once. MapLibre owns their position; React owns
  // their contents.
  const nodes = useMemo(() => {
    const make = (id: string) => {
      const el = document.createElement('div');
      el.dataset.marker = id;
      return el;
    };
    const all = new Map<string, HTMLDivElement>();
    for (const m of [...AVAILABLE, ...MAP_ONLY, ...ON_JOB]) all.set(m.id, make(m.id));
    all.set('home', make('home'));
    return all;
  }, []);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    let map: MapLibre;
    try {
      map = createMap(container.current, center);
    } catch {
      // No WebGL (or a blocked constructor): fall back on the next tick so React
      // is not asked to set state from inside the effect body.
      const t = setTimeout(() => setFailed(true), 0);
      return () => clearTimeout(t);
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    if (import.meta.env.DEV) (window as unknown as { __dfxMap?: MapLibre }).__dfxMap = map;

    // Anything that stops the style itself from arriving means no tiles at all.
    map.on('error', (e) => {
      const status = (e as { error?: { status?: number } }).error?.status;
      if (!map.isStyleLoaded() || status === 404 || status === 403) setFailed(true);
    });

    map.on('load', () => {
      tintBasemap(map);
      const circle = circlePolygon(center, SEARCH_RADIUS_KM);
      map.addSource('radius', { type: 'geojson', data: circle });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius',
        paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.05 },
      });
      map.addLayer({
        id: 'radius-line',
        type: 'line',
        source: 'radius',
        paint: {
          'line-color': '#2563EB',
          'line-width': 1.5,
          'line-opacity': 0.45,
          'line-dasharray': [3, 3],
        },
      });

      const points: LngLat[] = [center, ...AVAILABLE.map((a) => a.lngLat), ...MAP_ONLY.map((m) => m.lngLat), ...ON_JOB.map((m) => m.lngLat)];
      map.fitBounds(bounds(points), {
        padding: { top: 110, right: 90, bottom: 80, left: 200 },
        duration: 0,
        maxZoom: 13.6,
      });

      for (const m of [...AVAILABLE, ...MAP_ONLY, ...ON_JOB]) {
        new maplibregl.Marker({ element: nodes.get(m.id)!, anchor: 'center' }).setLngLat(m.lngLat).addTo(map);
      }
      new maplibregl.Marker({ element: nodes.get('home')!, anchor: 'bottom' }).setLngLat(center).addTo(map);
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Mounts once (guarded above); centre is only read for that first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, center[0], center[1]]);

  // Selecting a card glides the map so both the artisan and the address stay in view.
  useEffect(() => {
    const map = mapRef.current;
    const artisan = AVAILABLE.find((a) => a.id === selectedId) ?? MAP_ONLY.find((m) => m.id === selectedId);
    if (!map || !ready || !artisan) return;
    map.easeTo({ center: midpoint(center, artisan.lngLat), duration: 650, essential: false });
  }, [selectedId, ready, center]);

  if (failed) {
    return isPeek ? <MapCanvas variant="peek" /> : <MapCanvas selectedId={selectedId!} onSelect={onSelect!} />;
  }

  const selected = AVAILABLE.find((a) => a.id === selectedId);
  const zoom = (delta: number) => mapRef.current?.zoomTo((mapRef.current.getZoom() ?? 13) + delta, { duration: 240 });
  const locate = () => mapRef.current?.flyTo({ center, zoom: 14, duration: 800 });

  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#e8edf6]${isPeek ? ' pointer-events-none' : ''}`}>
      <div
        ref={container}
        className="live-map absolute inset-0"
        aria-label="Map of available artisans"
        role="region"
        aria-hidden={isPeek}
      />

      {!isPeek && (
        <>
          {/* Key — frosted, allowed here because it sits over the map */}
          <div className="absolute left-6 top-6 rounded-[18px] border border-white/90 bg-white/[.86] px-[17px] py-[15px] shadow-map backdrop-blur-[14px]">
            <div className="mb-[11px] text-label text-ink-40">Map key</div>
            <div className="mb-[7px] flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-md bg-brand" />
              Available now
            </div>
            <div className="mb-[7px] flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-md border-[1.5px] border-dashed border-ink-30 bg-panel" />
              On a job
            </div>
            <div className="flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-full bg-ink" />
              Your address
            </div>
          </div>

          <div className="absolute right-6 top-6 flex flex-col gap-[9px]">
            <button type="button" aria-label="Centre on my address" onClick={locate} className={CONTROL}>
              <Crosshair size={18} className="text-brand" />
            </button>
            <button type="button" aria-label="Zoom in" onClick={() => zoom(1)} className={`${CONTROL} text-lg font-extrabold text-ink-60`}>
              +
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => zoom(-1)} className={`${CONTROL} text-lg font-extrabold text-ink-60`}>
              −
            </button>
          </div>
        </>
      )}

      <span className="pointer-events-none absolute bottom-6 left-6 rounded-full bg-warning-tint px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
        Sample artisans · real map
      </span>

      {/* On a job — dashed, not selectable */}
      {ON_JOB.map((m) => (
        <Portal key={m.id} node={nodes.get(m.id)!}>
          <div
            title={`${m.initials} · on a job`}
            className="grid h-9 w-9 place-items-center rounded-xl border-[1.5px] border-dashed border-ink-30 bg-panel text-[11px] font-bold text-ink-30"
          >
            {m.initials}
          </div>
        </Portal>
      ))}

      {/* Available but unselected — solid outline */}
      {[...AVAILABLE, ...MAP_ONLY]
        .filter((m) => m.id !== selectedId)
        .map((m) => (
          <Portal key={m.id} node={nodes.get(m.id)!}>
            <button
              type="button"
              tabIndex={isPeek ? -1 : 0}
              onClick={() => onSelect?.(m.id)}
              aria-label={isArtisan(m) ? m.name : m.initials}
              title={isArtisan(m) ? `${m.name} · ${m.eta} min` : m.initials}
              className="grid h-10 w-10 place-items-center rounded-[13px] border-2 border-brand bg-panel text-xs font-extrabold text-brand shadow-marker transition hover:scale-105 hover:bg-brand-tint"
            >
              {m.initials}
            </button>
          </Portal>
        ))}

      {/* Selected — expands into a pill carrying price and ETA */}
      {selected && (
        <Portal node={nodes.get(selected.id)!}>
          <div className="relative z-[3] grid place-items-center">
            <span className="pulse-dot absolute h-[72px] w-[72px] rounded-full bg-brand/[.16] text-brand/[.16]" />
            <span className="relative flex items-center gap-[9px] rounded-full border-[3px] border-white bg-brand py-1.5 pl-1.5 pr-[15px] shadow-[0_12px_26px_-6px_rgba(37,99,235,.6)]">
              <i className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-white/[.24] text-[11px] font-extrabold not-italic text-white">
                {selected.initials}
              </i>
              <b className="whitespace-nowrap text-[13.5px] font-bold text-white">
                {selected.price} · {selected.eta} min
              </b>
            </span>
          </div>
        </Portal>
      )}

      {/* Your address */}
      <Portal node={nodes.get('home')!}>
        <div className="flex flex-col items-center" title="Rua da Cooperativa 14, Amora">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-full border-[3px] border-white bg-ink shadow-[0_8px_20px_-6px_rgba(15,27,61,.5)]">
            <HomeSolid size={17} strokeWidth={2} className="text-white" />
          </span>
          <span className="block h-[9px] w-0.5 bg-ink" />
        </div>
      </Portal>
    </div>
  );
}

/**
 * Positron ships a grey Tagus. Nudge water and parks toward the brand tints so
 * the basemap reads as part of the page rather than a screenshot dropped in.
 */
function tintBasemap(map: MapLibre) {
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

function createMap(container: HTMLElement, center: LngLat): MapLibre {
  return new maplibregl.Map({
    container,
    style: MAP_STYLE,
    center,
    zoom: 13,
    minZoom: 10,
    maxZoom: 17,
    attributionControl: { compact: true },
    // The design draws its own controls.
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
  });
}

function isArtisan(m: Artisan | MapMarker): m is Artisan {
  return 'name' in m;
}

function Portal({ node, children }: { node: HTMLElement; children: ReactNode }) {
  return createPortal(children, node);
}
