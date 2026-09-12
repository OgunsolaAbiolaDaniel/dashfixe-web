import { Link } from 'react-router-dom';
import { CalendarCheck, Receipt, Reroute, Wrench } from '../icons';
import { ROUTES, link, type Destination } from '../../routes';
import { useAuth } from '../../auth';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * "Explore what you can do" — every card's button says where it goes and lands
 * somewhere real (ARCHITECTURE.md §5): the product, its later mode, the price
 * rule on /how-it-works, or — for repeat jobs, which need an account — Activity
 * via log in.
 */
const CARDS: ReadonlyArray<{
  Icon: typeof Wrench;
  key: 'fixNow' | 'bookAhead' | 'estimate' | 'repeat';
  cta: StringKey;
  to: Destination | null;
}> = [
  { Icon: Wrench, key: 'fixNow', cta: 'how.cta', to: 'explore' },
  { Icon: CalendarCheck, key: 'bookAhead', cta: 'nav.bookAhead', to: 'book' },
  { Icon: Receipt, key: 'estimate', cta: 'explore.estimate.cta', to: 'priceRule' },
  { Icon: Reroute, key: 'repeat', cta: 'explore.repeat.cta', to: null },
];

const PILL =
  'mt-auto flex h-[46px] items-center self-start rounded-full bg-panel px-[22px] text-[15px] font-bold text-ink transition hover:bg-line hover:text-ink';

export default function Explore() {
  const { t } = useLang();
  const { requireAuth } = useAuth();
  return (
    <section id="explore" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(24px,3vw,40px)]">
        <h2 className="mb-[34px] text-h2 text-ink">{t('explore.title')}</h2>
        {/* 2 × 2 — four cards never leave an orphan on a row. */}
        <div className="grid gap-5 md:grid-cols-2">
          {CARDS.map(({ Icon, key, cta, to }) => (
            <article key={key} className="flex flex-col rounded-[20px] bg-well p-7">
              <div className="mb-[26px] flex items-start gap-5">
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2.5 text-h3 text-ink">{t(`explore.${key}.title` as const)}</h3>
                  <p className="max-w-[420px] text-[14.5px] font-medium leading-[1.55] text-ink-60 [text-wrap:pretty]">
                    {t(`explore.${key}.body` as const)}
                  </p>
                </div>
                <span className="grid h-[76px] w-[76px] flex-none place-items-center rounded-full bg-panel">
                  <Icon size={34} strokeWidth={1.6} className="text-brand" />
                </span>
              </div>
              {to ? (
                <Link to={link(to)} className={PILL}>
                  {t(cta)}
                </Link>
              ) : (
                <button type="button" onClick={() => requireAuth(ROUTES.activity)} className={PILL}>
                  {t(cta)}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
