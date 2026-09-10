import { Link } from 'react-router-dom';
import { Bolt, Plus, Roller, Saw, Spray, Wrench } from '../icons';
import { exploreUrl } from '../../search';
import { useLang } from '../../i18n';

const TRADES = [
  { Icon: Wrench, slug: 'plumbing' },
  { Icon: Bolt, slug: 'electrical' },
  { Icon: Roller, slug: 'painting' },
  { Icon: Saw, slug: 'carpentry' },
  { Icon: Spray, slug: 'cleaning' },
  { Icon: Plus, slug: 'other' },
] as const;

export default function Trades() {
  const { t } = useLang();
  return (
    <section id="trades" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="mb-7 flex flex-wrap items-end gap-5">
          <h2 className="mr-auto text-h2 text-ink">{t('trades.title')}</h2>
          <span className="text-[14.5px] font-semibold text-ink-60">{t('trades.sub')}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3.5">
          {TRADES.map(({ Icon, slug }) => (
            <Link
              key={slug}
              to={exploreUrl({ trade: slug })}
              className="block rounded-[18px] bg-well p-[22px] text-left transition hover:bg-line hover:text-ink"
            >
              <span className="mb-[18px] grid h-11 w-11 place-items-center rounded-full bg-panel">
                <Icon size={21} strokeWidth={1.6} className="text-brand" />
              </span>
              <span className="block text-[16.5px] font-bold tracking-[-.015em] text-ink">
                {t(`trades.${slug}` as const)}
              </span>
              <span className="mt-1 block text-sm font-semibold text-ink-60">{t(`trades.${slug}.hint` as const)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
