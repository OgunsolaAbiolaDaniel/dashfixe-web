import MarketingShell from '../components/chrome/MarketingShell';
import LiveMap from '../components/explore/LiveMap';
import { useLang } from '../i18n';

/**
 * Story, belief, coverage — ARCHITECTURE.md §4. Coverage lives here as a section
 * (#coverage) rather than its own page: one pilot area is a paragraph and a map.
 */
export default function AboutPage() {
  const { t } = useLang();

  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto max-w-[840px] px-[clamp(18px,4vw,40px)] pb-[clamp(36px,5vw,64px)] pt-[clamp(40px,6vw,80px)]">
          <div className="mb-3 text-label text-brand-hover">{t('about.kicker')}</div>
          <h1 className="mb-6 text-display text-ink [text-wrap:balance]">{t('about.title')}</h1>
          <p className="max-w-[640px] text-[16px] font-medium leading-[1.7] text-ink-80">{t('about.story')}</p>
        </div>
      </section>

      <section className="bg-panel">
        <div className="mx-auto max-w-[840px] px-[clamp(18px,4vw,40px)] pb-[clamp(36px,5vw,64px)]">
          <div className="rounded-card bg-well p-[clamp(24px,3.4vw,40px)]">
            <div className="mb-3 text-label text-ink-40">{t('about.belief.title')}</div>
            <p className="text-[clamp(18px,2.2vw,22px)] font-bold leading-[1.45] tracking-[-.015em] text-ink [text-wrap:pretty]">
              “{t('about.belief')}”
            </p>
          </div>
        </div>
      </section>

      <section id="coverage" className="scroll-mt-[88px] bg-panel">
        <div className="mx-auto max-w-[840px] px-[clamp(18px,4vw,40px)] pb-[clamp(44px,6vw,80px)]">
          <h2 className="mb-3 text-h2 text-ink">{t('about.coverage.title')}</h2>
          <p className="mb-6 max-w-[560px] text-lead text-ink-60">{t('about.coverage.body')}</p>
          <div className="relative h-[clamp(280px,32vw,400px)] overflow-hidden rounded-card bg-canvas">
            <LiveMap variant="peek" />
            <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/90 bg-white/[.86] px-3 py-1.5 text-[12px] font-bold text-ink shadow-map backdrop-blur-[14px]">
              <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-brand text-brand" />
              {t('hero.mapCaption')}
            </span>
          </div>
          <p className="mt-8 text-[13.5px] font-semibold text-ink-40">{t('about.company')}</p>
        </div>
      </section>
    </MarketingShell>
  );
}
