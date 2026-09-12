import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '../chrome/AppBar';
import { LiveMap } from '../map/lazy';
import { ArrowRightShort, Bolt, ChevronDown, MapPin, Saw, Spray, Wrench } from '../icons';
import PhotoPick from '../shared/PhotoPick';
import { useLang } from '../../i18n';
import { DEFAULT_ADDRESS, exploreUrl, type When } from '../../search';
import { HOME } from '../../lib/geo';
import { ROUTES, jobUrl } from '../../routes';
import { ACTIVE_JOB_ID } from '../../lib/jobs';
import { useAuth } from '../../auth';

/**
 * The signed-in home — ARCHITECTURE.md §2, Uber's m.uber.com pattern. The map IS
 * the home: it fills the screen with the sample supply live around the saved
 * address, and the panel carries the composer, the active job and the shortcuts.
 * The lists (recent requests, places) live on /activity, like Uber's Activity.
 *
 * Everything here is sample account data until auth and the backend exist.
 */
const REBOOK = [
  { id: 'tf', initials: 'TF', name: 'Tiago Ferreira', trade: 'plumbing', from: null },
  { id: 'cp', initials: 'CP', name: 'Carla Pinto', trade: 'cleaning', from: '17:00' },
] as const;

const QUICK = [
  { Icon: Wrench, slug: 'plumbing' },
  { Icon: Bolt, slug: 'electrical' },
  { Icon: Spray, slug: 'cleaning' },
  { Icon: Saw, slug: 'carpentry' },
] as const;

const CARD = 'rounded-card border border-line-soft bg-panel';

export default function AppHome() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { name } = useAuth();
  const [when, setWhen] = useState<When>('now');
  const [need, setNeed] = useState('');
  // Clocks are impure: read once per mount.
  const [dayPart] = useState<'morning' | 'afternoon' | 'evening'>(() => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  });

  // Every action carries the saved address, so /explore opens where the customer is.
  const to = (extra: Parameters<typeof exploreUrl>[0]) =>
    exploreUrl({ address: DEFAULT_ADDRESS, lngLat: HOME, ...extra });
  const find = () => navigate(to({ need, when }));

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-dvh lg:overflow-hidden">
      <AppBar />

      {/* Desktop: the map pins to the viewport and the panel scrolls, exactly like
          /explore. Mobile: the page stacks, map after the composer. */}
      <div className="grid min-h-0 flex-1 items-stretch grid-cols-1 lg:grid-cols-[minmax(340px,436px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-r border-line-soft bg-page p-[26px] [&>*]:shrink-0">
          <div>
            <h1 className="mb-2 text-[26px] font-extrabold leading-[1.08] tracking-[-.03em] text-ink">
              {name ? t(`customer.greet.${dayPart}`, { name: name.split(' ')[0]! }) : t(`customer.greetPlain.${dayPart}`)}
            </h1>
            <Link
              to={ROUTES.activity}
              className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-60 transition hover:text-ink"
            >
              <MapPin size={15} className="flex-none text-brand" />
              {DEFAULT_ADDRESS}
            </Link>
          </div>

          {/* The composer — the "Where to?" of Dashfixe */}
          <section className={`${CARD} p-[18px]`}>
            <div className="mb-3 flex gap-1.5 rounded-well bg-well p-1">
              {(['now', 'later'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWhen(v)}
                  className={
                    'flex-1 rounded-[10px] p-2.5 text-sm transition ' +
                    (when === v ? 'bg-panel font-bold text-ink shadow-card' : 'font-semibold text-ink-40 hover:text-ink-60')
                  }
                >
                  {v === 'now' ? t('search.now') : t('search.later')}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              aria-label={t('hero.needLabel')}
              placeholder={t('customer.placeholder')}
              className="w-full resize-none rounded-input border border-line bg-page px-[15px] py-3 text-[14.5px] font-semibold leading-[1.5] text-ink placeholder:text-ink-30"
            />
            <div className="mt-2.5 flex items-center gap-2.5">
              <PhotoPick variant="round" />
              <button
                type="button"
                onClick={find}
                className="flex h-ctl flex-1 items-center justify-center gap-2 rounded-[13px] bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
              >
                {t('nav.findArtisan')}
                <ArrowRightShort size={16} />
              </button>
            </div>
          </section>

          {/* The active job — Uber's ongoing-trip banner */}
          <section className="relative overflow-hidden rounded-hero bg-ink p-5 shadow-hero">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-[80px] -top-[120px] block h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.85)_0%,rgba(37,99,235,0)_68%)] blur-[26px]"
            />
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-success-bright/40 bg-success-bright/[.16] px-[11px] py-1">
                  <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success-bright text-success-bright" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-[#a7f3cf]">
                    {t('customer.onTheWay')}
                  </span>
                </span>
                <span className="ml-auto text-[12.5px] font-bold text-onink">{t('customer.arrives', { time: '14:35' })}</span>
              </div>
              <div className="mb-1 text-[12.5px] font-bold text-brand-on-dark">{t('customer.jobLabel')}</div>
              <h2 className="mb-3.5 text-[20px] font-extrabold leading-[1.15] tracking-[-.025em] text-white">
                {t('customer.heading', { name: 'Tiago' })}
              </h2>
              <div className="mb-3.5 flex items-center gap-3 border-y border-white/[.12] py-2.5">
                <span className="mr-auto text-[12.5px] font-semibold text-onink">{t('customer.approved')}</span>
                <span className="flex-none text-[17px] font-extrabold tracking-[-.02em] text-white">€63.00</span>
              </div>
              <div className="flex gap-2.5">
                <Link
                  to={`${jobUrl(ACTIVE_JOB_ID)}?chat=1`}
                  className="flex h-11 flex-1 items-center justify-center rounded-[13px] bg-brand text-[14px] font-bold text-white shadow-brand transition hover:bg-brand-hover hover:text-white"
                >
                  {t('customer.openChat')}
                </Link>
                <Link
                  to={jobUrl(ACTIVE_JOB_ID)}
                  className="flex h-11 flex-none items-center rounded-[13px] border border-white/[.18] bg-white/10 px-4 text-[14px] font-bold text-onink-strong transition hover:bg-white/[.16] hover:text-onink-strong"
                >
                  {t('customer.track')}
                </Link>
              </div>
            </div>
          </section>

          {/* Book again — two shortcuts, the rest under Activity */}
          <section>
            <div className="mb-2.5 flex items-baseline gap-3.5">
              <h2 className="mr-auto text-[15px] font-extrabold tracking-[-.015em] text-ink">{t('customer.rebookTitle')}</h2>
              <Link to={ROUTES.activity} className="text-[13px] font-bold text-brand">
                {t('customer.seeAll')}
              </Link>
            </div>
            <div className={`${CARD} overflow-hidden`}>
              {REBOOK.map((r, i) => (
                <div key={r.id} className={'flex items-center gap-3 px-4 py-3.5' + (i === 0 ? ' border-b border-line-rule' : '')}>
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-input bg-avatar text-[13px] font-extrabold text-brand">
                    {r.initials}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className="block text-[14.5px] font-bold text-ink">{r.name}</span>
                    {r.from === null ? (
                      <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-40">
                        {t(`trades.${r.trade}` as const)} ·
                        <span className="flex items-center gap-1 font-bold text-success">
                          <span className="block h-1.5 w-1.5 rounded-full bg-success" />
                          {t('nearby.available')}
                        </span>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[12.5px] font-semibold text-ink-40">
                        {`${t(`trades.${r.trade}` as const)} · ${t('nearby.from', { time: r.from })}`}
                      </span>
                    )}
                  </span>
                  <Link
                    to={r.id === 'tf' ? to({ artisan: r.id }) : to({ trade: r.trade })}
                    className="flex h-9 flex-none items-center rounded-[11px] bg-brand-tint px-3.5 text-[13px] font-bold text-brand-hover transition hover:bg-brand-tint-hover hover:text-brand-hover"
                  >
                    {t('customer.rebook')}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Quick trades */}
          <section>
            <div className="mb-2.5 text-label text-ink-40">{t('customer.quick')}</div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(({ Icon, slug }) => (
                <Link
                  key={slug}
                  to={to({ trade: slug })}
                  className="flex items-center gap-2.5 rounded-input border border-line-soft bg-panel px-3.5 py-3 transition hover:bg-page hover:text-ink"
                >
                  <Icon size={17} className="flex-none text-brand" />
                  <span className="truncate text-[13.5px] font-bold text-ink">{t(`trades.${slug}` as const)}</span>
                </Link>
              ))}
            </div>
            <Link
              to={ROUTES.explore}
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-input border border-line bg-panel py-2.5 text-[13.5px] font-bold text-ink-60 transition hover:bg-page hover:text-ink"
            >
              {t('nav.findArtisan')}
              <ChevronDown size={14} className="-rotate-90" />
            </Link>
          </section>
        </div>

        {/* The map IS the home. Tapping a pin opens the search with that artisan. */}
        <div className="relative min-h-[440px] min-w-0 lg:min-h-0">
          <LiveMap home={HOME} onSelect={(id) => navigate(to({ artisan: id }))} />
        </div>
      </div>
    </div>
  );
}
