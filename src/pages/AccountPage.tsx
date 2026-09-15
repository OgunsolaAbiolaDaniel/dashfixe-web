import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import Places from '../components/account/Places';
import AppPromoBand from '../components/shared/AppPromoBand';
import { ArrowRight, Card, Check, Euro, Shield, Sparkle, Star } from '../components/icons';
import { AVAILABLE, getProfile } from '../components/explore/artisans';
import { formatDate, formatEuro, getJob, useJobs } from '../lib/jobs';
import { redeemCode, referralCode, useWallet, type RedeemResult } from '../lib/wallet';
import { initialsOf, useAuth } from '../auth';
import { useLang } from '../i18n';
import { exploreUrl } from '../search';
import { ROUTES, artisanUrl } from '../routes';

/**
 * Account — the customer's own dashboard (Uber's Account, next to Activity's
 * trips): who they are, what they've spent, their credit, the artisans they
 * use, their places, preferences, and control of their data.
 *
 * Signed-in only. Credit is walkthrough credit (lib/wallet) and is labelled so;
 * payments arrive with the pilot, and the page says that instead of faking a form.
 */
const CARD = 'rounded-card border border-line-soft bg-panel';
const PREFS_KEY = 'dfx.prefs';
const DEVICE_KEYS = ['dfx.place', 'dfx.jobs', 'dfx.places', 'dfx.wallet', 'dfx.prefs', 'dfx.lang', 'dfx.loc'];

export default function AccountPage() {
  const { signedIn, checking } = useAuth();
  const { t } = useLang();
  if (checking) return null;
  if (!signedIn) return <Navigate to={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.account)}`} replace />;

  return (
    <div className="min-h-screen bg-page">
      <AppBar />
      <main className="mx-auto max-w-[1080px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(24px,3.4vw,40px)]">
        <h1 className="mb-7 text-[clamp(26px,3.2vw,34px)] font-extrabold leading-[1.06] tracking-[-.035em] text-ink">
          {t('nav.account')}
        </h1>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Profile />
            <Stats />
            <WalletCard />
            <Invite />
          </div>
          <div className="flex flex-col gap-5">
            <YourArtisans />
            <Places />
            <Payment />
            <Preferences />
            <YourData />
          </div>
        </div>
        <AppPromoBand className="mt-5" />
      </main>
    </div>
  );
}

/** Avatar, first name (edited in place), phone. */
function Profile() {
  const { t } = useLang();
  const { name, phone, saveName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');
  const [error, setError] = useState(false);

  return (
    <section className={`${CARD} flex flex-wrap items-center gap-4 p-[clamp(20px,3vw,28px)]`}>
      <span className="grid h-16 w-16 flex-none place-items-center rounded-full bg-avatar text-[22px] font-extrabold text-brand">
        {initialsOf(name, phone)}
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await saveName(draft);
              setError(!ok);
              if (ok) setEditing(false);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <label htmlFor="acct-name" className="sr-only">
              {t('me.name')}
            </label>
            <input
              id="acct-name"
              autoFocus
              maxLength={40}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-input border border-line bg-page px-3 text-[16px] font-bold text-ink"
            />
            <button type="submit" disabled={!draft.trim()} className="h-11 rounded-[12px] bg-brand px-4 text-[13.5px] font-bold text-white disabled:opacity-60">
              {t('me.save')}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-[12px] px-3 text-[13.5px] font-bold text-ink-60 hover:bg-well">
              {t('customer.cancel')}
            </button>
            {error && <p className="w-full text-[13px] font-semibold text-warning">{t('auth.err.invalid_name')}</p>}
          </form>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-[24px] font-extrabold tracking-[-.025em] text-ink">{name ?? t('acct.noName')}</p>
            <button
              type="button"
              onClick={() => {
                setDraft(name ?? '');
                setEditing(true);
              }}
              className="text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
            >
              {t('acct.editName')}
            </button>
          </div>
        )}
        <p className="mt-1 text-[13.5px] font-semibold text-ink-60">{t('acct.signedInWith', { phone: phone ?? '' })}</p>
      </div>
    </section>
  );
}

/** Three numbers from the job history. */
function Stats() {
  const { t } = useLang();
  const jobs = useJobs().filter((j) => j.status !== 'cancelled');
  const paid = jobs.filter((j) => j.paid).reduce((sum, j) => sum + j.total, 0);
  const artisans = new Set(jobs.map((j) => j.artisanId)).size;
  const tiles = [
    { v: String(jobs.length), label: t('acct.stats.jobs') },
    { v: formatEuro(paid), label: t('acct.stats.spent') },
    { v: String(artisans), label: t('acct.stats.artisans') },
  ];
  return (
    <section className="flex gap-px overflow-hidden rounded-card border border-[#e6ebf3] bg-[#e6ebf3]">
      {tiles.map((s) => (
        <div key={s.label} className="flex-1 bg-panel px-3 py-4 text-center">
          <p className="text-[22px] font-extrabold tracking-[-.02em] text-ink">{s.v}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-ink-40">{s.label}</p>
        </div>
      ))}
    </section>
  );
}

/** The wallet: balance, a promo code, and where the credit came from and went. */
function WalletCard() {
  const { t, lang } = useLang();
  const wallet = useWallet();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<RedeemResult | null>(null);

  const entryLabel = (e: (typeof wallet.history)[number]) => {
    if (e.kind === 'code') return t('acct.entry.code', { code: e.code });
    const job = getJob(e.jobId);
    return t(e.kind === 'refund' ? 'wallet.refund' : 'acct.entry.job', { job: job ? job.title[lang] : e.jobId });
  };

  return (
    <section className="relative overflow-hidden rounded-hero bg-ink p-[clamp(20px,3vw,28px)] text-white shadow-hero">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 block h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.8)_0%,rgba(37,99,235,0)_68%)] blur-[24px]"
      />
      <div className="relative">
        <div className="mb-1 flex items-center gap-2">
          <Euro size={16} className="flex-none text-brand-on-dark" />
          <h2 className="min-w-0 text-[13px] font-bold uppercase tracking-[.1em] text-onink-strong">{t('acct.wallet.title')}</h2>
          <span className="ml-auto flex-none whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[.06em] text-onink-strong">
            {t('acct.wallet.sample')}
          </span>
        </div>
        <p className="text-[40px] font-extrabold tracking-[-.03em]">{formatEuro(wallet.credit)}</p>
        <p className="mb-4 text-[13.5px] font-medium text-onink">{t('acct.wallet.note')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setResult(redeemCode(code));
            setCode('');
          }}
          className="flex gap-2"
        >
          <label htmlFor="promo" className="sr-only">
            {t('acct.wallet.code')}
          </label>
          <input
            id="promo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('acct.wallet.code')}
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-[12px] border border-white/15 bg-white/10 px-3 text-[14px] font-bold uppercase tracking-[.06em] text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-onink"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="h-11 rounded-[12px] bg-panel px-4 text-[13.5px] font-bold text-ink transition hover:bg-well disabled:opacity-60"
          >
            {t('acct.wallet.redeem')}
          </button>
        </form>
        {result && (
          <p role="status" className={'mt-2 text-[13px] font-bold ' + (result.status === 'ok' ? 'text-success-bright' : 'text-[#fcd34d]')}>
            {result.status === 'ok'
              ? t('acct.wallet.ok', { amount: formatEuro(result.amount) })
              : t(result.status === 'used' ? 'acct.wallet.used' : 'acct.wallet.unknown')}
          </p>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[.1em] text-onink">{t('acct.wallet.history')}</h3>
          {wallet.history.length === 0 ? (
            <p className="text-[13.5px] font-medium text-onink">{t('acct.wallet.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {wallet.history.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-[13.5px]">
                  <span className="mr-auto min-w-0 truncate font-semibold text-onink-strong">{entryLabel(e)}</span>
                  <span className="flex-none text-onink">{formatDate(e.date, lang)}</span>
                  <span className={'w-[72px] flex-none text-right font-extrabold ' + (e.amount > 0 ? 'text-success-bright' : 'text-white')}>
                    {e.amount > 0 ? `+${formatEuro(e.amount)}` : formatEuro(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/** Invite a friend — the pilot's referral offer, shown as an example. */
function Invite() {
  const { t } = useLang();
  const { name, phone } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = referralCode(name, phone);

  return (
    <section className={`${CARD} p-[clamp(20px,3vw,24px)]`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-tint">
          <Sparkle size={18} className="text-brand" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16.5px] font-bold text-ink">{t('acct.invite.title')}</h2>
          <p className="text-[13px] font-medium leading-[1.45] text-ink-60">{t('acct.invite.body')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-input border border-dashed border-line bg-page p-1.5 pl-4">
        <span className="mr-auto font-mono text-[15px] font-bold tracking-[.08em] text-ink">{code}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-3.5 text-[13px] font-bold text-white transition hover:bg-ink-80"
        >
          {copied && <Check size={14} />}
          {copied ? t('acct.invite.copied') : t('acct.invite.copy')}
        </button>
      </div>
      <p className="mt-2 text-[12px] font-medium text-ink-40">{t('acct.invite.note')}</p>
    </section>
  );
}

/** The artisans this customer has booked, most used first, one tap to rebook. */
function YourArtisans() {
  const { t } = useLang();
  const jobs = useJobs().filter((j) => j.status !== 'cancelled');
  const byArtisan = new Map<string, { name: string; initials: string; trade: (typeof jobs)[number]['trade']; count: number; rating?: number }>();
  for (const j of jobs) {
    const prev = byArtisan.get(j.artisanId);
    byArtisan.set(j.artisanId, {
      name: j.artisanName,
      initials: j.initials,
      trade: j.trade,
      count: (prev?.count ?? 0) + 1,
      rating: j.rating ?? prev?.rating,
    });
  }
  const list = [...byArtisan.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 4);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <h2 className="border-b border-line-rule px-5 py-[18px] text-label text-ink-40">{t('acct.fav.title')}</h2>
      {list.length === 0 ? (
        <p className="px-5 py-4 text-[13.5px] font-medium text-ink-60">{t('acct.fav.empty')}</p>
      ) : (
        list.map(([id, a]) => {
          const listed = AVAILABLE.some((x) => x.id === id);
          return (
            <div key={id} className="flex items-center gap-3 border-b border-line-rule px-5 py-3.5 last:border-b-0">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-avatar text-[13px] font-extrabold text-brand">
                {a.initials}
              </span>
              <span className="mr-auto min-w-0">
                {getProfile(id) ? (
                  <Link to={artisanUrl(id)} className="block truncate text-[14.5px] font-bold text-ink hover:text-brand">
                    {a.name}
                  </Link>
                ) : (
                  <span className="block truncate text-[14.5px] font-bold text-ink">{a.name}</span>
                )}
                <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-40">
                  {t(`trades.${a.trade}` as const)} · {t('acct.fav.count', { n: a.count })}
                  {a.rating && (
                    <span className="flex items-center gap-0.5 text-ink-60">
                      · <Star size={11} className="text-star" /> {a.rating}
                    </span>
                  )}
                </span>
              </span>
              <Link
                to={listed ? exploreUrl({ artisan: id }) : exploreUrl({ trade: a.trade })}
                className="flex h-9 flex-none items-center rounded-[11px] bg-brand-tint px-3.5 text-[13px] font-bold text-brand-hover transition hover:bg-brand-tint-hover hover:text-brand-hover"
              >
                {t('customer.rebook')}
              </Link>
            </div>
          );
        })
      )}
      <Link
        to={ROUTES.activity}
        className="flex items-center justify-between border-t border-line-rule px-5 py-3 text-[13.5px] font-bold text-brand transition hover:bg-page"
      >
        {t('acct.allJobs')}
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}

/** Honest: in-app payment arrives with the pilot; no card is stored. */
function Payment() {
  const { t } = useLang();
  return (
    <section className={`${CARD} p-5`}>
      <div className="mb-2 flex items-center gap-2">
        <Card size={18} className="text-ink-60" />
        <h2 className="text-[15px] font-bold text-ink">{t('acct.pay.title')}</h2>
      </div>
      <p className="mb-3 text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('acct.pay.body')}</p>
      <button type="button" disabled className="h-10 rounded-[12px] border border-dashed border-line px-4 text-[13.5px] font-bold text-ink-40">
        {t('acct.pay.add')} · {t('acct.pay.soon')}
      </button>
    </section>
  );
}

type Prefs = { updates: boolean; offers: boolean };
function readPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return { updates: p.updates ?? true, offers: p.offers ?? false };
  } catch {
    return { updates: true, offers: false };
  }
}

/** A switch: a real checkbox (role="switch") under a drawn track. */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2.5">
      <span className="text-[14px] font-semibold text-ink-80">{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 flex-none rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-card after:transition peer-checked:after:translate-x-4"
      />
    </label>
  );
}

/** Language and notification choices — saved on this device until accounts sync. */
function Preferences() {
  const { t, lang, setLang } = useLang();
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const toggle = (k: keyof Prefs) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <section className={`${CARD} p-5`}>
      <h2 className="mb-2 text-[15px] font-bold text-ink">{t('acct.prefs.title')}</h2>
      <div className="flex items-center justify-between gap-3 border-b border-line-rule py-2.5">
        <span className="text-[14px] font-semibold text-ink-80">{t('acct.prefs.language')}</span>
        <div role="group" aria-label={t('acct.prefs.language')} className="flex rounded-xl bg-well p-[3px]">
          {(['EN', 'PT'] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className={'rounded-[9px] px-3 py-1.5 text-[13px] ' + (lang === code ? 'bg-panel font-bold text-ink shadow-card' : 'font-semibold text-ink-40')}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
      <Toggle checked={prefs.updates} onChange={() => toggle('updates')} label={t('acct.prefs.updates')} />
      <Toggle checked={prefs.offers} onChange={() => toggle('offers')} label={t('acct.prefs.offers')} />
      <p className="mt-1 text-[12px] font-medium text-ink-40">{t('acct.prefs.note')}</p>
    </section>
  );
}

/** Take the data away, or wipe it from this browser. */
function YourData() {
  const { t } = useLang();
  const { name, phone, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const download = () => {
    const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), name, phone };
    for (const k of DEVICE_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) dump[k.replace('dfx.', '')] = JSON.parse(raw);
      } catch {
        /* skip unreadable */
      }
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashfixe-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    for (const k of DEVICE_KEYS) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
    signOut();
  };

  return (
    <section className={`${CARD} p-5`}>
      <div className="mb-2 flex items-center gap-2">
        <Shield size={18} className="text-ink-60" />
        <h2 className="text-[15px] font-bold text-ink">{t('acct.data.title')}</h2>
      </div>
      <p className="mb-3 text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('acct.data.body')}</p>
      {confirming ? (
        <div className="rounded-[14px] bg-well p-3">
          <p className="mb-2.5 text-[13px] font-semibold text-ink-80">{t('acct.data.confirm')}</p>
          <div className="flex gap-2">
            <button type="button" onClick={clear} className="h-10 rounded-[12px] bg-ink px-4 text-[13.5px] font-bold text-white">
              {t('acct.data.confirmBtn')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="h-10 rounded-[12px] px-3 text-[13.5px] font-bold text-ink-60 hover:bg-line">
              {t('customer.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="h-10 rounded-[12px] border border-line px-4 text-[13.5px] font-bold text-ink transition hover:bg-well">
            {t('acct.data.download')}
          </button>
          <button type="button" onClick={() => setConfirming(true)} className="h-10 rounded-[12px] px-3 text-[13.5px] font-bold text-ink-60 transition hover:bg-well hover:text-ink">
            {t('acct.data.clear')}
          </button>
        </div>
      )}
      <div className="mt-4 border-t border-line-rule pt-3">
        <button type="button" onClick={signOut} className="text-[13.5px] font-bold text-ink-60 transition hover:text-ink">
          {t('nav.signOut')}
        </button>
      </div>
    </section>
  );
}
