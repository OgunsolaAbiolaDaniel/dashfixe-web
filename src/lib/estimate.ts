/**
 * The itemised estimate an artisan sends in chat — the price rule made concrete:
 * parts and labour on separate lines, and the total IS the price.
 *
 * Sample arithmetic from the artisan's quoted range until real artisans price
 * real jobs: the low end of the range plus a small call-out, ~22% parts. For
 * Tiago (€60–75) that is €14 + €49 = €63 — the same numbers as the seeded live
 * job, so chat, tracking and receipt all agree.
 */
import { translate } from '../i18n/strings';
import { priceFrom } from '../search';
import type { ReceiptLine } from './jobs';

export type Estimate = { lines: ReceiptLine[]; total: number };

export function estimateFor(artisan: { price: string }): Estimate {
  const total = priceFrom(artisan.price) + 3;
  const parts = Math.round(total * 0.22);
  const label = (key: 'chat.est.parts' | 'chat.est.labour') => ({ EN: translate('EN', key), PT: translate('PT', key) });
  return {
    total,
    lines: [
      { label: label('chat.est.parts'), amount: parts },
      { label: label('chat.est.labour'), amount: total - parts },
    ],
  };
}
