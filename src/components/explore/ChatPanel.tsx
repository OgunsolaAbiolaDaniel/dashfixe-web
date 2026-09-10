import { Close, ImageIcon, Paperclip, Send } from '../icons';
import { useLang } from '../../i18n';
import type { Artisan } from './artisans';

type Props = { artisan: Artisan; address: string; onClose: () => void };

const ICON_BTN = 'grid h-10 w-10 flex-none place-items-center rounded-well bg-well text-ink-60';

/**
 * Docks 24px from the bottom-right of the map, never inside the search panel.
 * Four fixed regions: identity header, job context strip, thread, composer.
 * The thread is a sample conversation — there is no messaging backend yet.
 */
export default function ChatPanel({ artisan, address, onClose }: Props) {
  const { t } = useLang();
  return (
    <div className="absolute bottom-6 right-6 flex w-[392px] max-w-[calc(100%-48px)] flex-col overflow-hidden rounded-[24px] border border-line-soft bg-panel shadow-panel">
      <div className="flex items-center gap-[11px] border-b border-line-rule px-4 py-3.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-avatar text-[12.5px] font-extrabold text-brand">
          {artisan.initials}
        </span>
        <span className="mr-auto min-w-0">
          <span className="block text-[15.5px] font-bold text-ink">{artisan.name}</span>
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

      <div className="flex flex-col gap-[9px] px-4 py-3.5">
        <div className="grid h-[98px] w-[148px] self-end place-items-center rounded-[16px_16px_4px_16px] bg-avatar text-[11.5px] font-semibold text-[#7d8db0]">
          {t('chat.photo')}
        </div>
        <div className="max-w-[86%] self-end rounded-[16px_16px_4px_16px] bg-brand px-3.5 py-[11px] text-sm leading-[1.45] text-white">
          {t('chat.msg1')}
        </div>
        <div className="max-w-[86%] self-start rounded-[16px_16px_16px_4px] bg-well px-3.5 py-[11px] text-sm leading-[1.45] text-ink">
          {t('chat.msg2')}
        </div>
      </div>

      <div className="flex items-center gap-[9px] border-t border-line-rule px-4 pb-4 pt-3">
        <button type="button" aria-label={t('chat.attachImage')} className={ICON_BTN}>
          <ImageIcon size={18} />
        </button>
        <button type="button" aria-label={t('chat.attachFile')} className={ICON_BTN}>
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          aria-label={t('chat.message')}
          placeholder={t('chat.placeholder')}
          className="h-10 min-w-0 flex-1 rounded-well border-0 bg-well px-3.5 text-sm text-ink placeholder:text-ink-30"
        />
        <button
          type="button"
          aria-label={t('chat.send')}
          className="grid h-10 w-10 flex-none place-items-center rounded-well bg-brand text-white transition hover:bg-brand-hover"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
