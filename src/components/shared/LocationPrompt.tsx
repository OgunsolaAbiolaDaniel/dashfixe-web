import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Close, Crosshair } from '../icons';
import { inPilotArea, locate, reverseGeocode } from '../../lib/geocode';
import { PILOT_HOME, setPlace } from '../../lib/place';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/** Pages where the customer's position changes what they see (maps, pins, ETAs). */
const MAP_PAGES = ['/', '/explore'];
const ASKED = 'dfx.loc';

function alreadyAsked(): boolean {
  try {
    return localStorage.getItem(ASKED) === 'asked';
  } catch {
    return true; // storage blocked: never nag
  }
}

function remember() {
  try {
    localStorage.setItem(ASKED, 'asked');
  } catch {
    /* ignore */
  }
}

/**
 * Location on arrival — the maps and every ETA should start from where the
 * customer actually is (lib/place).
 *
 * Browsers discourage asking for a position unprompted on page load, so the
 * permission prompt only ever follows a tap on this card. If permission was
 * already granted, the position is used silently; if it was denied, the card
 * never shows. Asked once per browser. Outside the pilot area the search stays
 * in Amora & Seixal, and says so — the sample supply only exists there.
 */
export default function LocationPrompt() {
  const { t } = useLang();
  const { pathname } = useLocation();
  const [state, setState] = useState<'hidden' | 'ask' | 'busy' | 'done'>('hidden');
  const [note, setNote] = useState<{ key: StringKey; place?: string } | null>(null);
  const onMapPage = MAP_PAGES.includes(pathname);

  const applyMine = async (silent: boolean) => {
    if (!silent) setState('busy');
    try {
      const lngLat = await locate();
      if (!inPilotArea(lngLat)) {
        setPlace(PILOT_HOME);
        setNote({ key: 'hero.outsideArea' });
      } else {
        const place = await reverseGeocode(lngLat);
        setPlace(place);
        setNote({ key: 'loc.done', place: place.label });
      }
    } catch {
      if (!silent) setNote({ key: 'hero.locationDenied' });
    } finally {
      remember();
      setState('done');
    }
  };

  // Decide once per visit, asynchronously (the Permissions API answers in a promise).
  useEffect(() => {
    if (!onMapPage || alreadyAsked() || !('geolocation' in navigator)) return;
    let cancelled = false;
    const decide = (status: PermissionState | 'unknown') => {
      if (cancelled) return;
      if (status === 'granted') void applyMine(true);
      else if (status !== 'denied') setState('ask');
    };
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((p) => decide(p.state), () => decide('unknown'));
    } else {
      // No Permissions API (older Safari): ask with the card, on the next tick.
      const timer = setTimeout(() => decide('unknown'), 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    return () => {
      cancelled = true;
    };
    // Once per mount: the first map page of the visit decides.
  }, [onMapPage]);

  // The confirmation fades after a few seconds.
  useEffect(() => {
    if (state !== 'done' || !note) return;
    const timer = setTimeout(() => setNote(null), 6000);
    return () => clearTimeout(timer);
  }, [state, note]);

  if (!onMapPage) return null;

  if (state === 'done' && note) {
    return (
      <div role="status" className="fixed bottom-4 left-4 right-4 z-[80] rounded-[18px] bg-ink px-4 py-3 text-[13.5px] font-semibold text-white shadow-panel sm:right-auto sm:max-w-[380px]">
        {t(note.key, note.place ? { place: note.place } : undefined)}
      </div>
    );
  }
  if (state !== 'ask' && state !== 'busy') return null;

  return (
    <div
      role="dialog"
      aria-label={t('loc.title')}
      className="fixed bottom-4 left-4 right-4 z-[80] rounded-[22px] border border-line-soft bg-panel p-4 shadow-panel sm:right-auto sm:max-w-[380px]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-tint">
          <Crosshair size={19} className="text-brand" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">{t('loc.title')}</p>
          <p className="mt-1 text-[13px] font-medium leading-[1.5] text-ink-60">{t('loc.body')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={state === 'busy'}
              onClick={() => void applyMine(false)}
              className="h-10 rounded-[12px] bg-brand px-4 text-[13.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {state === 'busy' ? t('hero.locating') : t('loc.share')}
            </button>
            <button
              type="button"
              onClick={() => {
                remember();
                setState('hidden');
              }}
              className="h-10 rounded-[12px] px-3 text-[13.5px] font-bold text-ink-60 transition hover:bg-well hover:text-ink"
            >
              {t('loc.later')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            remember();
            setState('hidden');
          }}
          aria-label={t('loc.later')}
          className="grid h-8 w-8 flex-none place-items-center rounded-lg text-ink-40 transition hover:bg-well"
        >
          <Close size={15} />
        </button>
      </div>
    </div>
  );
}
