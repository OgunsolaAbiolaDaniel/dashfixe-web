import { lazy, Suspense, type ComponentProps } from 'react';

/**
 * The map components, code-split (docs/ARCHITECTURE.md §7). MapLibre is ~800 kB of
 * JavaScript before its worker; importing the maps through here keeps it out of the
 * entry chunk, so marketing pages and the login screen never download it and map
 * pages paint their chrome first and the map a beat later.
 *
 * Always import `LiveMap` / `TrackMap` from this file, never from their modules —
 * one direct import anywhere pulls MapLibre back into the entry bundle.
 */
const LiveMapImpl = lazy(() => import('../explore/LiveMap'));
const TrackMapImpl = lazy(() => import('../job/TrackMap'));

/** The same ground colour the real map paints before tiles arrive — no flash, no jump. */
function MapPlaceholder() {
  return <div className="absolute inset-0 bg-[#e8edf6]" aria-hidden="true" />;
}

export function LiveMap(props: ComponentProps<typeof LiveMapImpl>) {
  return (
    <Suspense fallback={<MapPlaceholder />}>
      <LiveMapImpl {...props} />
    </Suspense>
  );
}

export function TrackMap(props: ComponentProps<typeof TrackMapImpl>) {
  return (
    <Suspense fallback={<MapPlaceholder />}>
      <TrackMapImpl {...props} />
    </Suspense>
  );
}
