import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, Clock, Close, ReceiptSlim } from '../icons';
import { link } from '../../routes';
import { WINDOWS, exploreUrl } from '../../search';
import { useLang } from '../../i18n';

const BENEFITS = [
  { Icon: Calendar, key: 'later.benefit1' },
  { Icon: ReceiptSlim, key: 'later.benefit2' },
  { Icon: Close, key: 'later.benefit3' },
] as const;

const FIELD = 'flex h-[54px] min-w-0 flex-[1_1_150px] items-center gap-[11px] rounded-well bg-panel px-[15px]';
const INPUT =
  'min-w-0 flex-1 border-0 bg-transparent text-[15.5px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30';

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The book-ahead explainer. The picker is real: date + window feed straight
 * into /explore?when=later with the slot in the URL (ARCHITECTURE §6: URL as
 * state). Booking beyond the 7-day sample horizon clamps to the last day.
 */
export default function BookAhead() {
  const { t } = useLang();
  // Clocks are impure; read them once per mount.
  const [todayIso] = useState(() => iso(new Date()));
  const [maxIso] = useState(() => iso(new Date(Date.now() + 30 * DAY_MS)));
  const [date, setDate] = useState(() => iso(new Date(Date.now() + DAY_MS)));
  const [win, setWin] = useState(2);

  const day = useMemo(() => {
    const offset = Math.round((new Date(date).getTime() - new Date(todayIso).getTime()) / DAY_MS);
    return Math.min(6, Math.max(0, offset));
  }, [date, todayIso]);

  return (
    <section id="later" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <h2 className="mb-[30px] text-h2 text-ink">{t('later.title')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-stretch gap-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center overflow-hidden rounded-card bg-brand-tint-strong">
            <div className="p-[clamp(26px,3vw,40px)]">
              <h3 className="mb-[26px] text-[clamp(22px,2.4vw,28px)] font-extrabold leading-[1.1] tracking-[-.03em] text-ink [text-wrap:balance]">
                {t('later.hold')}
              </h3>
              <div className="mb-3 text-label text-ink-80">{t('later.chooseDateTime')}</div>
              <div className="mb-5 flex flex-wrap gap-3">
                <div className={FIELD}>
                  <Calendar size={18} className="flex-none text-ink-60" />
                  <input
                    type="date"
                    value={date}
                    min={todayIso}
                    max={maxIso}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label={t('later.date')}
                    className={INPUT}
                  />
                </div>
                <div className={FIELD}>
                  <Clock size={18} className="flex-none text-ink-60" />
                  <select
                    value={win}
                    onChange={(e) => setWin(Number(e.target.value))}
                    aria-label={t('later.time')}
                    className={`${INPUT} appearance-none`}
                  >
                    {WINDOWS.map((w, i) => (
                      <option key={w} value={i}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="flex-none text-ink-40" />
                </div>
              </div>
              <Link
                to={exploreUrl({ when: 'later', day, win })}
                className="flex h-[52px] w-full max-w-[340px] items-center justify-center rounded-btn bg-ink text-[15px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
              >
                {t('later.next')}
              </Link>
            </div>
            <div className="min-h-[220px] self-stretch bg-[#c7d7f2]">
              <img
                src="https://images.pexels.com/photos/5484718/pexels-photo-5484718.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt=""
                loading="lazy"
                className="block h-full min-h-[220px] w-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-card bg-well p-[clamp(24px,2.6vw,32px)]">
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
              to={link('help')}
              className="mt-6 inline-block border-b border-[#c8d1e0] pb-[3px] text-[14.5px] font-bold text-ink transition hover:border-ink hover:text-ink"
            >
              {t('later.terms')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
