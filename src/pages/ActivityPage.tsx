import { Link, Navigate } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import AppPromoBand from '../components/shared/AppPromoBand';
import { ArrowRight, Check, Close, Navigation } from '../components/icons';
import { formatDate, formatEuro, useJobs, type Job } from '../lib/jobs';
import { useAuth } from '../auth';
import { useLang } from '../i18n';
import { ROUTES, jobUrl } from '../routes';
import type { StringKey } from '../i18n/strings';

/**
 * Activity — Uber's trips page, ours for repairs (ARCHITECTURE.md §2): every job,
 * the seeded history plus anything booked in chat (lib/jobs). The account itself —
 * profile, credit, saved places, preferences — lives on /account.
 */
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
        <Link
          to={ROUTES.account}
          className={`${CARD} flex items-center justify-between px-5 py-4 text-[14.5px] font-bold text-ink transition hover:bg-page hover:text-ink`}
        >
          {t('activity.accountLink')}
          <ArrowRight size={16} className="text-ink-40" />
        </Link>
        <AppPromoBand className="mt-5" />
      </main>
    </div>
  );
}

/** Every job, newest first. Live ones open tracking; finished ones open receipts. */
function Jobs() {
  const { t, lang } = useLang();
  const jobs = useJobs();

  return (
    <section className="mb-5">
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
