import { Link, useNavigate } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight, Check } from '../components/icons';
import { clearApplication, useApplication } from '../lib/proApplication';
import { formatDate } from '../lib/jobs';
import { ROUTES, link, type TradeSlug } from '../routes';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * /pro/application — the applicant's status (rev 2.3): the reference, and what
 * happens next, step by step. Honest about its source: it shows what this device
 * sent; the real updates come on WhatsApp from a person. Noindex.
 */
const STAGES: Array<[StringKey, StringKey]> = [
  ['pro.status.t2', 'pro.status.t2b'],
  ['pro.status.t3', 'pro.status.t3b'],
  ['pro.status.t4', 'pro.status.t4b'],
  ['pro.status.t5', 'pro.status.t5b'],
];

export default function ProApplicationPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const app = useApplication();

  return (
    <MarketingShell surface="pro">
      <section className="bg-page">
        <div className="mx-auto max-w-[680px] px-[clamp(18px,4vw,40px)] py-[clamp(32px,5vw,64px)]">
          {!app ? (
            <div className="rounded-card border border-line-soft bg-panel p-8 text-center shadow-card">
              <h1 className="mb-2 text-h3 text-ink">{t('pro.status.empty')}</h1>
              <p className="mb-6 text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('pro.status.emptyBody')}</p>
              <Link
                to={ROUTES.proApply}
                className="inline-flex h-ctl-lg items-center rounded-btn bg-brand px-6 text-[15px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
              >
                {t('pro.apply.start')}
              </Link>
            </div>
          ) : (
            <>
              <span className="mb-4 inline-flex rounded-full bg-success-tint px-3 py-1.5 text-[12.5px] font-bold text-success">
                {t('pro.status.ref', { ref: app.reference, date: formatDate(app.submittedAt.slice(0, 10), lang) })}
              </span>
              <h1 className="mb-2 text-h2 text-ink">{t('pro.status.title', { name: app.fullName.split(' ')[0] ?? app.fullName })}</h1>
              <p className="mb-7 text-lead text-ink-60">
                {t(`trades.${app.trade as TradeSlug}` as const)} · {app.areas.join(', ')}
              </p>

              <ol className="mb-6 rounded-card border border-line-soft bg-panel p-[clamp(18px,3vw,28px)] shadow-card">
                <Stage done title={t('pro.status.t1')} body={formatDate(app.submittedAt.slice(0, 10), lang)} />
                {STAGES.map(([title, body], i) => (
                  <Stage
                    key={title}
                    now={i === 0}
                    last={i === STAGES.length - 1}
                    title={t(title)}
                    body={t(body, { phone: app.phone, areas: app.areas.join(', ') })}
                    nowLabel={t('pro.status.now')}
                  />
                ))}
              </ol>

              <div className="mb-6 rounded-card bg-brand-tint p-5">
                <p className="mb-3 text-label text-ink-60">{t('pro.status.meanwhile')}</p>
                <div className="flex flex-col gap-2">
                  <Link to={link('artisanApp')} className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.status.seeApp')}
                    <ArrowRight size={15} />
                  </Link>
                  <Link to={link('artisanPay')} className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.status.howPay')}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <p className="mb-3 text-[13px] font-medium leading-[1.5] text-ink-60">{t('pro.status.note')}</p>
              <button
                type="button"
                onClick={() => {
                  clearApplication();
                  navigate(ROUTES.proApply);
                }}
                className="text-[13.5px] font-bold text-ink-60 underline transition hover:text-ink"
              >
                {t('pro.status.again')}
              </button>
            </>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}

function Stage({ title, body, done, now, last, nowLabel }: { title: string; body: string; done?: boolean; now?: boolean; last?: boolean; nowLabel?: string }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span aria-hidden="true" className="absolute left-[15px] top-9 h-[calc(100%-36px)] w-0.5 bg-line" />}
      <span
        className={
          'relative grid h-8 w-8 flex-none place-items-center rounded-full text-[12px] font-extrabold ' +
          (done ? 'bg-success text-white' : now ? 'bg-brand text-white ring-4 ring-brand/15' : 'border-2 border-line bg-panel text-ink-40')
        }
      >
        {done ? <Check size={15} strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-current" />}
      </span>
      <span className="min-w-0 pt-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={'text-[15.5px] font-bold ' + (done || now ? 'text-ink' : 'text-ink-60')}>{title}</span>
          {now && <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-brand-hover">{nowLabel}</span>}
        </span>
        <span className="mt-0.5 block text-[13.5px] font-medium leading-[1.5] text-ink-60">{body}</span>
      </span>
    </li>
  );
}
