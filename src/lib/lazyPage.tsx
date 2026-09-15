import { lazy, useState, type ComponentType } from 'react';

/**
 * Route-level code splitting — docs/ARCHITECTURE.md §4. Every page but the home is
 * its own chunk, so a first visit downloads the front door and nothing else.
 *
 * Unlike a bare React.lazy, a page whose chunk has already arrived renders at once
 * instead of suspending for a frame. Each mount picks its component once, so a
 * chunk landing mid-visit never swaps the tree (and never wipes a half-filled form).
 */
type Module<P> = { default: ComponentType<P> };

const loaders: Array<() => Promise<unknown>> = [];

export function lazyPage<P extends object>(load: () => Promise<Module<P>>): ComponentType<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<Module<P>> | null = null;
  const fetchPage = () =>
    (pending ??= load().then(
      (m) => {
        loaded = m.default;
        return m;
      },
      (e: unknown) => {
        // A failed chunk (a deploy replaced it, the network dropped) may be retried.
        pending = null;
        throw e;
      },
    ));
  const Lazy = lazy(fetchPage) as unknown as ComponentType<P>;
  loaders.push(fetchPage);

  function Page(props: P) {
    const [Component] = useState(() => loaded ?? Lazy);
    return <Component {...props} />;
  }
  return Page;
}

/** Fetch every page chunk — once the first page is idle, and before tests that mount the tree. */
export function preloadPages(): Promise<unknown> {
  return Promise.all(loaders.map((load) => load()));
}

/**
 * Warm the other pages once the first one has settled, so the next tap is instant.
 * Skipped when the visitor asked to save data.
 */
export function preloadPagesWhenIdle(): () => void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return () => {};
  let idle = 0;
  const timer = window.setTimeout(() => {
    const run = () => void preloadPages().catch(() => {});
    if ('requestIdleCallback' in window) idle = window.requestIdleCallback(run, { timeout: 4000 });
    else run();
  }, 2500);
  return () => {
    window.clearTimeout(timer);
    if (idle) window.cancelIdleCallback(idle);
  };
}
