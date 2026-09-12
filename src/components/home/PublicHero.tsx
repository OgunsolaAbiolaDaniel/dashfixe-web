import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Clock, MapPin, Wrench } from '../icons';
import PhotoPick from '../shared/PhotoPick';
import { Link } from 'react-router-dom';
import { exploreUrl, type When } from '../../search';
import { link } from '../../routes';
import { useAuth } from '../../auth';
import { useLang } from '../../i18n';
import type { LngLat } from '../../lib/geo';
import { searchAddress } from '../../lib/geocode';
import AddressField from '../shared/AddressField';
import { LiveMap } from '../map/lazy';

const FIELD = 'flex h-[56px] items-center gap-[13px] rounded-input bg-well px-[18px]';
const INPUT =
  'min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30';

/**
 * The composer. What is typed here carries into /explore — searching is browse-first
 * and needs no account, so only the photo attachment and the account link gate on auth.
 *
 * On the right, instead of a stock photo, the real map with the sample artisans on
 * it — the product, not a picture of a drill.
 */
export default function PublicHero() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { t } = useLang();
  const [need, setNeed] = useState('');
  const [address, setAddress] = useState('');
  const [lngLat, setLngLat] = useState<LngLat | null>(null);
  const [when, setWhen] = useState<When>('now');

  /**
   * If an address was typed but no suggestion picked, look it up before leaving so
   * /explore still opens on the right spot. Capped at 2.5 s: a slow geocoder must
   * never block the search, it just falls back to the sample address.
   */
  const search = async () => {
    let where = lngLat;
    if (!where && address.trim().length >= 3) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const [first] = await searchAddress(address, ctrl.signal);
      clearTimeout(timer);
      where = first?.lngLat ?? null;
    }
    navigate(exploreUrl({ need, address, lngLat: where, when }));
  };

  return (
    <section id="top" className="bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(28px,4vw,56px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(32px,4vw,64px)]">
          <div>
            <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
              <MapPin size={18} className="flex-none text-ink" />
              <span className="text-[14.5px] font-bold text-ink">{t('hero.area')}</span>
              <Link
                to={link('coverage')}
                className="text-[14.5px] font-semibold text-ink-60 underline underline-offset-4 transition hover:text-ink"
              >
                {t('hero.changeArea')}
              </Link>
            </div>

            <h1 className="mb-6 max-w-[12ch] text-display text-ink [text-wrap:balance]">{t('hero.title')}</h1>

            <button
              type="button"
              onClick={() => setWhen(when === 'now' ? 'later' : 'now')}
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
                  onChange={(e) => setNeed(e.target.value)}
                  placeholder={t('hero.needPlaceholder')}
                  aria-label={t('hero.needLabel')}
                  className={INPUT}
                />
                <PhotoPick variant="round" />
              </div>

              <AddressField
                value={address}
                onChange={(v) => {
                  setAddress(v);
                  setLngLat(null);
                }}
                onPlace={(p) => setLngLat(p.lngLat)}
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
              <LiveMap variant="peek" home={lngLat ?? undefined} />
              <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/90 bg-white/[.86] px-3 py-1.5 text-[12px] font-bold text-ink shadow-map backdrop-blur-[14px]">
                <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-brand text-brand" />
                {t('hero.mapCaption')}
              </span>
            </div>
            <div className="relative z-[2] mx-[18px] -mt-14 flex flex-wrap items-center gap-4 rounded-[18px] bg-panel px-5 py-[18px] shadow-[0_18px_44px_-20px_rgba(15,27,61,.45)]">
              <span className="mr-auto text-[15.5px] font-bold text-ink">{t('hero.notUrgent')}</span>
              <Link
                to={link('book')}
                className="flex h-[46px] flex-none items-center rounded-full bg-well px-5 text-[15px] font-bold text-ink transition hover:bg-line hover:text-ink"
              >
                {t('hero.bookAhead')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
