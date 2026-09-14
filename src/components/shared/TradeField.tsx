import { useState } from 'react';
import { ChevronDown } from '../icons';
import TradePicker from './TradePicker';
import { TRADE_ICONS } from './tradeIcons';
import { classifyNeed } from '../../lib/classify';
import { isTradeSlug, type TradeSlug } from '../../routes';
import { useLang } from '../../i18n';
import { useAssistant } from '../assistant/AssistantProvider';

type Props = {
  /** The chosen trade slug, or '' for any. */
  trade: string;
  /** The free-text need — shown as "matched from 'tap'" when it chose the trade. */
  need: string;
  onTrade: (trade: TradeSlug | '') => void;
  onAssistant?: () => void;
  className?: string;
};

/**
 * The trade under "What needs fixing?": either the chip for the chosen trade
 * (with the word it was recognised from, when it was recognised) or a "Choose a
 * trade" button. Both open the TradePicker sheet.
 */
export default function TradeField({ trade, need, onTrade, onAssistant, className = '' }: Props) {
  const { t } = useLang();
  const { openAssistant } = useAssistant();
  const [open, setOpen] = useState(false);
  // "Not sure?" hands whatever was typed to the assistant, so nothing is re-typed.
  const ask = onAssistant ?? (() => openAssistant(need));
  const match = classifyNeed(need);
  const matched = isTradeSlug(trade) && match?.trade === trade ? match.keyword : null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {isTradeSlug(trade) ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${t('trade.chip.label')}: ${t(`trades.${trade}` as const)} — ${t('trade.chip.change')}`}
          className="flex h-9 items-center gap-2 rounded-full bg-brand-tint pl-1.5 pr-3 text-[13.5px] font-bold text-brand-hover transition hover:bg-brand-tint-hover"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-panel">
            {(() => {
              const Icon = TRADE_ICONS[trade];
              return <Icon size={13} strokeWidth={1.8} className="text-brand" />;
            })()}
          </span>
          {t(`trades.${trade}` as const)}
          <ChevronDown size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line px-3 text-[13.5px] font-bold text-ink-60 transition hover:border-brand hover:text-brand"
        >
          {t('trade.chip.choose')}
          <ChevronDown size={14} />
        </button>
      )}
      {matched && <span className="text-[12.5px] font-semibold text-ink-40">{t('trade.chip.matched', { word: matched })}</span>}

      <TradePicker open={open} current={trade} onPick={onTrade} onClose={() => setOpen(false)} onAssistant={ask} />
    </div>
  );
}
