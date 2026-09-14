import { useEffect, useRef } from 'react';
import { Chat, Close } from '../icons';
import { TRADE_SLUGS, type TradeSlug } from '../../routes';
import { useLang } from '../../i18n';
import { TRADE_ICONS } from './tradeIcons';

type Props = {
  open: boolean;
  current: string;
  onPick: (trade: TradeSlug | '') => void;
  onClose: () => void;
  /** Offer "Not sure? Describe it to our assistant" — the escape hatch. */
  onAssistant?: () => void;
};

/**
 * Choose the trade — a sheet, not a dropdown: five big tiles with the icon and
 * what the trade covers, so the choice is recognisable at a glance. A bottom
 * sheet on phones, a centred card on desktop. Escape or the backdrop closes it.
 */
export default function TradePicker({ open, current, onPick, onClose, onAssistant }: Props) {
  const { t } = useLang();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLButtonElement>('button[data-trade]')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (trade: TradeSlug | '') => {
    onPick(trade);
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 backdrop-blur-[4px] sm:items-center">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t('picker.title')}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[26px] bg-panel p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-panel sm:max-w-[560px] sm:rounded-[26px] sm:p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="mr-auto text-[20px] font-extrabold tracking-[-.02em] text-ink">{t('picker.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('picker.close')}
            className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-well transition hover:bg-line"
          >
            <Close size={17} className="text-ink-60" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TRADE_SLUGS.map((slug) => {
            const Icon = TRADE_ICONS[slug];
            const on = current === slug;
            return (
              <button
                key={slug}
                type="button"
                data-trade={slug}
                aria-pressed={on}
                onClick={() => pick(slug)}
                className={
                  'flex flex-col items-start rounded-[18px] p-4 text-left transition ' +
                  (on ? 'bg-brand-tint ring-2 ring-brand' : 'bg-well hover:bg-line')
                }
              >
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-panel">
                  <Icon size={19} strokeWidth={1.6} className="text-brand" />
                </span>
                <span className="block text-[15px] font-bold text-ink">{t(`trades.${slug}` as const)}</span>
                <span className="mt-0.5 block text-[12.5px] font-semibold leading-[1.35] text-ink-60">
                  {t(`trades.${slug}.hint` as const)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={current === ''}
            onClick={() => pick('')}
            className={
              'flex flex-col items-start justify-end rounded-[18px] border border-dashed p-4 text-left transition ' +
              (current === '' ? 'border-brand bg-brand-tint' : 'border-line hover:bg-well')
            }
          >
            <span className="block text-[15px] font-bold text-ink">{t('picker.any')}</span>
            <span className="mt-0.5 block text-[12.5px] font-semibold leading-[1.35] text-ink-60">{t('picker.anyHint')}</span>
          </button>
        </div>

        {onAssistant && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onAssistant();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-[18px] bg-ink px-4 py-3.5 text-left text-white transition hover:bg-ink-80"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/10">
              <Chat size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold">{t('picker.unsure')}</span>
              <span className="block text-[12.5px] font-semibold text-onink">{t('picker.unsureHint')}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
