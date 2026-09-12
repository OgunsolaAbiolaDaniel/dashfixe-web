import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import { TrackMap } from '../components/map/lazy';
import ChatPanel from '../components/explore/ChatPanel';
import { Check } from '../components/icons';
import { AVAILABLE } from '../components/explore/artisans';
import { formatEuro, getJob, type Job } from '../lib/jobs';
import { HOME } from '../lib/geo';
import { DEFAULT_ADDRESS, exploreUrl } from '../search';
import { ROUTES, artisanUrl, link } from '../routes';
import { useAuth } from '../auth';
import { useLang } from '../i18n';

/**
 * The job — ARCHITECTURE.md §4. One route, two states:
 *
 * - travelling: the tracking screen. Panel = timeline + the approved estimate +
 *   chat; map = TrackMap with the artisan easing along a sample route.
 * - done: the receipt. Itemised lines, paid-in-app, rating, rebook.
 *
 * Signed-in only (account data); sample-driven until the Phase 5 backend.
 */
export default function JobPage() {
  const { id = '' } = useParams();
  const { signedIn, checking } = useAuth();

  if (checking) return null;
  if (!signedIn) return <Navigate to={ROUTES.home} replace />;
  const job = getJob(id);
  if (!job) return <Navigate to={ROUTES.activity} replace />;

  return job.status === 'done' ? <Receipt job={job} /> : <LiveJob job={job} />;
}

const STEPS = ['agreed', 'travelling', 'working', 'done'] as const;

function LiveJob({ job }: { job: Job }) {
  const { t, lang } = useLang();
  const [params] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(params.get('chat') === '1');
  const artisan = AVAILABLE.find((a) => a.id === job.artisanId);
  const current = STEPS.indexOf(job.status);

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-dvh lg:overflow-hidden">
      <AppBar />
      <div className="grid min-h-0 flex-1 items-stretch grid-cols-1 lg:grid-cols-[minmax(340px,436px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-[18px] overflow-y-auto border-r border-line-soft bg-page p-[26px] [&>*]:shrink-0">
          <div>
            <div className="mb-2.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success-tint px-[11px] py-1">
                <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success text-success" />
                <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-success">
                  {t('customer.onTheWay')}
                </span>
              </span>
              {job.arrives && <span className="ml-auto text-[13px] font-bold text-ink-60">{t('customer.arrives', { time: job.arrives })}</span>}
            </div>
            <h1 className="text-[24px] font-extrabold leading-[1.1] tracking-[-.025em] text-ink">
              {t('customer.heading', { name: job.artisanName.split(' ')[0]! })}
            </h1>
            <p className="mt-1 text-[13.5px] font-semibold text-ink-60">
              {`${t(`trades.${job.trade}` as const)} · ${job.title[lang]}`}
            </p>
          </div>

          {/* Timeline */}
          <section className="rounded-card border border-line-soft bg-panel p-[18px]">
            {STEPS.map((step, i) => (
              <div key={step} className={'flex items-center gap-3' + (i < STEPS.length - 1 ? ' pb-4' : '')}>
                {i < current ? (
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-success-tint">
                    <Check size={14} className="text-success" />
                  </span>
                ) : i === current ? (
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-tint">
                    <span className="pulse-dot block h-2 w-2 rounded-full bg-brand text-brand" />
                  </span>
                ) : (
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-well">
                    <span className="block h-1.5 w-1.5 rounded-full bg-ink-30" />
                  </span>
                )}
                <span
                  className={
                    'text-[14px] ' +
                    (i < current ? 'font-semibold text-ink-60' : i === current ? 'font-bold text-ink' : 'font-semibold text-ink-40')
                  }
                >
                  {t(`job.step.${step}` as const)}
                </span>
              </div>
            ))}
          </section>

          {/* The approved estimate — the price was agreed before travel */}
          <section className="overflow-hidden rounded-card border border-line-soft bg-panel">
            <div className="border-b border-line-rule px-[18px] py-3.5 text-label text-ink-40">{t('customer.approved')}</div>
            {job.lines.map((line) => (
              <div key={line.label.EN} className="flex items-center gap-3 border-b border-line-rule px-[18px] py-3">
                <span className="mr-auto text-[14px] font-semibold text-ink-80">{line.label[lang]}</span>
                <span className="text-[14.5px] font-extrabold tracking-[-.01em] text-ink">{formatEuro(line.amount)}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 px-[18px] py-3.5">
              <span className="mr-auto text-[14px] font-bold text-ink">{t('job.total')}</span>
              <span className="text-[19px] font-extrabold tracking-[-.02em] text-ink">{formatEuro(job.total)}</span>
            </div>
            <p className="border-t border-line-rule bg-page px-[18px] py-3 text-[12.5px] font-medium leading-[1.5] text-ink-60">
              {t('job.agreedNote')}
            </p>
          </section>

          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex h-ctl-lg items-center justify-center rounded-[15px] bg-brand text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-hover"
          >
            {t('customer.openChat')}
          </button>
          <p className="text-[12.5px] font-medium leading-[1.5] text-ink-40">
            {t('job.cancelNote', { name: job.artisanName.split(' ')[0]! })}
          </p>
        </div>

        <div className="relative min-h-[440px] min-w-0 lg:min-h-0">
          {job.from && <TrackMap from={job.from} to={HOME} initials={job.initials} />}
          {chatOpen && artisan && (
            <ChatPanel key={artisan.id} artisan={artisan} address={DEFAULT_ADDRESS} onClose={() => setChatOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

function Receipt({ job }: { job: Job }) {
  const { t, lang } = useLang();
  const [given, setGiven] = useState<number | null>(job.rating ?? null);
  const hasProfile = AVAILABLE.some((a) => a.id === job.artisanId);

  return (
    <div className="min-h-screen bg-page">
      <AppBar />
      <main className="mx-auto max-w-[640px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(24px,3.4vw,40px)]">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-success-tint">
              <Check size={18} className="text-success" />
            </span>
            <span className="text-label text-success">{t('job.doneKicker')}</span>
          </div>
          <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">{job.title[lang]}</h1>
          <p className="mt-1.5 text-[13.5px] font-semibold text-ink-60">
            {job.date}
            {' · '}
            {hasProfile ? (
              <Link to={artisanUrl(job.artisanId)} className="font-bold text-brand hover:text-brand-hover">
                {job.artisanName}
              </Link>
            ) : (
              job.artisanName
            )}
            {` · ${t(`trades.${job.trade}` as const)}`}
          </p>
        </div>

        {/* Receipt */}
        <section className="overflow-hidden rounded-card border border-line-soft bg-panel">
          <div className="flex items-center border-b border-line-rule px-5 py-4">
            <span className="mr-auto text-label text-ink-40">{t('job.receipt')}</span>
            {job.paid && (
              <span className="rounded-full bg-success-tint px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-[.06em] text-success">
                {t('job.paid')}
              </span>
            )}
          </div>
          {job.lines.map((line) => (
            <div key={line.label.EN} className="flex items-center gap-3 border-b border-line-rule px-5 py-3.5">
              <span className="mr-auto text-[14.5px] font-semibold text-ink-80">{line.label[lang]}</span>
              <span className="text-[15px] font-extrabold tracking-[-.01em] text-ink">{formatEuro(line.amount)}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="mr-auto text-[15px] font-bold text-ink">{t('job.total')}</span>
            <span className="text-[22px] font-extrabold tracking-[-.025em] text-ink">{formatEuro(job.total)}</span>
          </div>
        </section>

        {/* Rating */}
        <section className="mt-5 rounded-card border border-line-soft bg-panel p-5">
          {given !== null ? (
            <p className="text-[14.5px] font-bold text-ink">
              {job.rating ? t('job.rated', { stars: given }) : t('job.rateThanks')}
            </p>
          ) : (
            <>
              <p className="mb-3 text-[15px] font-bold text-ink">
                {t('job.rate', { name: job.artisanName.split(' ')[0]! })}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGiven(n)}
                    aria-label={t('job.star', { n })}
                    className="grid h-11 w-11 place-items-center rounded-[13px] border border-line bg-panel text-[19px] text-star transition hover:bg-brand-tint"
                  >
                    ★
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={hasProfile ? exploreUrl({ artisan: job.artisanId }) : exploreUrl({ trade: job.trade })}
            className="flex h-ctl items-center rounded-[13px] bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
          >
            {t('customer.rebook')}
          </Link>
          <Link
            to={link('help')}
            className="flex h-ctl items-center rounded-[13px] border border-line bg-panel px-5 text-[14.5px] font-bold text-ink transition hover:bg-page hover:text-ink"
          >
            {t('job.help')}
          </Link>
        </div>
      </main>
    </div>
  );
}
