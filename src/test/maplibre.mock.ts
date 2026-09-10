import { vi } from 'vitest';

/**
 * jsdom has no WebGL, so the real MapLibre cannot construct. This stand-in keeps the
 * public surface LiveMap touches and fires `load` on the next tick, so the markers
 * mount and the page can be asserted on.
 *
 * Use as `vi.mock('maplibre-gl', mapLibreStub)` at the top of a test file — vi.mock is
 * hoisted, so it cannot live inside a helper.
 */
export function mapLibreStub() {
  {
    class Marker {
      el: HTMLElement;
      constructor(opts: { element: HTMLElement }) {
        this.el = opts.element;
      }
      setLngLat() {
        return this;
      }
      addTo(map: { container: HTMLElement }) {
        map.container.appendChild(this.el);
        return this;
      }
      remove() {
        this.el.remove();
      }
    }

    class Map {
      container: HTMLElement;
      handlers: Record<string, Array<(e?: unknown) => void>> = {};
      touchZoomRotate = { disableRotation: () => {} };
      constructor(opts: { container: HTMLElement }) {
        this.container = opts.container;
        setTimeout(() => this.handlers.load?.forEach((h) => h()), 0);
      }
      on(name: string, h: (e?: unknown) => void) {
        (this.handlers[name] ??= []).push(h);
        return this;
      }
      isStyleLoaded = () => true;
      getLayer = vi.fn(() => undefined);
      setPaintProperty = vi.fn();
      addSource = vi.fn();
      addLayer = vi.fn();
      fitBounds = vi.fn();
      easeTo = vi.fn();
      flyTo = vi.fn();
      zoomTo = vi.fn();
      getZoom = () => 13;
      remove = vi.fn();
    }

    const setWorkerUrl = vi.fn();
    return { Map, Marker, setWorkerUrl, default: { Map, Marker, setWorkerUrl } };
  }
}
