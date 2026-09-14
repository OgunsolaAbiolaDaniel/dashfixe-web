/**
 * Artisan-side money, from designs/Dashfixe Artisan App.dc.html.
 *
 * Lines → subtotal, IVA 23% on top, and the customer pays the total. The
 * commission (12%, the design's example pilot rate — not a published tariff)
 * comes out of the total on a finished job only. No lead fees, ever. Rounded to
 * the cent at each step, so €49.60 → €61.01 → €53.69, exactly as designed.
 *
 * Used by the /pro showcase stills today; the artisan app's estimate builder
 * uses the same rules when it ships.
 */
export const IVA_RATE = 0.23;
export const COMMISSION_RATE = 0.12;

export type LineKind = 'part' | 'labour' | 'callout';
export type QuoteLine = { id: string; kind: LineKind; label: string; detail: string; amount: number };

const cents = (n: number) => Math.round(n * 100) / 100;

/** An estimate: what the customer pays, and what the artisan receives. */
export function quote(lines: QuoteLine[]) {
  const subtotal = cents(lines.reduce((sum, l) => sum + (Number.isFinite(l.amount) && l.amount > 0 ? l.amount : 0), 0));
  const iva = cents(subtotal * IVA_RATE);
  const total = cents(subtotal + iva);
  return { subtotal, iva, total, ...payout(total) };
}

/** The commission on a finished job of `total` (IVA included), and the payout. */
export function payout(total: number) {
  const commission = cents(total * COMMISSION_RATE);
  return { commission, net: cents(total - commission) };
}
