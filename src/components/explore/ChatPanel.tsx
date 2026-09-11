import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Close, ImageIcon, Paperclip, Send } from '../icons';
import { useLang } from '../../i18n';
import { artisanUrl } from '../../routes';
import { getThread, saveThread, shouldAutoReply, type Msg } from './chatStore';
import type { Artisan } from './artisans';

type Props = { artisan: Artisan; address: string; onClose: () => void };

const ICON_BTN = 'grid h-10 w-10 flex-none place-items-center rounded-well bg-well text-ink-60';

/**
 * Docks 24px from the bottom-right of the map, never inside the search panel.
 * Four fixed regions: identity header, job context strip, thread, composer.
 *
 * The thread is real state now (chatStore): sending appends, the store keeps the
 * thread across close/reopen, and one canned reply lands per thread — a
 * walkthrough beat until the Phase 5 backend. Mount with key={artisan.id}.
 */
export default function ChatPanel({ artisan, address, onClose }: Props) {
  const { t } = useLang();
  const [msgs, setMsgs] = useState<Msg[]>(() => getThread(artisan.id));
  const [draft, setDraft] = useState('');
  const thread = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => saveThread(artisan.id, msgs), [artisan.id, msgs]);
  useEffect(() => {
    thread.current?.scrollTo?.({ top: thread.current.scrollHeight });
  }, [msgs]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [...m, { from: 'me', text }]);
    setDraft('');
    if (shouldAutoReply(artisan.id)) {
      setTimeout(() => setMsgs((m) => [...m, { from: 'them', key: 'chat.reply' }]), 1200);
    }
  };

  const bubbleText = (m: Msg) => ('key' in m ? t(m.key) : 'text' in m ? m.text : '');

  return (
    <div className="absolute bottom-6 right-6 flex max-h-[calc(100%-48px)] w-[392px] max-w-[calc(100%-48px)] flex-col overflow-hidden rounded-[24px] border border-line-soft bg-panel shadow-panel">
      <div className="flex items-center gap-[11px] border-b border-line-rule px-4 py-3.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-avatar text-[12.5px] font-extrabold text-brand">
          {artisan.initials}
        </span>
        <span className="mr-auto min-w-0">
          <Link to={artisanUrl(artisan.id)} className="block truncate text-[15.5px] font-bold text-ink hover:text-brand">
            {artisan.name}
          </Link>
          <span className="mt-px flex items-center gap-1.5 text-xs font-semibold text-success">
            <i className="block h-1.5 w-1.5 rounded-full bg-success" />
            {t('chat.online')}
          </span>
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

      <div className="flex items-center gap-[9px] border-b border-line-rule bg-page px-4 py-2.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[.11em] text-ink-40">{t('chat.job')}</span>
        <span className="mr-auto truncate text-[12.5px] font-semibold text-ink-80">
          {t(`trades.${artisan.trade}` as const)} · {address}
        </span>
        <span className="flex-none rounded-full bg-brand-tint px-[11px] py-1.5 text-xs font-bold text-brand-hover">
          {artisan.price}
        </span>
      </div>

      <div ref={thread} className="flex min-h-0 flex-col gap-[9px] overflow-y-auto px-4 py-3.5">
        {msgs.map((m, i) =>
          'img' in m ? (
            <img key={i} src={m.img} alt="" className="max-h-[180px] max-w-[70%] self-end rounded-[16px_16px_4px_16px] object-cover" />
          ) : m.from === 'photo' ? (
            <div
              key={i}
              className="grid h-[98px] w-[148px] flex-none self-end place-items-center rounded-[16px_16px_4px_16px] bg-avatar text-[11.5px] font-semibold text-[#7d8db0]"
            >
              {t('chat.photo')}
            </div>
          ) : (
            <div
              key={i}
              className={
                m.from === 'me'
                  ? 'max-w-[86%] self-end rounded-[16px_16px_4px_16px] bg-brand px-3.5 py-[11px] text-sm leading-[1.45] text-white'
                  : 'max-w-[86%] self-start rounded-[16px_16px_16px_4px] bg-well px-3.5 py-[11px] text-sm leading-[1.45] text-ink'
              }
            >
              {bubbleText(m)}
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-[9px] border-t border-line-rule px-4 pb-4 pt-3"
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          aria-label={t('chat.attachImage')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setMsgs((m) => [...m, { from: 'me', img: URL.createObjectURL(file) }]);
            e.target.value = '';
          }}
          className="hidden"
        />
        <button type="button" onClick={() => fileInput.current?.click()} aria-label={t('chat.attachImage')} className={ICON_BTN}>
          <ImageIcon size={18} />
        </button>
        <button type="button" aria-label={t('chat.attachFile')} className={ICON_BTN}>
          <Paperclip size={18} />
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
          className="grid h-10 w-10 flex-none place-items-center rounded-well bg-brand text-white transition hover:bg-brand-hover"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
