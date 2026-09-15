import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Close, ReceiptSlim } from '../icons';
import Photo from '../shared/Photo';
import SlotPicker from '../shared/SlotPicker';
import { isTradeSlug, link } from '../../routes';
import { usePlace } from '../../lib/place';
import { exploreUrl, normalizeSlot } from '../../search';
import { useLang } from '../../i18n';

const BENEFITS = [
  { Icon: Calendar, key: 'later.benefit1' },
  { Icon: ReceiptSlim, key: 'later.benefit2' },
  { Icon: Close, key: 'later.benefit3' },
] as const;

/**
 * The book-ahead explainer. The picker is real (shared/SlotPicker): a day up to
 * 30 days ahead and a two-hour window feed straight into /explore?when=later
 * with the slot in the URL (ARCHITECTURE §6: URL as state).
 */
export default function BookAhead({ need = '', trade = '' }: { need?: string; trade?: string }) {
  const { t } = useLang();
  // The saved place (lib/place) and whatever was typed in the hero ride along.
  const place = usePlace();
  const what = need.trim();
  // Tomorrow, midday, unless the customer picks otherwise (up to 30 days ahead).
  const [slot, setSlot] = useState(() => normalizeSlot(1, 2));

  return (
    <section id="later" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <h2 className="mb-[30px] text-h2 text-ink">{t('later.title')}</h2>
        {/* The booking card gets the room to sit form-beside-photo; the benefits
            column is the narrow one, so neither side is left mostly empty. */}
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center overflow-hidden rounded-card bg-brand-tint-strong">
            <div className="p-[clamp(26px,3vw,40px)]">
              <h3 className="mb-[26px] text-[clamp(22px,2.4vw,28px)] font-extrabold leading-[1.1] tracking-[-.03em] text-ink [text-wrap:balance]">
                {t('later.hold')}
              </h3>
              <div className="mb-3 text-label text-ink-80">{t('later.chooseDateTime')}</div>
              <div className="mb-5">
                <SlotPicker
                  variant="hero"
                  dateId="later-date"
                  labels={[t('later.date'), t('later.time')]}
                  day={slot.day}
                  win={slot.win}
                  onChange={(day, win) => setSlot({ day, win })}
                />
              </div>
              {what && (
                <p className="mb-3 max-w-[340px] truncate text-[13.5px] font-semibold text-ink-80">
                  {t('later.for', { need: what })}
                  {isTradeSlug(trade) && ` · ${t(`trades.${trade}` as const)}`}
                </p>
              )}
              <Link
                to={exploreUrl({ when: 'later', ...slot, need: what, trade, address: place.label, lngLat: place.lngLat })}
                className="flex h-[52px] w-full max-w-[340px] items-center justify-center rounded-btn bg-ink text-[15px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
              >
                {t('later.next')}
              </Link>
            </div>
            <div className="min-h-[220px] self-stretch bg-[#c7d7f2]">
              <Photo id={5484718} alt="" className="block h-full min-h-[220px] w-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-card bg-well p-[clamp(24px,2.6vw,32px)]">
            <h3 className="mb-[18px] text-h3 text-ink">{t('later.benefits')}</h3>
            {BENEFITS.map(({ Icon, key }, i) => (
              <div
                key={key}
                className={
                  'flex gap-[15px] ' +
                  (i === 0 ? 'border-b border-[#dbe0ea] pb-5' : i === 1 ? 'border-b border-[#dbe0ea] py-5' : 'pt-5')
                }
              >
                <Icon size={21} strokeWidth={1.6} className="mt-0.5 flex-none text-ink" />
                <span className="text-[14.5px] font-semibold leading-[1.5] text-ink-80">{t(key)}</span>
              </div>
            ))}
            <Link
              to={link('cancellations')}
              className="mt-6 self-start border-b border-[#c8d1e0] pb-[3px] text-[14.5px] font-bold text-ink transition hover:border-ink hover:text-ink"
            >
              {t('later.terms')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
