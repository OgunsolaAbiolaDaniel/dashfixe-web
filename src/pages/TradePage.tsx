import { Link, Navigate, useParams } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight, Bolt, Check, Roller, Saw, Spray, Wrench } from '../components/icons';
import { AVAILABLE, getNearby } from '../components/explore/artisans';
import { TRADE_SLUGS, artisanUrl, isTradeSlug, link, tradeUrl, type TradeSlug } from '../routes';
import { exploreUrl } from '../search';
import { useLang } from '../i18n';

/**
 * One landing page per trade — docs/ARCHITECTURE.md §4 (Phase 5, SEO). The page a
 * search for "canalizador Amora" should land on: what the trade covers, what it
 * costs, how the flow works, and a straight door into /explore with the trade set.
 * Everything that looks like supply is badged sample data (the honesty rule).
 */
const ICONS: Record<TradeSlug, typeof Wrench> = {
  plumbing: Wrench,
  electrical: Bolt,
  painting: Roller,
  carpentry: Saw,
  cleaning: Spray,
};

type SampleCard = { id: string; initials: string; name: string; price: string; eta: number; to: string };

/** The sample artisans of one trade: listed ones open their profile, the rest open search. */
function sampleFor(slug: TradeSlug): SampleCard[] {
  const listed = AVAILABLE.filter((a) => a.trade === slug).map((a) => ({ ...a, to: artisanUrl(a.id) }));
  const nearby = getNearby()
    .filter((p) => p.trade === slug && !p.listed)
    .map((p) => ({ ...p, to: exploreUrl({ trade: slug }) }));
  return [...listed, ...nearby];
}

export default function TradePage() {
  const { slug } = useParams();
  const { t } = useLang();
  if (!isTradeSlug(slug)) return <Navigate to={link('explore')} replace />;

  const Icon = ICONS[slug];
  const pros = t(`trade.${slug}.pros`);
  const jobs = t(`trade.${slug}.jobs`).split('|');
  const sample = sampleFor(slug);
  const steps = [1, 2, 3] as const;

  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto grid max-w-[1180px] gap-[clamp(28px,4vw,56px)] px-[clamp(18px,4vw,40px)] pb-[clamp(36px,5vw,64px)] pt-[clamp(36px,6vw,80px)] lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-tint">
                <Icon size={21} strokeWidth={1.6} className="text-brand" />
              </span>
              <span className="text-label text-brand-hover">{t('trade.kicker')}</span>
            </div>
            <h1 className="mb-4 text-display text-ink [text-wrap:balance]">{t('trade.h1', { pros })}</h1>
            <p className="mb-7 max-w-[560px] text-lead text-ink-60">{t(`trade.${slug}.intro`)}</p>
            <div className="mb-5 flex flex-wrap gap-3">
              <Link
                to={exploreUrl({ trade: slug })}
                className="flex h-ctl-lg items-center gap-2 rounded-btn bg-brand px-6 text-[15px] font-bold text-white transition hover:bg-brand-hover"
              >
                {t('trade.cta')}
                <ArrowRight size={17} />
              </Link>
              <Link
                to={exploreUrl({ trade: slug, when: 'later' })}
                className="flex h-ctl-lg items-center rounded-btn border border-line bg-panel px-6 text-[15px] font-bold text-ink transition hover:bg-well"
              >
                {t('hero.bookLater')}
              </Link>
            </div>
            <p className="max-w-[520px] text-[12.5px] font-medium leading-[1.55] text-ink-40">{t('trade.pilot')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-line-soft bg-panel p-[clamp(20px,2.6vw,28px)]">
              <h2 className="mb-4 text-h3 text-ink">{t('trade.jobsTitle')}</h2>
              <ul className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                {jobs.map((job) => (
                  <li key={job} className="flex items-start gap-2.5 text-[14.5px] font-semibold leading-[1.4] text-ink-80">
                    <Check size={16} strokeWidth={2.4} className="mt-0.5 flex-none text-success" />
                    {job}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line-rule pt-4 text-[13px] font-semibold leading-[1.5] text-ink-60">
                {t(`trade.${slug}.note`)}
              </p>
            </div>
            <div className="rounded-card bg-well p-[clamp(20px,2.6vw,28px)]">
              <h2 className="mb-2 text-label text-ink-40">{t('trade.priceTitle')}</h2>
              <p className="mb-1.5 text-[16.5px] font-bold leading-[1.4] tracking-[-.01em] text-ink">{t(`trade.${slug}.price`)}</p>
              <p className="text-[13px] font-medium leading-[1.5] text-ink-60">{t('trade.priceNote')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] py-[clamp(40px,5vw,72px)]">
          <h2 className="mb-6 text-h2 text-ink">{t('trade.howTitle')}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((n) => (
              <li key={n} className="rounded-card bg-panel p-6">
                <span className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-ink text-[14px] font-extrabold text-white">{n}</span>
                <h3 className="mb-2 text-[16.5px] font-bold tracking-[-.01em] text-ink">{t(`trade.how${n}.title`)}</h3>
                <p className="text-[14px] font-medium leading-[1.55] text-ink-60">{t(`trade.how${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {sample.length > 0 && (
        <section className="bg-panel">
          <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] pt-[clamp(40px,5vw,72px)]">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="mr-auto text-h2 text-ink">{t('trade.sampleTitle')}</h2>
              <span className="rounded-full bg-warning-tint px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
                {t('nearby.sample')}
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-3.5">
              {sample.map((a) => (
                <Link
                  key={a.id}
                  to={a.to}
                  className="flex items-center gap-3.5 rounded-card border border-line-soft bg-panel p-4 transition hover:border-line hover:text-ink"
                >
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-[16px] bg-avatar text-sm font-extrabold text-brand">
                    {a.initials}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className="block truncate text-[15.5px] font-bold text-ink">{a.name}</span>
                    <span className="mt-0.5 block text-[13px] font-semibold text-ink-60">
                      {a.price} · {t('nearby.minAway', { min: a.eta })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-panel">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] py-[clamp(40px,5vw,72px)]">
          <h2 className="mb-4 text-label text-ink-40">{t('trade.others')}</h2>
          <div className="flex flex-wrap gap-2.5">
            {TRADE_SLUGS.filter((s) => s !== slug).map((s) => (
              <Link
                key={s}
                to={tradeUrl(s)}
                className="rounded-full bg-well px-4 py-2.5 text-[14px] font-bold text-ink transition hover:bg-line hover:text-ink"
              >
                {t(`trade.${s}.pros`)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
