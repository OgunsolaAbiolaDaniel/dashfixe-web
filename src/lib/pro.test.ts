import { describe, expect, it } from 'vitest';
import { payout, quote, type QuoteLine } from './pro';

const line = (amount: number, kind: QuoteLine['kind'] = 'part'): QuoteLine => ({ id: String(amount), kind, label: 'x', detail: '', amount });

describe('artisan money (designs/Dashfixe Artisan App.dc.html)', () => {
  it('prices the design estimate to the cent: IVA on top, commission off the total', () => {
    const q = quote([line(12.4), line(3.2), line(28, 'labour'), line(6, 'callout')]);
    expect(q).toEqual({ subtotal: 49.6, iva: 11.41, total: 61.01, commission: 7.32, net: 53.69 });
  });

  it('prices the second estimate and the final payout like the design', () => {
    expect(quote([line(8.9), line(7, 'labour')]).total).toBe(19.56);
    expect(payout(80.57)).toEqual({ commission: 9.67, net: 70.9 });
  });

  it('ignores blank or negative amounts', () => {
    expect(quote([line(Number.NaN), line(-5), line(10)]).subtotal).toBe(10);
  });
});
