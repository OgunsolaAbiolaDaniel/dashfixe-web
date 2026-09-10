import { useState } from 'react';
import MarketingShell from '../components/chrome/MarketingShell';
import { Bolt, Check, ChevronDown, Phone, Receipt, Verified, Wrench } from '../components/icons';
import { useLang } from '../i18n';
import { TRADES } from '../search';

/**
 * The artisan world on one page — ARCHITECTURE.md §4. Supply acquisition is manual
 * during the pilot: the page's only job is a credible pitch and a WhatsApp-first
 * application. Anchored depth (#pay, #vetting, #app, #apply) replaced the three
 * separate artisan pages that were cut in revision 1.
 *
 * Submissions are held in local state until POST /api/artisans/apply exists (Phase 5).
 */
export type ArtisanApplication = { fullName: string; phone: string; email: string; trade: string };

const FIELD_LABEL = 'mb-[7px] block text-label text-ink-40';
const FIELD_INPUT =
  'h-12 w-full rounded-input border border-line bg-page px-[15px] text-[14.5px] font-semibold text-ink outline-offset-[6px] placeholder:text-ink-30';

export default function ForArtisansPage() {
  const { t } = useLang();

  return (
    <MarketingShell>
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
              <a
                href="#apply"
                className="flex h-[52px] items-center rounded-btn bg-brand px-[26px] text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-hover hover:text-white"
              >
                {t('fa.hero.apply')}
              </a>
              <a href="#pay" className="border-b border-white/30 pb-1 text-[14.5px] font-semibold text-onink-strong transition hover:border-white hover:text-white">
                {t('fa.hero.how')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section className="bg-panel">
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
                  <span className="text-[13px] font-extrabold tracking-[.08em] text-ink-30">{n}</span>
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
              <p className="max-w-[460px] text-lead text-ink-60">{t('fa.app.body')}</p>
            </div>
            <div className="overflow-hidden rounded-card bg-well">
              <img
                src="https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt=""
                loading="lazy"
                className="block h-[clamp(240px,26vw,340px)] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[560px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,6vw,80px)]">
          <ApplyForm />
        </div>
      </section>
    </MarketingShell>
  );
}

function ApplyForm() {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  const [app, setApp] = useState<ArtisanApplication>({ fullName: '', phone: '', email: '', trade: 'plumbing' });
  const set = (k: keyof ArtisanApplication) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setApp((a) => ({ ...a, [k]: e.target.value }));

  if (done) {
    return (
      <div className="rounded-card border border-line-soft bg-panel p-8 text-center shadow-card">
        <span aria-hidden="true" className="mb-4 block text-4xl">
          🛠️
        </span>
        <h2 className="mb-2 text-h3 text-ink">{t('fa.apply.done.title')}</h2>
        <p className="text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('fa.apply.done.body')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Held locally until POST /api/artisans/apply exists (ARCHITECTURE.md §6).
        void app;
        setDone(true);
      }}
      className="rounded-card border border-line-soft bg-panel p-[clamp(22px,4vw,32px)] shadow-card"
    >
      <h2 className="mb-2 text-h3 text-ink">{t('fa.apply.title')}</h2>
      <p className="mb-6 text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('fa.apply.subtitle')}</p>

      <div className="flex flex-col gap-[18px]">
        <div>
          <label htmlFor="fa-name" className={FIELD_LABEL}>
            {t('fa.apply.name')}
          </label>
          <input id="fa-name" type="text" required value={app.fullName} onChange={set('fullName')} placeholder={t('fa.apply.name.ph')} className={FIELD_INPUT} />
        </div>
        <div>
          <label htmlFor="fa-phone" className={FIELD_LABEL}>
            {t('fa.apply.phone')}
          </label>
          <input id="fa-phone" type="tel" required value={app.phone} onChange={set('phone')} placeholder="+351 ..." className={FIELD_INPUT} />
        </div>
        <div>
          <label htmlFor="fa-email" className={FIELD_LABEL}>
            {t('fa.apply.email')}
          </label>
          <input id="fa-email" type="email" required value={app.email} onChange={set('email')} placeholder="name@example.com" className={FIELD_INPUT} />
        </div>
        <div>
          <label htmlFor="fa-trade" className={FIELD_LABEL}>
            {t('fa.apply.trade')}
          </label>
          <div className="relative">
            <select id="fa-trade" value={app.trade} onChange={set('trade')} className={`${FIELD_INPUT} appearance-none pr-10`}>
              {TRADES.map((tr) => (
                <option key={tr.slug} value={tr.slug}>
                  {t(`trades.${tr.slug}` as const)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-40" />
          </div>
        </div>
      </div>

      <button type="submit" className="mt-6 h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover">
        {t('fa.apply.submit')}
      </button>
      <p className="mt-3 text-center text-[12.5px] font-semibold text-ink-40">{t('fa.apply.micro')}</p>
    </form>
  );
}
