import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SlotPicker from '../shared/SlotPicker';
import { Calendar, Chat, ChevronRight, Close, Shield } from '../icons';
import { cancelJob, daysUntil, formatDate, reportOnJob, rescheduleJob, type Job } from '../../lib/jobs';
import { refundCredit } from '../../lib/wallet';
import { api } from '../../lib/api';
import { WINDOWS, normalizeSlot } from '../../search';
import { link } from '../../routes';
import { useAuth } from '../../auth';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * "Need help with this job?" — on /job/:id, live or done (rev 2.9).
 *
 * - Booked ahead (not set off): change the time (the same SlotPicker as booking)
 *   or cancel, which is free and gives back any Dashfixe credit used.
 * - On the way: the time can't change here; message the artisan instead.
 * - Always: report a problem. That one is real — it goes to the team through
 *   POST /api/support/report with the customer's phone, and shows up on /ops.
 *
 * Inline, not a modal: the slot picker's own popover and sheet must sit on top.
 */
const CATEGORIES = ['late', 'price', 'quality', 'damage', 'safety', 'other'] as const;
type Category = (typeof CATEGORIES)[number];
type View = 'menu' | 'reschedule' | 'cancel' | 'report';

const CARD = 'rounded-card border border-line-soft bg-panel p-[18px]';
const PRIMARY = 'flex h-11 items-center justify-center rounded-[13px] bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60';
const SECONDARY = 'flex h-11 items-center justify-center rounded-[13px] border border-line bg-panel px-5 text-[14.5px] font-bold text-ink transition hover:bg-page';
const H2 = 'mb-1 text-[16px] font-extrabold tracking-[-.01em] text-ink';
const HINT = 'text-[13px] font-medium leading-[1.5] text-ink-60';

function Row({ icon, title, hint, onClick }: { icon: ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-[14px] border border-line-soft bg-page px-3.5 py-3 text-left transition hover:border-line">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-panel text-ink-80">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold text-ink">{title}</span>
        <span className={`block ${HINT}`}>{hint}</span>
      </span>
      <ChevronRight size={16} className="flex-none text-ink-40" />
    </button>
  );
}

export default function JobHelp({ job, onMessage }: { job: Job; onMessage?: () => void }) {
  const { t } = useLang();
  const titleId = useId();
  const [view, setView] = useState<View>('menu');
  const [notice, setNotice] = useState<string | null>(null);
  const first = job.artisanName.split(' ')[0]!;

  const open = (next: View) => {
    setNotice(null);
    setView(next);
  };
  const back = (message: string | null = null) => {
    setNotice(message);
    setView('menu');
  };

  if (view === 'reschedule') return <Reschedule job={job} onDone={back} />;
  if (view === 'cancel') return <Cancel job={job} first={first} onBack={() => back()} />;
  if (view === 'report') return <Report job={job} onDone={back} />;

  const booked = job.status === 'agreed';
  const onTheWay = job.status === 'travelling' || job.status === 'working';

  return (
    <section aria-labelledby={titleId} className={CARD}>
      <h2 id={titleId} className={`${H2} mb-3`}>
        {t('jobhelp.title')}
      </h2>
      {notice ? (
        <p role="status" className="mb-3 rounded-[12px] bg-success-tint px-3.5 py-2.5 text-[13.5px] font-semibold text-success">
          {notice}
        </p>
      ) : (
        job.report && (
          <p className="mb-3 rounded-[12px] bg-brand-tint px-3.5 py-2.5 text-[13.5px] font-semibold text-brand-hover">
            {t('jobhelp.reported', { ref: job.report.reference })}
          </p>
        )
      )}
      <div className="flex flex-col gap-2">
        {booked && (
          <>
            <Row icon={<Calendar size={17} />} title={t('jobhelp.reschedule')} hint={t('jobhelp.rescheduleHint')} onClick={() => open('reschedule')} />
            <Row icon={<Close size={16} />} title={t('jobhelp.cancel')} hint={t('job.cancelNote', { name: first })} onClick={() => open('cancel')} />
          </>
        )}
        {onTheWay && (
          <div className="rounded-[14px] bg-page px-3.5 py-3">
            <p className={HINT}>
              {t('jobhelp.onTheWay', { name: first })} {t('job.cancelNote', { name: first })}
            </p>
            {onMessage && (
              <button type="button" onClick={onMessage} className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-bold text-brand transition hover:text-brand-hover">
                <Chat size={15} />
                {t('jobhelp.message', { name: first })}
              </button>
            )}
          </div>
        )}
        <Row icon={<Shield size={16} />} title={t('jobhelp.report')} hint={t('jobhelp.reportHint')} onClick={() => open('report')} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        <Link to={link('help')} className="text-[13.5px] font-bold text-brand transition hover:text-brand-hover">
          {t('job.help')}
        </Link>
        <Link to={link('safety')} className="text-[13.5px] font-bold text-brand transition hover:text-brand-hover">
          {t('jobhelp.safety')}
        </Link>
      </div>
    </section>
  );
}

function Reschedule({ job, onDone }: { job: Job; onDone: (message: string | null) => void }) {
  const { t, lang } = useLang();
  // Clocks are impure; read once per mount (as SlotPicker does).
  const [now] = useState(() => new Date());
  const current = { day: daysUntil(job.date, now), window: job.slot?.window };
  const [slot, setSlot] = useState(() =>
    normalizeSlot(Math.max(0, current.day), Math.max(0, WINDOWS.indexOf(current.window as (typeof WINDOWS)[number])), now),
  );
  const [same, setSame] = useState(false);

  const save = () => {
    const window = WINDOWS[slot.win]!;
    if (slot.day === current.day && window === current.window) return setSame(true);
    const moved = rescheduleJob(job.id, slot.day, window, now);
    onDone(moved ? t('jobhelp.moved', { when: `${formatDate(moved.date, lang)} · ${window}` }) : null);
  };

  return (
    <section className={CARD}>
      <h2 className={H2}>{t('jobhelp.reschedule')}</h2>
      <p className={`mb-4 ${HINT}`}>{t('jobhelp.rescheduleHint')}</p>
      <SlotPicker
        variant="compact"
        labels={[t('later.mode.day'), t('later.mode.window')]}
        day={slot.day}
        win={slot.win}
        onChange={(day, win) => {
          setSame(false);
          setSlot({ day, win });
        }}
      />
      {same && (
        <p role="status" className="mt-3 text-[13px] font-semibold text-ink-60">
          {t('jobhelp.same')}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={save} className={`${PRIMARY} flex-1`}>
          {t('jobhelp.save')}
        </button>
        <button type="button" onClick={() => onDone(null)} className={SECONDARY}>
          {t('jobhelp.back')}
        </button>
      </div>
    </section>
  );
}

function Cancel({ job, first, onBack }: { job: Job; first: string; onBack: () => void }) {
  const { t } = useLang();
  const usedCredit = job.lines.some((line) => line.amount < 0);
  return (
    <section className={CARD}>
      <h2 className={H2}>{t('jobhelp.cancelTitle', { name: first })}</h2>
      <p className={HINT}>
        {t('jobhelp.cancelBody', { name: first })}
        {usedCredit && ` ${t('jobhelp.cancelCredit')}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          // The page leaves for Activity as soon as the job is cancelled.
          onClick={() => cancelJob(job.id) && refundCredit(job.id)}
          className="flex h-11 flex-1 items-center justify-center rounded-[13px] bg-ink px-5 text-[14.5px] font-bold text-white transition hover:bg-ink-80"
        >
          {t('jobhelp.cancelYes')}
        </button>
        <button type="button" onClick={onBack} className={SECONDARY}>
          {t('jobhelp.keep')}
        </button>
      </div>
    </section>
  );
}

function Report({ job, onDone }: { job: Job; onDone: (message: string | null) => void }) {
  const { t } = useLang();
  const { phone } = useAuth();
  const ids = useId();
  const [category, setCategory] = useState<Category | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!category) return setError('jobhelp.pick');
    if (category === 'other' && !details.trim()) return setError('jobhelp.needDetails');
    setBusy(true);
    setError(null);
    const r = await api<{ reference: string }>('/api/support/report', { jobId: job.id, category, details: details.trim() || null });
    setBusy(false);
    if (!r.ok) return setError(r.status === 401 ? 'jobhelp.errSession' : 'jobhelp.err');
    reportOnJob(job.id, { reference: r.data.reference, category, at: new Date().toISOString() });
    onDone(t('jobhelp.sent', { ref: r.data.reference }));
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={CARD} noValidate>
      <h2 className={`${H2} mb-3`}>{t('jobhelp.report')}</h2>
      <fieldset>
        <legend className="mb-2 text-label text-ink-40">{t('jobhelp.what')}</legend>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name={`${ids}-category`}
                checked={category === c}
                onChange={() => {
                  setCategory(c);
                  setError(null);
                }}
                className="peer sr-only"
              />
              <span className="block rounded-[12px] border border-line-soft bg-page px-3.5 py-2.5 text-[14px] font-semibold text-ink-80 transition hover:border-line peer-checked:border-brand peer-checked:bg-brand-tint peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                {t(`report.cat.${c}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {category === 'safety' && (
        <p role="note" className="mt-3 rounded-[12px] bg-warning-tint px-3.5 py-2.5 text-[13.5px] font-bold text-warning">
          {t('jobhelp.urgent')}
        </p>
      )}

      <label htmlFor={`${ids}-details`} className="mb-1.5 mt-4 block text-label text-ink-40">
        {t(category === 'other' ? 'jobhelp.details' : 'jobhelp.detailsOptional')}
      </label>
      <textarea
        id={`${ids}-details`}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        rows={3}
        className="block w-full resize-y rounded-input border border-line bg-page px-3.5 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-brand"
      />
      <p className={`mt-2 ${HINT}`}>{t('jobhelp.callback', { phone: phone ?? '' })}</p>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-semibold text-warning">
          {t(error)}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={`${PRIMARY} flex-1`}>
          {t('jobhelp.send')}
        </button>
        <button type="button" onClick={() => onDone(null)} className={SECONDARY}>
          {t('jobhelp.back')}
        </button>
      </div>
    </form>
  );
}
