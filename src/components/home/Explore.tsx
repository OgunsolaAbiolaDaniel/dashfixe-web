import { Link } from 'react-router-dom';
import { CalendarCheck, Receipt, Reroute, Wrench } from '../icons';
import { link, type Destination } from '../../routes';
import { useLang } from '../../i18n';

/**
 * "Explore what you can do" — every card's CTA lands somewhere real
 * (ARCHITECTURE.md §5): the product, its later mode, or the help page.
 * Only "repeat a job" needs an account, so only it gates on auth.
 */
const CARDS: ReadonlyArray<{
  Icon: typeof Wrench;
  key: 'fixNow' | 'bookAhead' | 'estimate' | 'repeat';
  to: Destination | null;
}> = [
  { Icon: Wrench, key: 'fixNow', to: 'explore' },
  { Icon: CalendarCheck, key: 'bookAhead', to: 'book' },
  { Icon: Receipt, key: 'estimate', to: 'help' },
  { Icon: Reroute, key: 'repeat', to: null },
];

const PILL =
  'mt-auto flex h-[46px] items-center self-start rounded-full bg-panel px-[22px] text-[15px] font-bold text-ink transition hover:bg-line hover:text-ink';

export default function Explore({ onAuth }: { onAuth: () => void }) {
  const { t } = useLang();
  return (
    <section id="explore" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(24px,3vw,40px)]">
        <h2 className="mb-[34px] text-h2 text-ink">{t('explore.title')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          {CARDS.map(({ Icon, key, to }) => (
            <article key={key} className="flex flex-col rounded-[20px] bg-well p-7">
              <div className="mb-[26px] flex items-start gap-5">
                <div className="min-w-0">
                  <h3 className="mb-2.5 text-h3 text-ink">{t(`explore.${key}.title` as const)}</h3>
                  <p className="text-[14.5px] font-medium leading-[1.55] text-ink-60 [text-wrap:pretty]">
                    {t(`explore.${key}.body` as const)}
                  </p>
                </div>
                <span className="grid h-[76px] w-[76px] flex-none place-items-center rounded-full bg-panel">
                  <Icon size={34} strokeWidth={1.6} className="text-brand" />
                </span>
              </div>
              {to ? (
                <Link to={link(to)} className={PILL}>
                  {t('explore.details')}
                </Link>
              ) : (
                <button type="button" onClick={onAuth} className={PILL}>
                  {t('explore.details')}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
