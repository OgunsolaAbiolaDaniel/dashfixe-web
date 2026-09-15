import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Clock, MapPin, Wrench } from '../icons';
import PhotoPick from '../shared/PhotoPick';
import { exploreUrl, type When } from '../../search';
import { useAuth } from '../../auth';
import { useLang } from '../../i18n';
import type { LngLat } from '../../lib/geo';
import { searchAddress, type Place } from '../../lib/geocode';
import { getPlace, isPilotHome, setPlace, usePlace } from '../../lib/place';
import AddressField from '../shared/AddressField';
import TradeField from '../shared/TradeField';
import { classifyNeed } from '../../lib/classify';
import type { TradeSlug } from '../../routes';
import { LiveMap } from '../map/lazy';

const FIELD = 'flex h-[56px] items-center gap-[13px] rounded-input bg-well px-[18px]';
const INPUT =
  'min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30';

type Props = {
  /** What needs fixing and its trade — held by HomePage, so "Plan it for later" can carry them. */
  need: string;
  trade: TradeSlug | '';
  onNeed: (need: string) => void;
  onTrade: (trade: TradeSlug | '') => void;
};

/** "Rua da Cooperativa 14, Amora" → "Amora"; a bare coordinate → null. */
function areaOf(label: string): string | null {
  const last = label.split(',').pop()?.trim() ?? '';
  return last && !/^[-\d.\s]+$/.test(last) ? last : null;
}

/**
 * The composer. What is typed here carries into /explore — searching is browse-first
 * and needs no account. The trade is recognised from the words as they are typed
 * (lib/classify) until the customer picks one by hand.
 *
 * "Book for later" (and "Not urgent? Book ahead") take the customer to the "Plan it
 * for later" section below — the calendar — which carries the need, the trade and
 * the address on into the booking. On the right, the real map with the sample
 * artisans on it: the product, not a picture of a drill.
 */
export default function PublicHero({ need, trade, onNeed, onTrade }: Props) {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { t } = useLang();
  // The shared place (lib/place): the map below and the "Free near you" cards
  // follow it. A returning visitor's saved address is filled back in.
  const place = usePlace();
  const [picked, setPicked] = useState(false);
  const [address, setAddress] = useState(() => (isPilotHome(getPlace()) ? '' : getPlace().label));
  const [lngLat, setLngLat] = useState<LngLat | null>(() => (isPilotHome(getPlace()) ? null : getPlace().lngLat));
  const [when, setWhen] = useState<When>('now');

  const updateNeed = (value: string) => {
    onNeed(value);
    if (!picked) onTrade(classifyNeed(value)?.trade ?? '');
  };

  const choose = (p: Place) => {
    setLngLat(p.lngLat);
    setPlace(p);
  };

  // The calendar's focus waits for the scroll. If the page goes away first, the timer
  // must go with it: left running, it once stole focus from whatever page came next.
  const focusTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(focusTimer.current), []);

  /** Book for later lives in its own section: scroll there and hand over the calendar. */
  const goLater = () => {
    setWhen('later');
    document.getElementById('later')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.clearTimeout(focusTimer.current);
    focusTimer.current = window.setTimeout(() => document.getElementById('later-date')?.focus({ preventScroll: true }), 400);
  };

  const changeArea = () => {
    const field = document.getElementById('hero-address');
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
  };

  /**
   * If an address was typed but no suggestion picked, look it up before leaving so
   * /explore still opens on the right spot. Capped at 2.5 s: a slow geocoder must
   * never block the search, it just falls back to the saved address.
   */
  const search = async () => {
    let where = lngLat;
    if (!where && address.trim().length >= 3) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const [first] = await searchAddress(address, ctrl.signal);
      clearTimeout(timer);
      where = first?.lngLat ?? null;
      if (first) setPlace(first);
    }
    navigate(exploreUrl({ need, trade, address, lngLat: where, when }));
  };

  const area = areaOf(place.label);

  return (
    <section id="top" className="bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(28px,4vw,56px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(32px,4vw,64px)]">
          <div>
            <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
              <MapPin size={18} className="flex-none text-ink" />
              <span className="text-[14.5px] font-bold text-ink">{area ? t('hero.area', { area }) : t('hero.areaHere')}</span>
              <button
                type="button"
                onClick={changeArea}
                className="text-[14.5px] font-semibold text-ink-60 underline underline-offset-4 transition hover:text-ink"
              >
                {t('hero.changeArea')}
              </button>
            </div>

            <h1 className="mb-6 max-w-[12ch] text-display text-ink [text-wrap:balance]">{t('hero.title')}</h1>

            <button
              type="button"
              onClick={() => (when === 'now' ? goLater() : setWhen('now'))}
              aria-label={t('hero.chooseWhen')}
              className="mb-4 flex h-ctl-lg items-center gap-[11px] rounded-full bg-well px-[18px] text-[14.5px] font-bold text-ink transition hover:bg-line"
            >
              <Clock size={19} />
              {when === 'now' ? t('hero.fixNow') : t('hero.bookLater')}
              <ChevronDown size={17} />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void search();
              }}
              className="flex max-w-[540px] flex-col gap-2.5"
            >
              <div className={FIELD}>
                <Wrench size={19} className="flex-none text-ink" />
                <input
                  type="text"
                  value={need}
                  onChange={(e) => updateNeed(e.target.value)}
                  placeholder={t('hero.needPlaceholder')}
                  aria-label={t('hero.needLabel')}
                  className={INPUT}
                />
                <PhotoPick variant="round" />
              </div>

              <TradeField
                className="px-1"
                trade={trade}
                need={need}
                onTrade={(next) => {
                  onTrade(next);
                  setPicked(true);
                }}
              />

              <AddressField
                inputId="hero-address"
                value={address}
                onChange={(v) => {
                  setAddress(v);
                  setLngLat(null);
                }}
                onPlace={choose}
              />

              <div className="mt-[22px] flex flex-wrap items-center gap-[26px]">
                <button
                  type="submit"
                  className="flex h-[52px] items-center rounded-btn bg-ink px-[26px] text-[15px] font-bold text-white transition hover:bg-ink-80"
                >
                  {t('hero.seeAvailable')}
                </button>
                <button
                  type="button"
                  onClick={() => requireAuth()}
                  className="border-b border-[#c8d1e0] pb-1 text-[14.5px] font-semibold text-ink transition hover:border-ink"
                >
                  {t('hero.loginRecent')}
                </button>
              </div>
            </form>
          </div>

          <div className="relative">
            <div className="relative h-[clamp(300px,34vw,480px)] overflow-hidden rounded-card bg-canvas">
              <LiveMap variant="peek" home={place.lngLat} trade={trade} />
              <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/90 bg-white/[.86] px-3 py-1.5 text-[12px] font-bold text-ink shadow-map backdrop-blur-[14px]">
                <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-brand text-brand" />
                {t('hero.mapCaption')}
              </span>
            </div>
            <div className="relative z-[2] mx-[18px] -mt-14 flex flex-wrap items-center gap-4 rounded-[18px] bg-panel px-5 py-[18px] shadow-[0_18px_44px_-20px_rgba(15,27,61,.45)]">
              <span className="mr-auto text-[15.5px] font-bold text-ink">{t('hero.notUrgent')}</span>
              <button
                type="button"
                onClick={goLater}
                className="flex h-[46px] flex-none items-center rounded-full bg-well px-5 text-[15px] font-bold text-ink transition hover:bg-line"
              >
                {t('hero.bookAhead')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
