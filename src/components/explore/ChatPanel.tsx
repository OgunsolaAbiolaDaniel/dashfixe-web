import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Close, ImageIcon, Send } from '../icons';
import { useLang } from '../../i18n';
import { artisanUrl, jobUrl } from '../../routes';
import { formatEuro } from '../../lib/jobs';
import { estimateFor, type Estimate } from '../../lib/estimate';
import { getThread, saveThread, type Msg, type Thread } from './chatStore';
import type { Artisan } from './artisans';
import type { StringKey } from '../../i18n/strings';

type Props = {
  artisan: Artisan;
  /** The address the job is for — shown in the context strip. */
  address: string;
  /** What the customer typed in the search; pre-fills the first message. */
  need?: string;
  /** `quote`: from first message to an approved estimate. `job`: an agreed job. */
  mode?: 'quote' | 'job';
  /** Booking ahead (a slot) rather than now — changes the confirm copy. */
  later?: boolean;
  /** Book the job; returns its id for the "Track" link. */
  onApprove?: (estimate: Estimate) => string;
  onClose: () => void;
};

/** Suggested questions, each with the artisan's scripted answer. */
const QUICK: ReadonlyArray<{ q: StringKey; a: StringKey }> = [
  { q: 'chat.q.when', a: 'chat.a.when' },
  { q: 'chat.q.parts', a: 'chat.a.parts' },
  { q: 'chat.q.price', a: 'chat.a.price' },
];

const REPLY_MS = 1100;
const THEM =
  'max-w-[86%] self-start rounded-[16px_16px_16px_4px] bg-well px-3.5 py-[11px] text-sm leading-[1.45] text-ink [overflow-wrap:anywhere]';
const ME =
  'max-w-[86%] self-end rounded-[16px_16px_4px_16px] bg-brand px-3.5 py-[11px] text-sm leading-[1.45] text-white [overflow-wrap:anywhere]';
const NOTE = 'max-w-[92%] self-center rounded-full bg-page px-3 py-1 text-center text-[11.5px] font-semibold text-ink-40';

/**
 * The chat — where a search becomes a job (ARCHITECTURE.md §3: the commit point).
 *
 * The flow is the product's price rule, step by step: the artisan asks what's
 * wrong → the customer describes it (text or photo) → an itemised estimate
 * arrives → Approve → confirm → booked, with a link to track them. Quick
 * questions cover what people ask before approving.
 *
 * Replies are scripted (sample artisans, no chat backend yet) and the header
 * says so. Desktop: docked over the map. Phone: a full-screen sheet.
 * Mount with key={artisan.id}.
 */
export default function ChatPanel({ artisan, address, need = '', mode = 'quote', later = false, onApprove, onClose }: Props) {
  const { t, lang } = useLang();
  const first = artisan.name.split(' ')[0]!;
  const estimate = useMemo(() => estimateFor(artisan), [artisan]);

  const [thread, setThread] = useState<Thread>(() => getThread(artisan.id, mode === 'job' ? estimate.total : null));
  const [draft, setDraft] = useState(() => (mode === 'quote' && thread.stage === 'new' ? need : ''));
  const [typing, setTyping] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timers = useRef<number[]>([]);
  const threadEl = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => saveThread(artisan.id, thread), [artisan.id, thread]);
  useEffect(() => {
    threadEl.current?.scrollTo?.({ top: threadEl.current.scrollHeight, behavior: 'smooth' });
  }, [thread, typing]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const push = useCallback((m: Msg, patch?: Partial<Thread>) => {
    setThread((th) => ({ ...th, ...patch, msgs: [...th.msgs, m] }));
  }, []);

  /**
   * The artisan answers: a typing beat, then each message in turn. Every state
   * change happens in a timer (never synchronously), so it is safe to start
   * from an effect. Returns a cancel for the effect's cleanup.
   */
  const replyWith = useCallback(
    (msgs: Msg[], patch?: Partial<Thread>, delay = REPLY_MS) => {
      const ids = [window.setTimeout(() => setTyping(true), 120)];
      msgs.forEach((m, i) => {
        ids.push(
          window.setTimeout(() => {
            if (i === msgs.length - 1) setTyping(false);
            push(m, i === msgs.length - 1 ? patch : undefined);
          }, delay * (i + 1)),
        );
      });
      timers.current.push(...ids);
      return () => ids.forEach(clearTimeout);
    },
    [push],
  );

  // First open of a quote: the artisan opens the conversation.
  useEffect(() => {
    if (mode !== 'quote' || thread.greeted) return;
    return replyWith([{ from: 'them', key: 'chat.hello' }], { greeted: true }, 700);
  }, [mode, thread.greeted, replyWith]);

  const answer = (text: string) => {
    if (mode === 'job' || thread.stage === 'approved') {
      replyWith([{ from: 'them', key: 'chat.reply' }]);
    } else if (thread.stage === 'new') {
      setThread((th) => ({ ...th, stage: 'quoting' }));
      replyWith([{ from: 'them', key: 'chat.gotIt' }, { from: 'estimate' }], { stage: 'quoted' });
    } else if (thread.stage === 'quoted') {
      const quick = QUICK.find((x) => t(x.q) === text);
      const key: StringKey = quick ? (quick.a === 'chat.a.when' && later ? 'chat.a.whenLater' : quick.a) : 'chat.a.any';
      replyWith([{ from: 'them', key }]);
    }
    // quoting: the estimate is already on its way — no extra reply.
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    push({ from: 'me', text });
    setDraft('');
    answer(text);
  };

  const sendPhoto = (file: File) => {
    push({ from: 'me', img: URL.createObjectURL(file) });
    answer('');
  };

  const confirm = () => {
    const jobId = onApprove?.(estimate);
    setConfirming(false);
    push(jobId ? { from: 'booked', jobId } : { from: 'them', key: 'chat.confirmed' }, { stage: 'approved', jobId });
    if (jobId) replyWith([{ from: 'them', key: 'chat.confirmed' }]);
  };

  const vars = { name: first, eta: artisan.eta };

  return (
    <div
      role="dialog"
      aria-label={t('chat.title', { name: first })}
      className="fixed inset-0 z-[90] flex flex-col bg-panel lg:absolute lg:inset-auto lg:bottom-6 lg:right-6 lg:max-h-[calc(100%-48px)] lg:w-[400px] lg:max-w-[calc(100%-48px)] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-line-soft lg:shadow-panel"
    >
      {/* Identity */}
      <div className="flex items-center gap-[11px] border-b border-line-rule px-4 py-3.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-avatar text-[12.5px] font-extrabold text-brand">
          {artisan.initials}
        </span>
        <span className="mr-auto min-w-0">
          <Link to={artisanUrl(artisan.id)} className="block truncate text-[15.5px] font-bold text-ink hover:text-brand">
            {artisan.name}
          </Link>
          <span className="mt-px block truncate text-xs font-semibold text-ink-40">{t('chat.sampleStatus')}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('chat.close')}
          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-well transition hover:bg-line"
        >
          <Close size={16} className="text-ink-60" />
        </button>
      </div>

      {/* Job context */}
      <div className="flex items-center gap-[9px] border-b border-line-rule bg-page px-4 py-2.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[.11em] text-ink-40">{t('chat.job')}</span>
        <span className="mr-auto truncate text-[12.5px] font-semibold text-ink-80">
          {t(`trades.${artisan.trade}` as const)} · {address}
        </span>
        <span className="flex-none rounded-full bg-brand-tint px-[11px] py-1.5 text-xs font-bold text-brand-hover">
          {thread.stage === 'approved' ? formatEuro(estimate.total) : artisan.price}
        </span>
      </div>

      {/* Thread */}
      <div
        ref={threadEl}
        aria-live="polite"
        // [&>*]:shrink-0 — in a scrolling flex column, children would otherwise
        // shrink to fit and `overflow-hidden` cards (the estimate) get clipped.
        className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto px-4 py-3.5 lg:min-h-[240px] lg:flex-initial [&>*]:shrink-0"
      >
        {thread.msgs.map((m, i) => {
          switch (m.from) {
            case 'context':
              return (
                <p key={i} className={NOTE}>
                  {t('chat.started', { trade: t(`trades.${artisan.trade}` as const), address })}
                </p>
              );
            case 'agreed':
              return (
                <p key={i} className={NOTE}>
                  {t('chat.jobStarted', { total: formatEuro(m.total) })}
                </p>
              );
            case 'them':
              return (
                <div key={i} className={THEM}>
                  {t(m.key, { ...vars, ...m.vars })}
                </div>
              );
            case 'me':
              return 'img' in m ? (
                <img key={i} src={m.img} alt={t('chat.photoAlt')} className="max-h-[180px] max-w-[70%] self-end rounded-[16px_16px_4px_16px] object-cover" />
              ) : (
                <div key={i} className={ME}>
                  {m.text}
                </div>
              );
            case 'estimate':
              return (
                <div key={i} className="w-[92%] self-start overflow-hidden rounded-[16px_16px_16px_4px] border border-line-soft bg-panel">
                  <div className="flex items-center justify-between gap-3 border-b border-line-rule bg-page px-3.5 py-2.5">
                    <span className="text-label text-ink-40">{t('chat.estimateTitle')}</span>
                    <span className="text-[11.5px] font-semibold text-ink-40">{t('chat.estimateNote')}</span>
                  </div>
                  {estimate.lines.map((l) => (
                    <div key={l.label.EN} className="flex items-baseline justify-between gap-3 px-3.5 pt-2.5 text-[13.5px]">
                      <span className="font-semibold text-ink-80">{l.label[lang]}</span>
                      <span className="flex-none font-bold text-ink">{formatEuro(l.amount)}</span>
                    </div>
                  ))}
                  <div className="mt-2.5 flex items-baseline justify-between border-t border-line-rule px-3.5 py-2.5">
                    <span className="text-[14px] font-bold text-ink">{t('job.total')}</span>
                    <span className="text-[17px] font-extrabold tracking-[-.02em] text-ink">{formatEuro(estimate.total)}</span>
                  </div>
                  {thread.stage === 'approved' ? (
                    <div className="flex items-center gap-1.5 border-t border-line-rule bg-success-tint px-3.5 py-2.5 text-[13px] font-bold text-success">
                      <Check size={14} />
                      {t('chat.approvedNote')}
                    </div>
                  ) : confirming ? (
                    <div className="border-t border-line-rule px-3.5 py-3">
                      <p className="mb-2.5 text-[13px] font-semibold leading-[1.45] text-ink-80">
                        {t(later ? 'chat.confirmBodyLater' : 'chat.confirmBody', vars)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirm}
                          className="h-10 flex-1 rounded-[12px] bg-brand text-[13.5px] font-bold text-white transition hover:bg-brand-hover"
                        >
                          {t('chat.confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(false)}
                          className="h-10 rounded-[12px] border border-line px-3.5 text-[13.5px] font-bold text-ink transition hover:bg-well"
                        >
                          {t('chat.back')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    onApprove && (
                      <div className="px-3.5 pb-3.5">
                        <button
                          type="button"
                          onClick={() => setConfirming(true)}
                          className="h-10 w-full rounded-[12px] bg-brand text-[14px] font-bold text-white transition hover:bg-brand-hover"
                        >
                          {t('chat.approve', { total: formatEuro(estimate.total) })}
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            case 'booked':
              return (
                <div key={i} className="w-[92%] self-center rounded-[16px] border border-success/30 bg-success-tint px-4 py-3 text-center">
                  <div className="mb-2 flex items-center justify-center gap-1.5 text-[13.5px] font-bold text-success">
                    <Check size={15} />
                    {t('chat.bookedTitle', { total: formatEuro(estimate.total) })}
                  </div>
                  <Link
                    to={jobUrl(m.jobId)}
                    className="inline-flex h-9 items-center rounded-[11px] bg-panel px-4 text-[13.5px] font-bold text-ink shadow-card transition hover:text-brand"
                  >
                    {t(later ? 'chat.viewJob' : 'chat.track', vars)}
                  </Link>
                </div>
              );
          }
        })}

        {typing && (
          <div className={`${THEM} flex items-center gap-1 py-3.5`} aria-label={t('chat.typing', vars)}>
            {[0, 150, 300].map((d) => (
              <span key={d} className="block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-40" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested questions while an estimate is on the table */}
      {thread.stage === 'quoted' && !confirming && (
        <div className="flex gap-2 overflow-x-auto border-t border-line-rule px-4 pt-3 [scrollbar-width:none]">
          {QUICK.map((x) => (
            <button
              key={x.q}
              type="button"
              onClick={() => send(t(x.q))}
              className="flex-none rounded-full border border-line bg-panel px-3 py-1.5 text-[12.5px] font-bold text-ink-80 transition hover:bg-well"
            >
              {t(x.q)}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className={
          'flex items-center gap-[9px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3' +
          (thread.stage === 'quoted' && !confirming ? '' : ' border-t border-line-rule')
        }
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          aria-label={t('chat.attachImage')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendPhoto(file);
            e.target.value = '';
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label={t('chat.attachImage')}
          className="grid h-10 w-10 flex-none place-items-center rounded-well bg-well text-ink-60 transition hover:bg-line"
        >
          <ImageIcon size={18} />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={t('chat.message')}
          placeholder={t('chat.placeholder')}
          className="h-10 min-w-0 flex-1 rounded-well border-0 bg-well px-3.5 text-sm text-ink placeholder:text-ink-30"
        />
        <button
          type="submit"
          aria-label={t('chat.send')}
          disabled={!draft.trim()}
          className="grid h-10 w-10 flex-none place-items-center rounded-well bg-brand text-white transition hover:bg-brand-hover disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
