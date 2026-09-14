import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock } from '../icons';
import { HORIZON_DAYS, WINDOWS, firstOpenWindow, windowOpen } from '../../search';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * The book-ahead slot: a day (a month calendar, 30 days ahead) and a two-hour
 * window (grouped morning / afternoon / evening). One component for the home's
 * "Plan it for later" card (`hero`) and /explore's later mode (`compact`), so the
 * two can never disagree about which slots exist.
 *
 * Desktop: a popover under the field. Phones: a bottom sheet, like the trade
 * picker. Rendered in a portal so no scrolling panel or rounded card clips it.
 * Days that can't be booked (past, beyond the horizon, today once it's over) and
 * windows that have passed are disabled — never silently clamped.
 */
type Variant = 'hero' | 'compact';

type Props = {
  day: number;
  win: number;
  onChange: (day: number, win: number) => void;
  variant: Variant;
  /** Accessible names for the two fields, e.g. ['Date', 'Time']. */
  labels: [string, string];
  /** id on the date field, so other controls can focus it. */
  dateId?: string;
};

const DAY_MS = 86_400_000;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const offsetOf = (d: Date, today: Date) => Math.round((d.getTime() - today.getTime()) / DAY_MS);

const GROUPS: ReadonlyArray<readonly [StringKey, readonly number[]]> = [
  ['slot.morning', [0, 1]],
  ['slot.afternoon', [2, 3]],
  ['slot.evening', [4, 5]],
];

export default function SlotPicker({ day, win, onChange, variant, labels, dateId }: Props) {
  const { t, lang } = useLang();
  // Clocks are impure; read once per mount.
  const [now] = useState(() => Date.now());
  const locale = lang === 'PT' ? 'pt-PT' : 'en-GB';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const dayText = (offset: number) => {
    if (offset === 0) return t('later.mode.today');
    if (offset === 1) return t('later.mode.tomorrow');
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(addDays(today, offset));
  };

  // A new day keeps the window if it's still open that day, else the first open one.
  const pickDay = (d: number) => {
    const at = new Date(now);
    onChange(d, windowOpen(d, win, at) ? win : firstOpenWindow(d, at));
  };

  return (
    <div className={variant === 'hero' ? 'flex flex-wrap gap-3' : 'flex gap-2.5'}>
      <Field variant={variant} Icon={Calendar} label={labels[0]} value={dayText(day)} id={dateId}>
        {(close) => (
          <MonthGrid
            day={day}
            now={now}
            today={today}
            locale={locale}
            dayText={dayText}
            onPick={(d) => {
              pickDay(d);
              close();
            }}
          />
        )}
      </Field>
      <Field variant={variant} Icon={Clock} label={labels[1]} value={WINDOWS[win] ?? WINDOWS[0]}>
        {(close) => (
          <div>
            <div className="flex flex-col gap-3.5">
              {GROUPS.map(([key, windows]) => (
                <div key={key}>
                  <p className="mb-1.5 text-label text-ink-40">{t(key)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {windows.map((i) => (
                      <WindowButton
                        key={i}
                        label={WINDOWS[i]!}
                        selected={i === win}
                        disabled={!windowOpen(day, i, new Date(now))}
                        onPick={() => {
                          onChange(day, i);
                          close();
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {day === 0 && <p className="mt-3 text-[12px] font-medium text-ink-40">{t('slot.todayNote')}</p>}
          </div>
        )}
      </Field>
    </div>
  );
}

/** The field: a button showing the value, opening its panel. */
function Field({
  variant,
  Icon,
  label,
  value,
  id,
  children,
}: {
  variant: Variant;
  Icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  id?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const valueId = useId();
  // Focus goes back to the field when the panel unmounts (see Popover).
  const close = () => setOpen(false);
  const hero = variant === 'hero';

  return (
    <div className={hero ? 'min-w-0 flex-[1_1_150px]' : 'min-w-0 flex-1'}>
      <span id={labelId} className={hero ? 'sr-only' : 'mb-1.5 block text-label text-ink-40'}>
        {label}
      </span>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => setOpen((o) => !o)}
        className={
          'flex w-full items-center font-semibold text-ink transition ' +
          (hero
            ? 'h-[54px] gap-[11px] rounded-well bg-panel px-[15px] text-[15.5px] hover:shadow-[inset_0_0_0_1.5px_#c8d4ea]'
            : 'h-11 gap-2 rounded-input border border-line bg-page px-[13px] text-[14px] hover:border-ink-30') +
          (open ? ' shadow-[inset_0_0_0_2px_#2563EB]' : '')
        }
      >
        <Icon size={hero ? 18 : 15} className="flex-none text-ink-60" />
        <span id={valueId} className="min-w-0 flex-1 truncate text-left">
          {value}
        </span>
        <ChevronDown size={15} className={'flex-none text-ink-40 transition ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <Popover anchor={trigger} label={label} onClose={close}>
          {children(close)}
        </Popover>
      )}
    </div>
  );
}

/** Positioned under (or over) its field on desktop; a bottom sheet on phones. */
function Popover({
  anchor,
  label,
  onClose,
  children,
}: {
  anchor: RefObject<HTMLButtonElement | null>;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [sheet] = useState(() => window.matchMedia?.('(max-width: 639px)').matches ?? false);
  // Picking, Escape: focus returns to the field. A click elsewhere: it stays there.
  const refocus = useRef(true);
  useEffect(() => {
    const field = anchor;
    const back = refocus;
    return () => {
      if (back.current) field.current?.focus();
    };
  }, [anchor]);

  // Placed straight on the DOM before paint (no state, no flicker), and kept
  // attached while the page or a panel scrolls.
  useLayoutEffect(() => {
    if (sheet) return;
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      const p = panel.current;
      if (!r || !p) return;
      const h = p.offsetHeight;
      const w = p.offsetWidth;
      const below = r.bottom + 8 + h <= window.innerHeight || r.top - 8 - h < 0;
      p.style.top = `${below ? r.bottom + 8 : r.top - 8 - h}px`;
      p.style.left = `${Math.min(Math.max(8, r.left), window.innerWidth - w - 8)}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor, sheet]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!panel.current?.contains(n) && !anchor.current?.contains(n)) {
        refocus.current = false;
        onClose();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [anchor, onClose]);

  return createPortal(
    <>
      {sheet && <div aria-hidden="true" className="fixed inset-0 z-[80] bg-ink/40" />}
      <div
        ref={panel}
        role="dialog"
        aria-label={label}
        className={
          sheet
            ? 'fixed inset-x-0 bottom-0 z-[81] rounded-t-hero bg-panel px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 shadow-hero'
            : 'fixed z-[81] w-[min(340px,calc(100vw-16px))] rounded-card border border-line-soft bg-panel p-4 shadow-hero'
        }
      >
        {sheet && (
          <>
            <span aria-hidden="true" className="mx-auto -mt-1.5 mb-3 block h-1 w-10 rounded-full bg-line" />
            <p aria-hidden="true" className="mb-3 text-[17px] font-extrabold tracking-[-.02em] text-ink">
              {label}
            </p>
          </>
        )}
        {children}
      </div>
    </>,
    document.body,
  );
}

/** A month at a time, Monday first; arrow keys move a day or a week. */
function MonthGrid({
  day,
  now,
  today,
  locale,
  dayText,
  onPick,
}: {
  day: number;
  now: number;
  today: Date;
  locale: string;
  dayText: (offset: number) => string;
  onPick: (day: number) => void;
}) {
  const { t } = useLang();
  const last = HORIZON_DAYS - 1;
  const minDay = firstOpenWindow(0, new Date(now)) >= 0 ? 0 : 1;
  const [focus, setFocus] = useState(Math.min(last, Math.max(minDay, day)));
  const grid = useRef<HTMLDivElement>(null);

  // The month on show follows the focused day.
  const f = addDays(today, focus);
  const y = f.getFullYear();
  const m = f.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const prevOk = offsetOf(new Date(y, m, 0), today) >= minDay;
  const nextOk = offsetOf(new Date(y, m + 1, 1), today) <= last;
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(f);
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  // Monday-first narrow weekday initials (2024-01-01 was a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)),
  );

  useEffect(() => {
    grid.current?.querySelector<HTMLButtonElement>(`[data-offset="${focus}"]`)?.focus();
  }, [focus]);

  const clamp = (o: number) => Math.min(last, Math.max(minDay, o));
  const onKey = (e: React.KeyboardEvent) => {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    if (step === undefined) return;
    e.preventDefault();
    setFocus((o) => clamp(o + step));
  };

  // Quick picks: today (if still open), tomorrow, and the coming Saturday.
  const saturday = (6 - today.getDay() + 7) % 7;
  const quick = [...(minDay === 0 ? [0] : []), 1, ...(saturday > 1 ? [saturday] : [])];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {quick.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === day}
            onClick={() => onPick(o)}
            className={
              'h-8 rounded-full px-3 text-[13px] font-bold transition ' +
              (o === day ? 'bg-ink text-white' : 'bg-well text-ink-80 hover:bg-line')
            }
          >
            {dayText(o)}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!prevOk}
          onClick={() => setFocus(clamp(offsetOf(new Date(y, m - 1, 1), today)))}
          aria-label={t('slot.prevMonth')}
          className="grid h-9 w-9 place-items-center rounded-[10px] text-ink-60 transition hover:bg-well disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={17} />
        </button>
        <p aria-live="polite" className="text-[15px] font-extrabold capitalize tracking-[-.01em] text-ink">
          {title}
        </p>
        <button
          type="button"
          disabled={!nextOk}
          onClick={() => setFocus(clamp(offsetOf(new Date(y, m + 1, 1), today)))}
          aria-label={t('slot.nextMonth')}
          className="grid h-9 w-9 place-items-center rounded-[10px] text-ink-60 transition hover:bg-well disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div aria-hidden="true" className="mb-1 grid grid-cols-7 text-center text-[11.5px] font-bold uppercase text-ink-40">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div ref={grid} role="group" aria-label={title} onKeyDown={onKey} className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(y, m, i + 1);
          const o = offsetOf(date, today);
          const ok = o >= minDay && o <= last;
          const selected = o === day;
          return (
            <button
              key={i}
              type="button"
              data-offset={o}
              tabIndex={o === focus ? 0 : -1}
              disabled={!ok}
              aria-pressed={selected}
              aria-current={o === 0 ? 'date' : undefined}
              aria-label={full.format(date)}
              onClick={() => onPick(o)}
              className={
                'relative grid h-10 place-items-center rounded-[11px] text-[14px] font-bold transition ' +
                (selected
                  ? 'bg-brand text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,.7)]'
                  : ok
                    ? 'text-ink hover:bg-brand-tint'
                    : 'cursor-default font-semibold text-ink-30')
              }
            >
              {i + 1}
              {o === 0 && <span aria-hidden="true" className="absolute bottom-1.5 h-1 w-1 rounded-full bg-current" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] font-medium text-ink-40">{t('slot.horizon')}</p>
    </div>
  );
}

/** One two-hour window; the chosen one takes focus when the panel opens. */
function WindowButton({
  label,
  selected,
  disabled,
  onPick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selected) ref.current?.focus();
  }, [selected]);
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onPick}
      className={
        'h-11 rounded-[12px] text-[14px] font-bold tabular-nums transition ' +
        (selected
          ? 'bg-brand text-white'
          : disabled
            ? 'cursor-default bg-page text-ink-30 line-through'
            : 'border border-line bg-panel text-ink hover:border-brand hover:bg-brand-tint')
      }
    >
      {label}
    </button>
  );
}
