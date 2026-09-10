import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightShort,
  Bolt,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Close,
  HomeSolid,
  MapPin,
  Plus,
  Saw,
  Spray,
  Wrench,
} from '../icons';
import { useLang } from '../../i18n';
import { DEFAULT_ADDRESS, exploreUrl, type When } from '../../search';
import { HOME } from '../../lib/geo';

/** Sample account data — the signed-in home is a walkthrough until auth exists. */
const REBOOK = [
  { id: 'tf', initials: 'TF', name: 'Tiago Ferreira', trade: 'plumbing', from: null },
  { id: 'cp', initials: 'CP', name: 'Carla Pinto', trade: 'cleaning', from: '17:00' },
] as const;

const RECENT = [
  { key: 'customer.recent1', amount: '€48.00', done: true },
  { key: 'customer.recent2', amount: '€95.00', done: true },
  { key: 'customer.recent3', amount: null, done: false },
] as const;

const PLACES = [
  { Icon: HomeSolid, key: 'customer.placeHome', address: DEFAULT_ADDRESS, primary: true },
  { Icon: Briefcase, key: 'customer.placeOffice', address: 'Praça 1º de Maio 3, Seixal', primary: false },
] as const;

const QUICK = [
  { Icon: Wrench, slug: 'plumbing' },
  { Icon: Bolt, slug: 'electrical' },
  { Icon: Spray, slug: 'cleaning' },
  { Icon: Saw, slug: 'carpentry' },
] as const;

const CARD = 'rounded-card border border-line-soft bg-panel';
const CHIP =
  'flex h-ctl items-center gap-[9px] rounded-well border border-line bg-panel px-4 text-sm font-bold text-ink transition hover:bg-page';

export default function CustomerHome() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [when, setWhen] = useState<When>('now');
  const [need, setNeed] = useState('');

  // Every action carries the saved home address, so /explore opens where the customer is.
  const find = () => navigate(exploreUrl({ need, when, address: DEFAULT_ADDRESS, lngLat: HOME }));

  return (
    <div
      id="top"
      className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(28px,4vw,44px)]"
    >
      <div className="mb-[26px]">
        <h1 className="mb-2.5 text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.06] tracking-[-.035em] text-ink">
          {t('customer.greeting', { name: 'Alex' })}
        </h1>
        <button
          type="button"
          className="flex items-center gap-2 text-[14.5px] font-semibold text-ink-60 transition hover:text-ink"
        >
          <MapPin size={16} className="flex-none text-brand" />
          {DEFAULT_ADDRESS}
          <ChevronDown size={14} className="flex-none text-ink-40" />
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-[22px]">
        {/* ── Main column ── */}
        <div className="flex flex-col gap-[22px]">
          <section className={`${CARD} p-[clamp(20px,2.4vw,26px)]`}>
            <div className="mb-4 text-label text-ink-40">{t('customer.newRequest')}</div>
            <div className="mb-3.5 flex gap-1.5 rounded-well bg-well p-1">
              {(['now', 'later'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWhen(v)}
                  className={
                    'flex-1 rounded-[10px] p-[11px] text-sm transition ' +
                    (when === v ? 'bg-panel font-bold text-ink shadow-card' : 'font-semibold text-ink-40 hover:text-ink-60')
                  }
                >
                  {v === 'now' ? t('search.now') : t('search.later')}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              aria-label={t('hero.needLabel')}
              placeholder={t('customer.placeholder')}
              className="w-full resize-y rounded-input border border-line bg-page px-[15px] py-3.5 text-[14.5px] font-semibold leading-[1.5] text-ink placeholder:text-ink-30"
            />
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" className={CHIP}>
                <Camera size={17} className="text-brand" />
                {t('customer.addPhoto')}
              </button>
              <button type="button" className={CHIP}>
                <MapPin size={17} className="text-brand" />
                {t('customer.placeHome')}
              </button>
            </div>
            <button
              type="button"
              onClick={find}
              className="mt-4 flex h-ctl-lg w-full items-center justify-center gap-[9px] rounded-[15px] bg-brand text-[15px] font-bold text-white transition hover:bg-brand-hover"
            >
              {t('nav.findArtisan')}
              <ArrowRightShort size={17} />
            </button>
          </section>

          <section>
            <div className="mb-3.5 flex items-baseline gap-3.5">
              <h2 className="mr-auto text-section text-ink">{t('customer.rebookTitle')}</h2>
              <a href="#requests" className="text-[13.5px] font-bold text-brand">
                {t('customer.seeAll')}
              </a>
            </div>
            <div className={`${CARD} overflow-hidden`}>
              {REBOOK.map((r, i) => (
                <div
                  key={r.id}
                  className={'flex items-center gap-3.5 px-5 py-[18px]' + (i === 0 ? ' border-b border-line-rule' : '')}
                >
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-input bg-avatar text-sm font-extrabold text-brand">
                    {r.initials}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className="block text-row text-ink">{r.name}</span>
                    {r.from === null ? (
                      <span className="mt-0.5 flex items-center gap-[7px] text-meta text-ink-40">
                        {t(`trades.${r.trade}` as const)} ·
                        <span className="flex items-center gap-1 font-bold text-success">
                          <span className="block h-1.5 w-1.5 rounded-full bg-success" />
                          {t('nearby.available')}
                        </span>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-meta text-ink-40">
                        {`${t(`trades.${r.trade}` as const)} · ${t('nearby.from', { time: r.from })}`}
                      </span>
                    )}
                  </span>
                  <Link
                    to={
                      r.id === 'tf'
                        ? exploreUrl({ artisan: r.id, lngLat: HOME })
                        : exploreUrl({ trade: r.trade, lngLat: HOME })
                    }
                    className="flex h-ctl-sm flex-none items-center rounded-[13px] bg-brand-tint px-4 text-sm font-bold text-brand-hover transition hover:bg-brand-tint-hover hover:text-brand-hover"
                  >
                    {t('customer.rebook')}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section id="requests" className="scroll-mt-[88px]">
            <div className="mb-3.5 flex items-baseline gap-3.5">
              <h2 className="mr-auto text-section text-ink">{t('customer.recentTitle')}</h2>
              <a href="#requests" className="text-[13.5px] font-bold text-brand">
                {t('customer.history')}
              </a>
            </div>
            <div className={`${CARD} overflow-hidden`}>
              {RECENT.map((r, i) => (
                <div
                  key={r.key}
                  className={
                    'flex items-center gap-4 px-5 py-[18px]' + (i < RECENT.length - 1 ? ' border-b border-line-rule' : '')
                  }
                >
                  <span
                    className={'grid h-12 w-12 flex-none place-items-center rounded-input ' + (r.done ? 'bg-success-tint' : 'bg-well')}
                  >
                    {r.done ? <Check size={20} className="text-success" /> : <Close size={20} className="text-ink-40" />}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className={'block text-row ' + (r.done ? 'text-ink' : 'text-ink-60')}>{t(r.key)}</span>
                    <span className="mt-0.5 block text-meta text-ink-40">{t(`${r.key}.meta` as const)}</span>
                  </span>
                  {r.amount ? (
                    <span className="flex-none text-[16.5px] font-extrabold tracking-[-.02em] text-ink">{r.amount}</span>
                  ) : (
                    <span className="flex-none rounded-full bg-well px-[13px] py-2 text-[13.5px] font-bold text-ink-60">
                      {t('customer.noCharge')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Working rail ── */}
        <div className="flex flex-col gap-[22px]">
          <section className="relative overflow-hidden rounded-hero bg-ink p-6 shadow-hero">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-[90px] -top-[140px] block h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.85)_0%,rgba(37,99,235,0)_68%)] blur-[28px]"
            />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-success-bright/40 bg-success-bright/[.16] px-[13px] py-1.5">
                  <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success-bright text-success-bright" />
                  <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#a7f3cf]">
                    {t('customer.onTheWay')}
                  </span>
                </span>
                <span className="ml-auto text-[13px] font-bold text-onink">{t('customer.arrives', { time: '14:35' })}</span>
              </div>
              <div className="mb-[5px] text-[13px] font-bold text-brand-on-dark">{t('customer.jobLabel')}</div>
              <h3 className="mb-[18px] text-2xl font-extrabold leading-[1.12] tracking-[-.03em] text-white">
                {t('customer.heading', { name: 'Tiago' })}
              </h3>
              <div className="mb-[18px] flex items-center gap-3 border-y border-white/[.12] py-3.5">
                <span className="mr-auto text-meta text-onink">{t('customer.approved')}</span>
                <span className="flex-none text-xl font-extrabold tracking-[-.025em] text-white">€63.00</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={exploreUrl({ artisan: 'tf', lngLat: HOME })}
                  className="flex h-12 flex-[1_1_130px] items-center justify-center rounded-[15px] bg-brand text-[14.5px] font-bold text-white shadow-brand transition hover:bg-brand-hover hover:text-white"
                >
                  {t('customer.openChat')}
                </Link>
                <button
                  type="button"
                  className="h-12 flex-none rounded-[15px] border border-white/[.18] bg-white/10 px-[18px] text-[14.5px] font-bold text-onink-strong transition hover:bg-white/[.16]"
                >
                  {t('customer.track')}
                </button>
              </div>
            </div>
          </section>

          <section id="places" className={`${CARD} scroll-mt-[88px] overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-line-rule px-5 py-[18px]">
              <span className="mr-auto text-label text-ink-40">{t('customer.yourPlaces')}</span>
              <button
                type="button"
                className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
              >
                <Plus size={14} strokeWidth={2.4} />
                {t('customer.add')}
              </button>
            </div>
            {PLACES.map((p, i) => (
              <div key={p.key} className={'flex items-center gap-3.5 px-5 py-4' + (i === 0 ? ' border-b border-line-rule' : '')}>
                <span
                  className={'grid h-10 w-10 flex-none place-items-center rounded-well ' + (p.primary ? 'bg-brand-tint' : 'bg-well')}
                >
                  <p.Icon size={18} className={p.primary ? 'text-brand' : 'text-ink-60'} />
                </span>
                <span className="mr-auto min-w-0">
                  <span className="block text-[15px] font-bold text-ink">{t(p.key)}</span>
                  <span className="mt-px block text-[13px] font-semibold text-ink-40">{p.address}</span>
                </span>
              </div>
            ))}
          </section>

          <section className={`${CARD} p-[22px]`}>
            <div className="mb-4 text-label text-ink-40">{t('customer.quick')}</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-2.5">
              {QUICK.map(({ Icon, slug }) => (
                <Link
                  key={slug}
                  to={exploreUrl({ trade: slug, lngLat: HOME })}
                  className="flex flex-col gap-2.5 rounded-input border border-line-soft bg-panel p-3.5 text-left transition hover:bg-page hover:text-ink"
                >
                  <Icon size={19} className="text-brand" />
                  <span className="text-sm font-bold text-ink">{t(`trades.${slug}` as const)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
