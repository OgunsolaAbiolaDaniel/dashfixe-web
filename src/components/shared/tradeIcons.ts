import { Bolt, Roller, Saw, Spray, Wrench } from '../icons';
import type { TradeSlug } from '../../routes';

/** One icon per trade — the picker tiles, the trade chip, the home tiles. */
export const TRADE_ICONS: Record<TradeSlug, typeof Wrench> = {
  plumbing: Wrench,
  electrical: Bolt,
  painting: Roller,
  carpentry: Saw,
  cleaning: Spray,
};
