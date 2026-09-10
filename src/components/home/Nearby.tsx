/**
 * Illustrative supply. The design labels this "Sample data" on purpose —
 * no real artisans are recruited yet, so the badge must stay.
 *
 * Distances and arrival times are worked out from the sample address, the same
 * way /explore does it, so the two pages never disagree.
 */
import { Link } from 'react-router-dom';
import { exploreUrl } from '../../search';
import { getNearby } from '../explore/artisans';
import { useLang } from '../../i18n';

export default function Nearby() {
  const { t } = useLang();
  const pros = getNearby();

  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="mb-7 flex flex-wrap items-end gap-4">
          <h2 className="mr-auto text-h2 text-ink">{t('nearby.title')}</h2>
          <span className="rounded-full bg-warning-tint px-3 py-1.5 text-[11.5px] font-extrabold uppercase tracking-[.06em] text-warning">
            {t('nearby.sample')}
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
          {pros.map((p) => (
            <Link
              key={p.id}
              // Listed artisans open pre-selected; the rest open the search for their trade.
              to={p.listed ? exploreUrl({ artisan: p.id }) : exploreUrl({ trade: p.trade })}
              className="block rounded-[20px] bg-well p-6 text-left transition hover:bg-line hover:text-ink"
            >
              <span className="mb-[18px] flex items-center gap-[13px]">
                <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full bg-panel text-[15px] font-extrabold text-brand">
                  {p.initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-bold text-ink">{p.name}</span>
                  <span className="mt-0.5 block text-sm font-semibold text-ink-60">
                    {`${t(`trades.${p.trade}` as const)} · ${t('nearby.km', { km: p.km })}`}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-3 border-t border-[#dbe0ea] pt-4">
                {p.free ? (
                  <span className="mr-auto flex items-center gap-[7px] text-sm font-bold text-success">
                    <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success text-success" />
                    {`${t('nearby.available')} · ${t('nearby.minAway', { min: p.eta })}`}
                  </span>
                ) : (
                  <span className="mr-auto flex items-center gap-[7px] text-sm font-bold text-ink-60">
                    <span className="block h-[7px] w-[7px] flex-none rounded-full bg-ink-30" />
                    {t('nearby.from', { time: p.from ?? '' })}
                  </span>
                )}
                <span className="flex-none text-[17px] font-extrabold tracking-[-.02em] text-ink">{p.price}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
