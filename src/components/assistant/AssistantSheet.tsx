import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Close, MapPin, Send, Sparkle } from '../icons';
import { TRADE_ICONS } from '../shared/tradeIcons';
import { availableCount } from '../explore/artisans';
import { classifyNeed } from '../../lib/classify';
import { usePlace } from '../../lib/place';
import { TRADE_SLUGS, type TradeSlug } from '../../routes';
import { exploreUrl } from '../../search';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

type Msg =
  | { from: 'me'; text: string }
  | { from: 'bot'; key: StringKey; trade?: TradeSlug; word?: string }
  /** "See plumbers near me" / "Not quite" — after a trade is identified. */
  | { from: 'suggest'; trade: TradeSlug }
  /** The five trades as quick picks, when the words did not settle it. */
  | { from: 'choose' }
  /** "See everyone near me" — nothing in the pilot fits. */
  | { from: 'everyone' };

const REPLY_MS = 650;
const BOT = 'max-w-[88%] self-start rounded-[16px_16px_16px_4px] bg-well px-3.5 py-[11px] text-sm leading-[1.5] text-ink';
const ME = 'max-w-[88%] self-end rounded-[16px_16px_4px_16px] bg-brand px-3.5 py-[11px] text-sm leading-[1.5] text-white [overflow-wrap:anywhere]';

/** What the assistant says back to a description. Pure: the same words, the same answer. */
function answerFor(text: string): Msg[] {
  const match = classifyNeed(text);
  return match
    ? [
        { from: 'bot', key: 'assist.match', trade: match.trade, word: match.keyword },
        { from: 'suggest', trade: match.trade },
      ]
    : [{ from: 'bot', key: 'assist.unsure' }, { from: 'choose' }];
}

/**
 * The Dashfixe assistant — "Something else" as a conversation instead of a form.
 * The customer describes the problem in their own words; the assistant works out
 * the trade (lib/classify, the same matcher as the search field), asks when it
 * can't tell, and hands off to /explore with the need, the trade and the saved
 * address already filled in. Labelled as automatic matching — no one pretends
 * to be a person. Phone: full screen. Desktop: a centred panel.
 */
export default function AssistantSheet({ initial, onClose }: { initial: string; onClose: () => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const place = usePlace();
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { from: 'bot', key: 'assist.hello' },
    ...(initial.trim() ? [{ from: 'me' as const, text: initial.trim() }] : []),
  ]);
  const [need, setNeed] = useState(initial.trim());
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const threadEl = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    threadEl.current?.scrollTo?.({ top: threadEl.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** A short typing beat, then the reply — every setState in a timer, never in an effect body. */
  const reply = useCallback((out: Msg[]) => {
    const ids = [window.setTimeout(() => setTyping(true), 80)];
    out.forEach((m, i) =>
      ids.push(
        window.setTimeout(() => {
          if (i === out.length - 1) setTyping(false);
          setMsgs((prev) => [...prev, m]);
        }, REPLY_MS * (i + 1)),
      ),
    );
    timers.current.push(...ids);
    return () => ids.forEach(clearTimeout);
  }, []);

  // Opened with words already typed (from the search field): answer them straight away.
  useEffect(() => {
    if (!initial.trim()) return;
    return reply(answerFor(initial));
  }, [initial, reply]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const all = `${need} ${text}`.trim();
    setMsgs((prev) => [...prev, { from: 'me', text }]);
    setDraft('');
    setNeed(all);
    reply(answerFor(all));
  };

  const pick = (trade: TradeSlug) => {
    setMsgs((prev) => [...prev, { from: 'me', text: t(`trades.${trade}` as const) }]);
    reply([{ from: 'bot', key: 'assist.picked', trade }, { from: 'suggest', trade }]);
  };

  const none = () => {
    setMsgs((prev) => [...prev, { from: 'me', text: t('assist.none') }]);
    reply([{ from: 'bot', key: 'assist.noneReply' }, { from: 'everyone' }]);
  };

  /** Hand off to the search with everything filled in. */
  const go = (trade: TradeSlug | '') => {
    navigate(exploreUrl({ need, trade, address: place.label, lngLat: place.lngLat }));
    onClose();
  };

  const tradeWord = (trade: TradeSlug) => t(`trades.${trade}` as const).toLowerCase();
  const botText = (m: Extract<Msg, { from: 'bot' }>) =>
    t(m.key, {
      place: place.label,
      ...(m.trade ? { trade: tradeWord(m.trade), n: availableCount(m.trade) } : {}),
      ...(m.word ? { word: m.word } : {}),
    });

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 backdrop-blur-[4px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('assist.title')}
        onClick={(e) => e.stopPropagation()}
        className="flex h-dvh w-full flex-col bg-panel shadow-panel sm:h-[min(640px,90dvh)] sm:max-w-[460px] sm:overflow-hidden sm:rounded-[26px]"
      >
        {/* Identity */}
        <div className="flex items-center gap-3 border-b border-line-rule px-4 py-3.5">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink text-white">
            <Sparkle size={18} />
          </span>
          <span className="mr-auto min-w-0">
            <span className="block text-[15.5px] font-bold text-ink">{t('assist.title')}</span>
            <span className="block truncate text-xs font-semibold text-ink-40">{t('assist.label')}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('assist.close')}
            className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-well transition hover:bg-line"
          >
            <Close size={16} className="text-ink-60" />
          </button>
        </div>

        {/* Where the search will be */}
        <div className="flex items-center gap-2 border-b border-line-rule bg-page px-4 py-2.5 text-[12.5px] font-semibold text-ink-60">
          <MapPin size={14} className="flex-none text-brand" />
          <span className="truncate">{t('assist.near', { place: place.label })}</span>
        </div>

        {/* Thread */}
        <div ref={threadEl} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 [&>*]:shrink-0">
          {msgs.map((m, i) => {
            switch (m.from) {
              case 'me':
                return (
                  <div key={i} className={ME}>
                    {m.text}
                  </div>
                );
              case 'bot':
                return (
                  <div key={i} className={BOT}>
                    {botText(m)}
                  </div>
                );
              case 'suggest': {
                const Icon = TRADE_ICONS[m.trade];
                return (
                  <div key={i} className="flex w-[88%] flex-col gap-2 self-start">
                    <button
                      type="button"
                      onClick={() => go(m.trade)}
                      className="flex items-center gap-3 rounded-[16px] bg-brand px-4 py-3 text-left text-white transition hover:bg-brand-hover"
                    >
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/20">
                        <Icon size={16} strokeWidth={1.8} />
                      </span>
                      <span className="mr-auto text-[14.5px] font-bold">
                        {t('assist.go', { pros: t(`trade.${m.trade}.pros` as const).toLowerCase() })}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMsgs((prev) => [...prev, { from: 'choose' }])}
                      className="self-start text-[13px] font-bold text-ink-60 transition hover:text-ink"
                    >
                      {t('assist.other')}
                    </button>
                  </div>
                );
              }
              case 'choose':
                return (
                  <div key={i} className="flex w-full flex-wrap gap-2">
                    {TRADE_SLUGS.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => pick(slug)}
                        className="rounded-full border border-line bg-panel px-3.5 py-2 text-[13px] font-bold text-ink transition hover:border-brand hover:text-brand"
                      >
                        {t(`trades.${slug}` as const)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={none}
                      className="rounded-full border border-dashed border-line px-3.5 py-2 text-[13px] font-bold text-ink-60 transition hover:text-ink"
                    >
                      {t('assist.none')}
                    </button>
                  </div>
                );
              case 'everyone':
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go('')}
                    className="flex w-[88%] items-center justify-between self-start rounded-[16px] bg-ink px-4 py-3 text-[14.5px] font-bold text-white transition hover:bg-ink-80"
                  >
                    {t('assist.everyone')}
                    <ArrowRight size={16} />
                  </button>
                );
            }
          })}
          {typing && (
            <div className={`${BOT} flex items-center gap-1 py-3.5`} aria-label={t('assist.typing')}>
              {[0, 150, 300].map((d) => (
                <span key={d} className="block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-40" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-[9px] border-t border-line-rule px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
        >
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('assist.placeholder')}
            placeholder={t('assist.placeholder')}
            className="h-11 min-w-0 flex-1 rounded-well border-0 bg-well px-3.5 text-[14.5px] text-ink placeholder:text-ink-30"
          />
          <button
            type="submit"
            aria-label={t('chat.send')}
            disabled={!draft.trim()}
            className="grid h-11 w-11 flex-none place-items-center rounded-well bg-brand text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
