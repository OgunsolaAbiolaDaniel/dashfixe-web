import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronDown, ClockSmall, Star, Verified } from '../icons';
import AddressField from '../shared/AddressField';
import type { Place } from '../../lib/geocode';
import { artisanUrl } from '../../routes';
import { AVAILABLE_COUNT, TOTAL_ONLINE, type Artisan, type Supply } from './artisans';
import { DEFAULT_ADDRESS, TRADES, WINDOWS, priceFrom, type Search, type When } from '../../search';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

type Props = {
  search: Search;
  /** The sample supply as seen from the customer's address. */
  supply: Supply;
  onWhen: (when: When) => void;
  /** Later mode: the chosen slot, written back into the URL. */
  onSlot: (day: number, win: number) => void;
  onSort: () => void;
  onNeed: (need: string) => void;
  onPlace: (place: Place) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onChat: (id: string) => void;
};

/** Sample badges are stored in English; show them in the reader's language. */
const BADGE_KEYS: Record<string, StringKey> = {
  'ID verified': 'badge.idVerified',
  Insured: 'badge.insured',
  Certified: 'badge.certified',
};

function ArtisanCard({
  a,
  selected,
  onSelect,
  onChat,
}: {
  a: Artisan;
  selected: boolean;
  onSelect: () => void;
  onChat: () => void;
}) {
  const { t } = useLang();
  return (
    <article
      onClick={onSelect}
      className={
        'cursor-pointer rounded-card bg-panel p-4 transition ' +
        (selected ? 'border-[1.5px] border-brand shadow-selected' : 'border border-line-soft hover:border-line')
      }
    >
      <div className="flex items-start gap-[13px]">
        <span className="grid h-[50px] w-[50px] flex-none place-items-center rounded-[17px] bg-avatar text-sm font-extrabold text-brand">
          {a.initials}
        </span>
        <span className="mr-auto min-w-0">
          <span className="flex items-center gap-1.5">
            <Link
              to={artisanUrl(a.id)}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-[17.5px] font-bold tracking-[-.01em] text-ink transition hover:text-brand"
            >
              {a.name}
            </Link>
            {a.verified && <Verified size={15} className="flex-none text-brand" />}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-60">
            <Star size={12} className="flex-none text-star" />
            {`${a.rating} · ${a.jobs} ${t('search.jobs')} · ${a.km} km`}
          </span>
        </span>
        <span className="flex-none text-right">
          <span className="block text-[19px] font-extrabold tracking-[-.02em] text-ink">{a.price}</span>
          <span className="mt-px block text-[11.5px] text-ink-40">{t('search.estimated')}</span>
        </span>
      </div>

      {a.badges && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.badges.map((b) => {
            const key = BADGE_KEYS[b];
            return (
              <span key={b} className="rounded-full bg-brand-tint px-[11px] py-1.5 text-xs font-semibold text-brand-hover">
                {key ? t(key) : b}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-[11px] border-t border-line-rule pt-[13px]">
        <span
          className={'mr-auto flex items-center gap-1.5 text-[13.5px] font-bold ' + (selected ? 'text-brand' : 'text-ink-60')}
        >
          <ClockSmall size={14} />
          {t('nearby.minAway', { min: a.eta })}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
          className={
            'rounded-[13px] px-5 py-[11px] text-[14.5px] font-bold transition ' +
            (selected ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-brand-tint text-brand-hover hover:bg-brand-tint-hover')
          }
        >
          {selected ? t('search.chatWith', { name: a.name.split(' ')[0]! }) : t('search.chat')}
        </button>
      </div>
    </article>
  );
}

export default function SearchPanel({ search, supply, onWhen, onSlot, onSort, onNeed, onPlace, selectedId, onSelect, onChat }: Props) {
  const { t } = useLang();
  const trade = TRADES.find((x) => x.slug === search.trade)?.slug;
  const needPlaceholder = trade ? t(`trades.${trade}` as const) : t('hero.needPlaceholder');
  const [needDraft, setNeedDraft] = useState(search.need);
  const [addressDraft, setAddressDraft] = useState(search.address || DEFAULT_ADDRESS);
  const listed =
    search.sort === 'price'
      ? [...supply.available].sort((a, b) => priceFrom(a.price) - priceFrom(b.price))
      : supply.available;

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto border-r border-line-soft bg-page p-[26px] [&>*]:shrink-0">
      <div>
        <div className="mb-3.5 flex w-fit items-center gap-2 rounded-full bg-brand-tint px-3.5 py-2">
          {/* A still dot, not a pulse: the pilot area is real, live supply is not yet. */}
          <span className="block h-[7px] w-[7px] rounded-full bg-brand" />
          <span className="text-[12.5px] font-bold text-brand-hover">{t('search.live')}</span>
        </div>
        <h1 className="mb-2 max-w-[7em] text-[30px] font-extrabold leading-[1.06] tracking-[-.035em] text-ink [text-wrap:balance]">
          {t('search.title')}
        </h1>
        <p className="text-[14.5px] leading-[1.5] text-ink-60">{t('search.intro')}</p>
      </div>

      <div className="flex gap-px overflow-hidden rounded-[20px] border border-[#e6ebf3] bg-[#e6ebf3]">
        {[
          { v: String(TOTAL_ONLINE), unit: '', label: t('search.online') },
          { v: String(supply.medianEta), unit: ' min', label: t('search.median') },
          { v: '4.8', unit: '', label: t('search.rating') },
        ].map((s) => (
          <span key={s.label} className="flex-1 bg-panel px-3 py-3.5 text-center">
            <span className="block text-[21px] font-extrabold tracking-[-.02em] text-ink">
              {s.v}
              {s.unit && <span className="text-[13px]">{s.unit}</span>}
            </span>
            <span className="mt-0.5 block text-[11.5px] font-semibold text-ink-40">{s.label}</span>
          </span>
        ))}
      </div>

      <div className="rounded-card border border-line-soft bg-panel p-[18px]">
        <div className="mb-[11px] text-label text-ink-40">{t('search.what')}</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNeed(needDraft);
          }}
          className="mb-2.5 flex w-full items-center gap-3 rounded-input border border-line bg-page px-[15px] py-3"
        >
          <Camera size={18} className="flex-none text-brand" />
          <input
            type="text"
            value={needDraft}
            onChange={(e) => setNeedDraft(e.target.value)}
            onBlur={() => onNeed(needDraft)}
            placeholder={needPlaceholder}
            aria-label={t('hero.needLabel')}
            className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] font-bold text-ink outline-offset-8 placeholder:text-ink-40"
          />
        </form>
        <AddressField
          className="mb-3"
          variant="input"
          value={addressDraft}
          onChange={setAddressDraft}
          onPlace={onPlace}
        />
        <div className="flex gap-2 rounded-well bg-well p-1">
          {(['now', 'later'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onWhen(v)}
              className={
                'flex-1 rounded-[10px] p-2.5 text-center text-sm transition ' +
                (search.when === v ? 'bg-panel font-bold text-ink shadow-card' : 'font-semibold text-ink-40 hover:text-ink-60')
              }
            >
              {v === 'now' ? t('search.now') : t('search.later')}
            </button>
          ))}
        </div>

        {search.when === 'later' && <LaterPicker day={search.day ?? 0} win={search.win ?? 2} onSlot={onSlot} />}
      </div>

      <div className="-mb-2 flex items-baseline">
        <span className="mr-auto text-label text-ink-40">
          {t('search.available', { n: AVAILABLE_COUNT, total: TOTAL_ONLINE })}
        </span>
        <button type="button" onClick={onSort} className="text-[13px] font-bold text-brand">
          {search.sort === 'price' ? t('search.sortPrice') : t('search.sortArrival')}
        </button>
      </div>

      <div className="flex flex-col gap-[11px]">
        {listed.map((a) => (
          <ArtisanCard
            key={a.id}
            a={a}
            selected={a.id === selectedId}
            onSelect={() => onSelect(a.id)}
            onChat={() => onChat(a.id)}
          />
        ))}
      </div>

      <p className="text-[12.5px] leading-[1.5] text-ink-40">{t('search.disclaimer')}</p>
    </div>
  );
}

/**
 * The book-for-later mode — a day and a two-hour window, held locally until the
 * booking flow lands in Phase 4 (then it moves into the URL like everything else).
 */


function LaterPicker({ day, win, onSlot }: { day: number; win: number; onSlot: (day: number, win: number) => void }) {
  const { t, lang } = useLang();

  const fmt = new Intl.DateTimeFormat(lang === 'PT' ? 'pt-PT' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const dayLabel = (offset: number) => {
    if (offset === 0) return t('later.mode.today');
    if (offset === 1) return t('later.mode.tomorrow');
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return fmt.format(d);
  };

  const SELECT =
    'h-11 w-full appearance-none rounded-input border border-line bg-page px-[13px] pr-9 text-[14px] font-semibold text-ink';

  return (
    <div className="mt-3 border-t border-line-rule pt-3.5">
      <div className="mb-1.5 text-[14px] font-bold text-ink">{t('later.mode.title')}</div>
      <p className="mb-3 text-[12.5px] font-medium leading-[1.5] text-ink-60">{t('later.mode.intro')}</p>
      <div className="flex gap-2.5">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-label text-ink-40">{t('later.mode.day')}</span>
          <span className="relative block">
            <select value={day} onChange={(e) => onSlot(Number(e.target.value), win)} className={SELECT}>
              {Array.from({ length: 7 }, (_, i) => (
                <option key={i} value={i}>
                  {dayLabel(i)}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-40" />
          </span>
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-label text-ink-40">{t('later.mode.window')}</span>
          <span className="relative block">
            <select value={win} onChange={(e) => onSlot(day, Number(e.target.value))} className={SELECT}>
              {WINDOWS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-40" />
          </span>
        </label>
      </div>
    </div>
  );
}
