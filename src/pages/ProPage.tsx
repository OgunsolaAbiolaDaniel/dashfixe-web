import { Link } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import PhoneShot from '../components/shared/PhoneShot';
import StoreBadges from '../components/shared/StoreBadges';
import { EarningsShot, EstimateShot, OfferShot, TodayShot } from '../components/pro/Shots';
import { Bolt, Euro, Receipt, Wrench } from '../components/icons';
import { useLang } from '../i18n';
import { link } from '../routes';
import type { StringKey } from '../i18n/strings';

/**
 * /pro — the artisan app's showcase (the way a product page presents an app to
 * download): the pitch, stills of the app (designs/Dashfixe Artisan App.dc.html),
 * what's in it, and how to get it. Not interactive — a reference page.
 *
 * The store badges say "coming soon" and link nowhere: the app ships with the
 * pilot cohort (../Dashfixe.md: never imply a live app). The way in today is
 * the pilot application.
 */
const SHOTS = [
  { caption: 'pro.shot.today', Shot: TodayShot },
  { caption: 'pro.shot.offer', Shot: OfferShot },
  { caption: 'pro.shot.estimate', Shot: EstimateShot },
  { caption: 'pro.shot.earnings', Shot: EarningsShot },
] as const;

const FEATURES: ReadonlyArray<{ Icon: typeof Bolt; title: StringKey; body: StringKey }> = [
  { Icon: Bolt, title: 'pro.step1', body: 'pro.f1' },
  { Icon: Receipt, title: 'pro.step2', body: 'pro.f2' },
  { Icon: Wrench, title: 'pro.step3', body: 'pro.f3' },
  { Icon: Euro, title: 'pro.step4', body: 'pro.f4' },
];

export default function ProPage() {
  const { t } = useLang();
  return (
    <MarketingShell>
      {/* The pitch and the stills, on the artisan app's darker chrome. */}
      <section className="overflow-hidden bg-ink">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pt-[clamp(48px,7vw,88px)] text-center">
          <p className="mb-4 text-label text-brand-on-dark">{t('pro.show.eyebrow')}</p>
          <h1 className="mx-auto max-w-[780px] text-display text-white">{t('fa.hero.title')}</h1>
          <p className="mx-auto mt-5 max-w-[560px] text-lead text-onink-strong">{t('fa.hero.body')}</p>
          <div className="mt-8 flex justify-center">
            <StoreBadges tone="light" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-onink">{t('store.note')}</p>
          <Link
            to={link('artisanApply')}
            className="mt-6 inline-flex h-ctl items-center rounded-btn border border-white/25 px-5 text-[14.5px] font-bold text-white transition hover:bg-white/10 hover:text-white"
          >
            {t('fa.hero.apply')}
          </Link>
        </div>
        <div className="mx-auto mt-[clamp(40px,5vw,64px)] flex max-w-[1280px] snap-x gap-6 overflow-x-auto px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] lg:justify-center">
          {SHOTS.map(({ caption, Shot }, i) => (
            <PhoneShot key={caption} caption={t(caption)} onDark className={i % 2 ? 'lg:mt-12' : ''}>
              <Shot />
            </PhoneShot>
          ))}
        </div>
        <p className="pb-8 text-center text-[12.5px] font-medium text-onink">{t('pro.show.previews')}</p>
      </section>

      {/* What's in it — one line per chapter of the design. */}
      <section className="bg-page">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
          <h2 className="mb-8 text-h2 text-ink">{t('pro.show.inside')}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <article key={title} className="rounded-card border border-line-soft bg-panel p-6">
                <Icon size={22} className="mb-4 text-brand" />
                <h3 className="mb-1.5 text-[16.5px] font-bold tracking-[-.015em] text-ink">{t(title)}</h3>
                <p className="text-[14px] font-medium leading-[1.55] text-ink-60">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Get it. */}
      <section className="bg-panel">
        <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
          <div className="flex flex-wrap items-center gap-8 rounded-hero bg-brand-tint p-[clamp(24px,4vw,48px)]">
            <div className="min-w-[260px] flex-1">
              <h2 className="mb-2 text-h2 text-ink">{t('pro.show.cta')}</h2>
              <p className="max-w-[520px] text-lead text-ink-60">{t('pro.show.ctaBody')}</p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <StoreBadges />
              <Link
                to={link('artisanApply')}
                className="flex h-ctl items-center rounded-btn bg-ink px-5 text-[14.5px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
              >
                {t('fa.hero.apply')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
