import { useEffect, useId, useRef, useState } from 'react';
import { Crosshair, MapPin } from '../icons';
import { useLang } from '../../i18n';
import { locate, reverseGeocode, searchAddress, type Place } from '../../lib/geocode';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Fires when a suggestion or the current location is chosen. */
  onPlace: (place: Place) => void;
  /** Visual variant: the hero's soft well, or a bordered product input. */
  variant?: 'well' | 'input';
  className?: string;
};

const DEBOUNCE_MS = 350;

/**
 * Address input with suggestions and a "use my location" button.
 *
 * Suggestions come from lib/geocode (Nominatim, bounded to the pilot area, with
 * an offline fallback). Keyboard: arrows move, Enter picks, Escape closes.
 */
export default function AddressField({ value, onChange, onPlace, variant = 'well', className = '' }: Props) {
  const { t } = useLang();
  const listId = useId();
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const chosen = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (chosen.current === value) return; // a pick, not typing
    if (value.trim().length < 3) {
      setPlaces([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      searchAddress(value, ctrl.signal).then((found) => {
        if (ctrl.signal.aborted) return;
        setPlaces(found);
        setOpen(true);
        setActive(-1);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const pick = (place: Place) => {
    chosen.current = place.label;
    onChange(place.label);
    onPlace(place);
    setOpen(false);
    setPlaces([]);
  };

  const useLocation = async () => {
    setNotice(null);
    setLocating(true);
    try {
      const lngLat = await locate();
      pick(await reverseGeocode(lngLat));
    } catch {
      setNotice(t('hero.locationDenied'));
    } finally {
      setLocating(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !places.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % places.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? places.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(places[active]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const shell =
    variant === 'well'
      ? 'flex h-[56px] items-center gap-[13px] rounded-input bg-well px-[18px]'
      : 'flex h-12 items-center gap-3 rounded-input border border-line bg-page px-[15px]';

  return (
    <div className={`relative ${className}`}>
      <div className={shell}>
        <MapPin size={19} className={variant === 'well' ? 'flex-none text-ink' : 'flex-none text-brand'} />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            chosen.current = null;
            setNotice(null);
            onChange(e.target.value);
          }}
          onFocus={() => places.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          placeholder={t('hero.addressPlaceholder')}
          aria-label={t('hero.addressLabel')}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30"
        />
        <button
          type="button"
          onClick={useLocation}
          disabled={locating}
          aria-label={locating ? t('hero.locating') : t('hero.useLocation')}
          title={t('hero.useLocation')}
          className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-panel text-brand transition hover:bg-brand-tint disabled:opacity-60"
        >
          <Crosshair size={18} className={locating ? 'animate-spin' : ''} />
        </button>
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('hero.suggestions')}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] overflow-hidden rounded-[18px] border border-line-soft bg-panel py-1.5 shadow-panel"
        >
          {places.length === 0 ? (
            <li className="px-4 py-3 text-[13.5px] font-semibold text-ink-40">{t('hero.noMatches')}</li>
          ) : (
            places.map((p, i) => (
              <li
                key={p.label + i}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className={
                  'flex cursor-pointer items-center gap-3 px-4 py-3 text-[14.5px] font-semibold ' +
                  (i === active ? 'bg-brand-tint text-brand-hover' : 'text-ink hover:bg-page')
                }
              >
                <MapPin size={16} className="flex-none text-ink-40" />
                <span className="truncate">{p.label}</span>
              </li>
            ))
          )}
        </ul>
      )}

      {notice && <p className="mt-2 text-[12.5px] font-semibold text-warning">{notice}</p>}
    </div>
  );
}
