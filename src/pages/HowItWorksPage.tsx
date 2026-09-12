import { Link } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight, Chat, Euro, Navigation, Shield, Star, Wrench } from '../components/icons';
import { link } from '../routes';
import { useLang } from '../i18n';

/**
 * How it works — the customer journey end to end (ARCHITECTURE.md §3), the
 * page the header's "How it works" opens. Five steps that match the product
 * exactly (search → chat → approve → track → pay), then the three rules that
 * make it trustworthy, then a door into /explore and one for artisans.
 */
const STEPS = [
  { n: 1, Icon: Wrench },
  { n: 2, Icon: Navigation },
  { n: 3, Icon: Chat },
  { n: 4, Icon: Navigation },
  { n: 5, Icon: Star },
] as const;

const RULES = [
  { id: 'estimate', Icon: Euro, title: 'how.priceTitle', body: 'how.priceBody' },
  { id: 'safety', Icon: Shield, title: 'how.safetyTitle', body: 'how.safetyBody' },
  { id: 'cancellations', Icon: Wrench, title: 'how.cancelTitle', body: 'how.cancelBody' },
] as const;

export default function HowItWorksPage() {
  const { t } = useLang();

  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(40px,6vw,80px)]">
          <div className="mb-3 text-label text-brand-hover">{t('how.kicker')}</div>
          <h1 className="mb-4 max-w-[16ch] text-display text-ink [text-wrap:balance]">{t('how.title')}</h1>
          <p className="mb-7 max-w-[600px] text-lead text-ink-60">{t('how.intro')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={link('explore')}
              className="flex h-ctl-lg items-center gap-2 rounded-btn bg-ink px-6 text-[15px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
            >
              {t('how.cta')}
              <ArrowRight size={17} />
            </Link>
            <Link
              to={link('book')}
              className="flex h-ctl-lg items-center rounded-btn border border-line bg-panel px-6 text-[15px] font-bold text-ink transition hover:bg-well hover:text-ink"
            >
              {t('nav.bookAhead')}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-panel">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] pb-[clamp(44px,5vw,72px)]">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ n, Icon }) => (
              <li key={n} className="flex flex-col rounded-card bg-well p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-panel">
                    <Icon size={19} strokeWidth={1.7} className="text-brand" />
                  </span>
                  <span className="text-[13px] font-extrabold text-ink-30">{String(n).padStart(2, '0')}</span>
                </div>
                <h2 className="mb-2 text-[16.5px] font-bold leading-[1.3] tracking-[-.01em] text-ink">{t(`how.step${n}.title`)}</h2>
                <p className="text-[14px] font-medium leading-[1.55] text-ink-60">{t(`how.step${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto grid max-w-[1180px] gap-4 px-[clamp(18px,4vw,40px)] py-[clamp(44px,5vw,72px)] md:grid-cols-3">
          {RULES.map(({ id, Icon, title, body }) => (
            <article key={id} id={id} className="scroll-mt-[88px] rounded-card bg-panel p-[clamp(22px,2.6vw,28px)]">
              <Icon size={22} strokeWidth={1.7} className="mb-4 text-brand" />
              <h2 className="mb-2 text-h3 text-ink">{t(title)}</h2>
              <p className="text-[14.5px] font-medium leading-[1.6] text-ink-60">{t(body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-panel">
        <div className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,5vw,72px)]">
          <div className="flex flex-wrap items-center gap-6 rounded-card bg-ink p-[clamp(24px,3.4vw,40px)]">
            <div className="mr-auto max-w-[520px]">
              <h2 className="mb-2 text-h2 text-white">{t('how.proTitle')}</h2>
              <p className="text-[15px] font-medium leading-[1.55] text-onink">{t('how.proBody')}</p>
            </div>
            <Link
              to={link('forArtisans')}
              className="flex h-ctl-lg items-center rounded-btn bg-panel px-6 text-[15px] font-bold text-ink transition hover:bg-well hover:text-ink"
            >
              {t('how.proCta')}
            </Link>
          </div>
          <p className="mt-5 text-[12.5px] font-medium leading-[1.55] text-ink-40">{t('how.pilot')}</p>
        </div>
      </section>
    </MarketingShell>
  );
}
