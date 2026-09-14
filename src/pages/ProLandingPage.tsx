import { Link } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import PhoneShot from '../components/shared/PhoneShot';
import { TodayShot } from '../components/pro/Shots';
import { ArrowRight, Bolt, Check, Phone, Receipt, Verified, Wrench } from '../components/icons';
import { ROUTES } from '../routes';
import { useLang } from '../i18n';
import { useApplication } from '../lib/proApplication';

/**
 * Dashfixe Pro's landing (/pro, rev 2.2) — the artisan world's front door, in its
 * own chrome (MarketingShell surface="pro"), like Uber's site for drivers. It was
 * /for-artisans, which now redirects here. Supply acquisition is manual during the
 * pilot: a credible pitch, then the application (/pro/apply, rev 2.3). Anchored
 * depth: #how, #pay, #vetting, #app, #apply.
 */
const APPLY_STEPS = ['pro.apply.s1', 'pro.apply.s2', 'pro.apply.s3', 'pro.apply.s4'] as const;

export default function ProLandingPage() {
  const { t } = useLang();
  const application = useApplication();

  return (
    <MarketingShell surface="pro">
      {/* Hero — the one dark moment on this page (design rule: one dark thing per view) */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,7vw,96px)]">
          <div className="max-w-[640px]">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-success-bright/40 bg-success-bright/[.16] px-[13px] py-1.5">
              <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success-bright text-success-bright" />
              <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#a7f3cf]">{t('fa.pilotBadge')}</span>
            </span>
            <h1 className="mb-5 text-display text-white [text-wrap:balance]">{t('fa.hero.title')}</h1>
            <p className="mb-8 max-w-[520px] text-[15.5px] font-medium leading-[1.6] text-onink">{t('fa.hero.body')}</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to={ROUTES.proApply}
                className="flex h-[52px] items-center rounded-btn bg-brand px-[26px] text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-hover hover:text-white"
              >
                {t('fa.hero.apply')}
              </Link>
              <a href="#pay" className="border-b border-white/30 pb-1 text-[14.5px] font-semibold text-onink-strong transition hover:border-white hover:text-white">
                {t('fa.hero.how')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section id="how" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,6vw,80px)]">
          <h2 className="mb-[30px] text-h2 text-ink">{t('fa.steps.title')}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
            {(
              [
                { Icon: Phone, n: '01', title: 'fa.step1.title', body: 'fa.step1.body' },
                { Icon: Receipt, n: '02', title: 'fa.step2.title', body: 'fa.step2.body' },
                { Icon: Wrench, n: '03', title: 'fa.step3.title', body: 'fa.step3.body' },
              ] as const
            ).map(({ Icon, n, title, body }) => (
              <article key={n} className="rounded-[20px] bg-well p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-panel">
                    <Icon size={21} strokeWidth={1.6} className="text-brand" />
                  </span>
                  <span className="text-[13px] font-extrabold tracking-[.08em] text-ink-40">{n}</span>
                </div>
                <h3 className="mb-2 text-h3 text-ink">{t(title)}</h3>
                <p className="text-[14.5px] font-medium leading-[1.55] text-ink-60">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it pays — commission stated plainly (design rule: state the commission) */}
      <section id="pay" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(44px,6vw,80px)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-[clamp(28px,4vw,56px)] rounded-card bg-brand-tint-strong p-[clamp(26px,3.4vw,48px)]">
            <div>
              <h2 className="mb-4 text-h2 text-ink [text-wrap:balance]">{t('fa.pay.title')}</h2>
              <p className="max-w-[440px] text-lead text-ink-60">{t('fa.pay.body')}</p>
            </div>
            <ul className="flex flex-col gap-4">
              {(['fa.pay.point1', 'fa.pay.point2', 'fa.pay.point3'] as const).map((k) => (
                <li key={k} className="flex items-start gap-3 rounded-[18px] bg-panel px-5 py-4">
                  <Check size={18} className="mt-0.5 flex-none text-success" />
                  <span className="text-[14.5px] font-semibold leading-[1.5] text-ink-80">{t(k)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Vetting & licensing */}
      <section id="vetting" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(44px,6vw,80px)]">
          <div className="mb-7 max-w-[560px]">
            <h2 className="mb-3 text-h2 text-ink">{t('fa.vetting.title')}</h2>
            <p className="text-lead text-ink-60">{t('fa.vetting.body')}</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            {(
              [
                { Icon: Verified, title: 'fa.vetting.id', body: 'fa.vetting.id.body' },
                { Icon: Bolt, title: 'fa.vetting.dgeg', body: 'fa.vetting.dgeg.body' },
                { Icon: Check, title: 'fa.vetting.gas', body: 'fa.vetting.gas.body' },
              ] as const
            ).map(({ Icon, title, body }) => (
              <article key={title} className="rounded-card border border-line-soft bg-panel p-6">
                <Icon size={22} strokeWidth={1.7} className="mb-4 text-brand" />
                <h3 className="mb-1.5 text-[16.5px] font-bold tracking-[-.015em] text-ink">{t(title)}</h3>
                <p className="text-[14px] font-medium leading-[1.55] text-ink-60">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The artisan app */}
      <section id="app" className="scroll-mt-[88px] bg-page">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,5vw,72px)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-[clamp(28px,4vw,56px)]">
            <div>
              <h2 className="mb-4 text-h2 text-ink">{t('fa.app.title')}</h2>
              <p className="mb-6 max-w-[460px] text-lead text-ink-60">{t('fa.app.body')}</p>
              <Link
                to={ROUTES.proApp}
                className="inline-flex h-ctl items-center gap-2 rounded-btn bg-ink px-5 text-[14.5px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
              >
                {t('fa.app.try')}
                <ArrowRight size={16} />
              </Link>
            </div>
            {/* A still of the app itself, rather than a stock photo. */}
            <div className="flex justify-center">
              <PhoneShot caption={t('pro.shot.today')}>
                <TodayShot />
              </PhoneShot>
            </div>
          </div>
        </div>
      </section>

      {/* Apply — the start of /pro/apply (or the way back to the status, once applied) */}
      <section id="apply" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[760px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,6vw,80px)]">
          <div className="relative overflow-hidden rounded-hero bg-ink p-[clamp(26px,4vw,44px)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 block h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.75)_0%,rgba(37,99,235,0)_68%)] blur-[24px]"
            />
            <div className="relative">
              <p className="mb-3 text-label text-brand-on-dark">{t('pro.apply.eyebrow')}</p>
              <h2 className="mb-3 text-h2 text-white">{t('fa.apply.title')}</h2>
              <p className="mb-6 max-w-[520px] text-[15px] font-medium leading-[1.55] text-onink-strong">{t('fa.apply.subtitle')}</p>
              <ol className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-2.5">
                {APPLY_STEPS.map((key, i) => (
                  <li key={key} className="flex items-center gap-2.5 rounded-[14px] bg-white/10 px-3.5 py-3 text-[14px] font-semibold text-white">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white/15 text-[12px] font-extrabold">{i + 1}</span>
                    {t(key)}
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  to={application ? ROUTES.proApplication : ROUTES.proApply}
                  className="flex h-[52px] items-center gap-2 rounded-btn bg-brand px-[26px] text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-hover hover:text-white"
                >
                  {t(application ? 'pro.apply.seeStatus' : 'pro.apply.start')}
                  <ArrowRight size={16} />
                </Link>
                <span className="text-[13px] font-semibold text-onink">{t('pro.apply.time')}</span>
              </div>
              <p className="mt-5 text-[12.5px] font-semibold text-onink">{t('fa.apply.micro')}</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
