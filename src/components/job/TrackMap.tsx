import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { alongCurve, createMap, curveBetween, maplibregl, tintBasemap, type MapLibre } from '../map/kit';
import { HomeSolid } from '../icons';
import { bounds, type LngLat } from '../../lib/geo';
import { useLang } from '../../i18n';
import MapCanvas from '../explore/MapCanvas';

type Props = {
  /** Where the artisan set off from. */
  from: LngLat;
  /** The customer's address. */
  to: LngLat;
  initials: string;
  /** Animate the pin along the route (the travelling state). */
  moving?: boolean;
};

/**
 * The tracking map — ARCHITECTURE.md §7's `track` variant, built as its own
 * component on the shared map kit. A curved sample route, the artisan's pin
 * easing along it, the home pin at the end. Honest chrome: no live claims, the
 * sample chip stays on.
 */
export default function TrackMap({ from, to, initials, moving = true }: Props) {
  const { t } = useLang();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markerNode = useMemo(() => document.createElement('div'), []);
  const homeNode = useMemo(() => document.createElement('div'), []);
  const [failed, setFailed] = useState(false);

  const route = useMemo(() => curveBetween(from, to), [from, to]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    let map: MapLibre;
    try {
      map = createMap(container.current, to, true);
    } catch {
      const timer = setTimeout(() => setFailed(true), 0);
      return () => clearTimeout(timer);
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    if (import.meta.env.DEV) (window as unknown as { __dfxMap?: MapLibre }).__dfxMap = map;

    map.on('error', (e) => {
      const status = (e as { error?: { status?: number } }).error?.status;
      if (!map.isStyleLoaded() || status === 404 || status === 403) setFailed(true);
    });

    let timer: ReturnType<typeof setInterval> | undefined;

    map.on('load', () => {
      tintBasemap(map);
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route } },
      });
      // Casing under the brand line, so the route reads on any ground.
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563EB', 'line-width': 4 },
      });

      map.fitBounds(bounds([from, to]), { padding: 96, duration: 0, maxZoom: 14.5 });

      const artisan = new maplibregl.Marker({ element: markerNode, anchor: 'center' }).setLngLat(from).addTo(map);
      new maplibregl.Marker({ element: homeNode, anchor: 'bottom' }).setLngLat(to).addTo(map);

      if (moving) {
        // Sample motion: ease from 15% to 75% of the route over ~50s, then hold —
        // far enough to feel alive, never claiming an arrival that isn't real.
        let progress = 0.15;
        artisan.setLngLat(alongCurve(route, progress));
        timer = setInterval(() => {
          progress = Math.min(0.75, progress + 0.006);
          artisan.setLngLat(alongCurve(route, progress));
          if (progress >= 0.75 && timer) clearInterval(timer);
        }, 500);
      }
    });

    return () => {
      if (timer) clearInterval(timer);
      map.remove();
      mapRef.current = null;
    };
  }, [route, from, to, moving, markerNode, homeNode]);

  if (failed) return <MapCanvas variant="peek" />;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e8edf6]">
      <div ref={container} className="live-map absolute inset-0" aria-label={t('map.region')} role="region" />

      <span className="pointer-events-none absolute bottom-6 left-6 rounded-full bg-warning-tint px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
        {t('map.sampleJob')}
      </span>

      {/* The artisan, en route */}
      <Portal node={markerNode}>
        <div className="relative z-[3] grid place-items-center" title={t('customer.onTheWay')}>
          <span className="pulse-dot absolute h-[64px] w-[64px] rounded-full bg-brand/[.16] text-brand/[.16]" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-brand text-[12px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(37,99,235,.6)]">
            {initials}
          </span>
        </div>
      </Portal>

      {/* The customer's address */}
      <Portal node={homeNode}>
        <div className="flex flex-col items-center" title={t('map.you')}>
          <span className="grid h-[38px] w-[38px] place-items-center rounded-full border-[3px] border-white bg-ink shadow-[0_8px_20px_-6px_rgba(15,27,61,.5)]">
            <HomeSolid size={17} strokeWidth={2} className="text-white" />
          </span>
          <span className="block h-[9px] w-0.5 bg-ink" />
        </div>
      </Portal>
    </div>
  );
}

function Portal({ node, children }: { node: HTMLElement; children: ReactNode }) {
  return createPortal(children, node);
}
