import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import { Briefcase, Check, Close, HomeSolid, MapPin, Navigation, Plus } from '../components/icons';
import AddressField from '../components/shared/AddressField';
import { addSavedPlace, getSavedPlaces, removeSavedPlace, type SavedPlace } from '../lib/places';
import { formatDate, formatEuro, useJobs, type Job } from '../lib/jobs';
import { initialsOf, useAuth } from '../auth';
import { useLang } from '../i18n';
import { DEFAULT_ADDRESS } from '../search';
import { ROUTES, jobUrl } from '../routes';
import type { StringKey } from '../i18n/strings';

/**
 * Activity — Uber's trips page, ours for repairs (ARCHITECTURE.md §2). Every job
 * (the seeded history plus anything booked in chat, lib/jobs), saved places,
 * and the account itself. Signed-out visitors have no activity, so they go home.
 */
const PLACES = [
  { Icon: HomeSolid, key: 'customer.placeHome', address: DEFAULT_ADDRESS, primary: true },
  { Icon: Briefcase, key: 'customer.placeOffice', address: 'Praça 1º de Maio 3, Seixal', primary: false },
] as const;

const CARD = 'rounded-card border border-line-soft bg-panel';

const STATUS: Record<Job['status'], StringKey> = {
  agreed: 'job.booked',
  travelling: 'customer.onTheWay',
  working: 'job.step.working',
  done: 'job.paid',
  cancelled: 'job.cancelled',
};

export default function ActivityPage() {
  const { signedIn, checking } = useAuth();
  const { t } = useLang();

  if (checking) return null;
  if (!signedIn) return <Navigate to={ROUTES.home} replace />;

  return (
    <div className="min-h-screen bg-page">
      <AppBar />
      <main className="mx-auto max-w-[840px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(28px,4vw,44px)]">
        <h1 className="mb-7 text-[clamp(26px,3.2vw,34px)] font-extrabold leading-[1.06] tracking-[-.035em] text-ink">
          {t('nav.activity')}
        </h1>
        <Jobs />
        <Places />
        <Account />
      </main>
    </div>
  );
}

/** Every job, newest first. Live ones open tracking; finished ones open receipts. */
function Jobs() {
  const { t, lang } = useLang();
  const jobs = useJobs();

  return (
    <section className="mb-7">
      <h2 className="mb-3.5 text-section text-ink">{t('customer.recentTitle')}</h2>
      <div className={`${CARD} overflow-hidden`}>
        {jobs.map((j, i) => {
          const live = j.status === 'agreed' || j.status === 'travelling' || j.status === 'working';
          const cancelled = j.status === 'cancelled';
          const className =
            'flex items-center gap-4 px-5 py-[18px] text-ink' +
            (i < jobs.length - 1 ? ' border-b border-line-rule' : '') +
            (cancelled ? '' : ' transition hover:bg-page hover:text-ink');
          const inner = (
            <>
              <span
                className={
                  'grid h-12 w-12 flex-none place-items-center rounded-input ' +
                  (live ? 'bg-brand-tint' : cancelled ? 'bg-well' : 'bg-success-tint')
                }
              >
                {live ? (
                  <Navigation size={19} className="text-brand" />
                ) : cancelled ? (
                  <Close size={20} className="text-ink-40" />
                ) : (
                  <Check size={20} className="text-success" />
                )}
              </span>
              <span className="mr-auto min-w-0">
                <span className={'block truncate text-row ' + (cancelled ? 'text-ink-60' : 'text-ink')}>{j.title[lang]}</span>
                <span className="mt-0.5 block truncate text-meta text-ink-40">
                  {`${formatDate(j.date, lang)} · ${j.artisanName} · ${t(STATUS[j.status])}`}
                </span>
              </span>
              {cancelled ? (
                <span className="flex-none rounded-full bg-well px-[13px] py-2 text-[13.5px] font-bold text-ink-60">
                  {t('customer.noCharge')}
                </span>
              ) : (
                <span className="flex-none text-[16.5px] font-extrabold tracking-[-.02em] text-ink">{formatEuro(j.total)}</span>
              )}
            </>
          );
          return cancelled ? (
            <div key={j.id} className={className}>
              {inner}
            </div>
          ) : (
            <Link key={j.id} to={jobUrl(j.id)} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Saved places — the two sample ones plus per-browser additions (lib/places). */
function Places() {
  const { t } = useLang();
  const [custom, setCustom] = useState<SavedPlace[]>(() => getSavedPlaces());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const save = () => {
    if (!name.trim() || !address.trim()) return;
    setCustom(addSavedPlace({ name: name.trim(), address: address.trim() }));
    setName('');
    setAddress('');
    setAdding(false);
  };

  return (
    <section className={`${CARD} mb-7 overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-line-rule px-5 py-[18px]">
        <span className="mr-auto text-label text-ink-40">{t('customer.yourPlaces')}</span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
        >
          <Plus size={14} strokeWidth={2.4} />
          {t('customer.add')}
        </button>
      </div>
      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-3 border-b border-line-rule bg-page px-5 py-4"
        >
          <div>
            <label htmlFor="place-name" className="mb-[7px] block text-label text-ink-40">
              {t('customer.placeName')}
            </label>
            <input
              id="place-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-input border border-line bg-panel px-[13px] text-[14px] font-semibold text-ink"
            />
          </div>
          <AddressField variant="input" value={address} onChange={setAddress} onPlace={(p) => setAddress(p.label)} />
          <button
            type="submit"
            className="h-11 rounded-[13px] bg-brand px-4 text-[13.5px] font-bold text-white transition hover:bg-brand-hover"
          >
            {t('customer.savePlace')}
          </button>
        </form>
      )}
      {PLACES.map((p) => (
        <div key={p.key} className="flex items-center gap-3.5 border-b border-line-rule px-5 py-4 last:border-b-0">
          <span className={'grid h-10 w-10 flex-none place-items-center rounded-well ' + (p.primary ? 'bg-brand-tint' : 'bg-well')}>
            <p.Icon size={18} className={p.primary ? 'text-brand' : 'text-ink-60'} />
          </span>
          <span className="mr-auto min-w-0">
            <span className="block text-[15px] font-bold text-ink">{t(p.key)}</span>
            <span className="mt-px block text-[13px] font-semibold text-ink-40">{p.address}</span>
          </span>
        </div>
      ))}
      {custom.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-3.5 border-b border-line-rule px-5 py-4 last:border-b-0">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-well">
            <MapPin size={18} className="text-ink-60" />
          </span>
          <span className="mr-auto min-w-0">
            <span className="block text-[15px] font-bold text-ink">{p.name}</span>
            <span className="mt-px block text-[13px] font-semibold text-ink-40">{p.address}</span>
          </span>
          <button
            type="button"
            onClick={() => setCustom(removeSavedPlace(i))}
            aria-label={t('customer.removePlace')}
            className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-well text-ink-60 transition hover:bg-line"
          >
            <Close size={14} />
          </button>
        </div>
      ))}
    </section>
  );
}

/** The account: first name (editable), phone, sign out. */
function Account() {
  const { t } = useLang();
  const { name, phone, saveName, signOut } = useAuth();
  const [draft, setDraft] = useState(name ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-3.5 border-b border-line-rule px-5 py-[18px]">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-avatar text-[13px] font-extrabold text-brand">
          {initialsOf(name, phone)}
        </span>
        <span className="mr-auto text-label text-ink-40">{t('me.title')}</span>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setState('saving');
          setState((await saveName(draft)) ? 'saved' : 'error');
        }}
        className="flex flex-wrap items-end gap-3 border-b border-line-rule px-5 py-4"
      >
        <label className="min-w-[200px] flex-1">
          <span className="mb-[7px] block text-label text-ink-40">{t('me.name')}</span>
          <input
            type="text"
            value={draft}
            maxLength={40}
            onChange={(e) => {
              setDraft(e.target.value);
              setState('idle');
            }}
            className="h-11 w-full rounded-input border border-line bg-page px-[13px] text-[14px] font-semibold text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={!draft.trim() || state === 'saving'}
          className="h-11 rounded-[13px] bg-brand px-5 text-[13.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {state === 'saved' ? t('me.saved') : t('me.save')}
        </button>
        {state === 'error' && <p className="w-full text-[13px] font-semibold text-warning">{t('auth.err.invalid_name')}</p>}
      </form>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="mr-auto min-w-0">
          <span className="block text-label text-ink-40">{t('me.phone')}</span>
          <span className="mt-1 block text-[15px] font-bold text-ink">{phone}</span>
        </span>
        <button
          type="button"
          onClick={signOut}
          className="h-10 rounded-[12px] border border-line px-4 text-[13.5px] font-bold text-ink transition hover:bg-well"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </section>
  );
}
