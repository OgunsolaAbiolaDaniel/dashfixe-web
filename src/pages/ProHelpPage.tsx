import { Link } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight } from '../components/icons';
import { useApplication } from '../lib/proApplication';
import { ROUTES } from '../routes';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * /pro/help — straight answers for artisans (Dashfixe Pro, rev 2.6), in the Pro
 * frame: pay, jobs, estimates, papers, safety and the account, each an anchor
 * (#pay, #jobs, #estimates, #documents, #safety, #account), then a person to
 * talk to (#contact). Honest pre-pilot: where something is still being set up
 * (the payout day, the rate), it says it's confirmed at onboarding.
 */
const TOPICS: Array<{ id: string; label: StringKey; qa: Array<[StringKey, StringKey]> }> = [
  {
    id: 'pay',
    label: 'pro.help.t.pay',
    qa: [
      ['pro.help.pay.q1', 'pro.help.pay.a1'],
      ['pro.help.pay.q2', 'pro.help.pay.a2'],
      ['pro.help.pay.q3', 'pro.help.pay.a3'],
    ],
  },
  {
    id: 'jobs',
    label: 'pro.help.t.jobs',
    qa: [
      ['pro.help.jobs.q1', 'pro.help.jobs.a1'],
      ['pro.help.jobs.q2', 'pro.help.jobs.a2'],
      ['pro.help.jobs.q3', 'pro.help.jobs.a3'],
    ],
  },
  {
    id: 'estimates',
    label: 'pro.help.t.estimates',
    qa: [
      ['pro.help.est.q1', 'pro.help.est.a1'],
      ['pro.help.est.q2', 'pro.help.est.a2'],
      ['pro.help.est.q3', 'pro.help.est.a3'],
    ],
  },
  {
    id: 'documents',
    label: 'pro.help.t.documents',
    qa: [
      ['pro.help.doc.q1', 'pro.help.doc.a1'],
      ['pro.help.doc.q2', 'pro.help.doc.a2'],
    ],
  },
  {
    id: 'safety',
    label: 'pro.help.t.safety',
    qa: [
      ['pro.help.safe.q1', 'pro.help.safe.a1'],
      ['pro.help.safe.q2', 'pro.help.safe.a2'],
    ],
  },
  {
    id: 'account',
    label: 'pro.help.t.account',
    qa: [
      ['pro.help.acct.q1', 'pro.help.acct.a1'],
      ['pro.help.acct.q2', 'pro.help.acct.a2'],
    ],
  },
];

export default function ProHelpPage() {
  const { t } = useLang();
  const application = useApplication();

  return (
    <MarketingShell surface="pro">
      <section className="bg-ink">
        <div className="mx-auto max-w-[860px] px-[clamp(18px,4vw,40px)] py-[clamp(40px,6vw,72px)]">
          <p className="mb-3 text-label text-brand-on-dark">{t('pro.help.kicker')}</p>
          <h1 className="mb-3 text-display text-white">{t('pro.help.title')}</h1>
          <p className="mb-7 max-w-[560px] text-lead text-onink-strong">{t('pro.help.intro')}</p>
          <nav aria-label={t('pro.help.topics')} className="flex flex-wrap gap-2">
            {TOPICS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[14px] font-bold text-white transition hover:bg-white/20 hover:text-white"
              >
                {t(label)}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="bg-panel">
        <div className="mx-auto flex max-w-[860px] flex-col gap-9 px-[clamp(18px,4vw,40px)] py-[clamp(40px,6vw,72px)]">
          {TOPICS.map(({ id, label, qa }) => (
            <section key={id} id={id} className="scroll-mt-[88px]">
              <h2 className="mb-3.5 text-h3 text-ink">{t(label)}</h2>
              <div className="overflow-hidden rounded-card border border-line-soft bg-panel">
                {qa.map(([q, a], i) => (
                  <article key={q} className={'px-[clamp(18px,3vw,28px)] py-5' + (i < qa.length - 1 ? ' border-b border-line-rule' : '')}>
                    <h3 className="mb-1.5 text-[16px] font-bold tracking-[-.01em] text-ink">{t(q)}</h3>
                    <p className="text-[14.5px] font-medium leading-[1.6] text-ink-60">{t(a)}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section id="contact" className="scroll-mt-[88px] rounded-card bg-brand-tint p-[clamp(20px,3vw,28px)]">
            <h2 className="mb-2 text-h3 text-ink">{t('help.contact.title')}</h2>
            <p className="mb-5 max-w-[560px] text-[14.5px] font-medium leading-[1.6] text-ink-80">{t('pro.help.contact.body')}</p>
            <Link
              to={application ? ROUTES.proDashboard : ROUTES.proApply}
              className="inline-flex h-ctl items-center gap-2 rounded-btn bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
            >
              {t(application ? 'pro.nav.dashboard' : 'pro.apply.start')}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>
    </MarketingShell>
  );
}
