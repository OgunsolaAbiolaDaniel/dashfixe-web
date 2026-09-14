import { describe, expect, it } from 'vitest';
import { creditFor, getWallet, redeemCode, referralCode, spendCredit } from './wallet';

describe('wallet', () => {
  it('starts empty, and a pilot code adds credit once', () => {
    expect(getWallet().credit).toBe(0);
    expect(redeemCode(' pilot10 ')).toEqual({ status: 'ok', amount: 10 });
    expect(getWallet().credit).toBe(10);
    expect(redeemCode('PILOT10')).toEqual({ status: 'used' });
    expect(redeemCode('FREEMONEY')).toEqual({ status: 'unknown' });
    expect(getWallet().history[0]).toMatchObject({ kind: 'code', code: 'PILOT10', amount: 10 });
  });

  it('never uses more credit than the job costs, and records what it spent', () => {
    redeemCode('PILOT10');
    expect(creditFor(63)).toBe(10);
    expect(creditFor(6)).toBe(6);
    spendCredit(10, 'dfx-2001');
    expect(getWallet().credit).toBe(0);
    expect(getWallet().history[0]).toMatchObject({ kind: 'job', jobId: 'dfx-2001', amount: -10 });
  });

  it('makes a readable invite code', () => {
    expect(referralCode('Ana Sofia', '+351912345678')).toBe('DFX-ANAS78');
    expect(referralCode(null, null)).toBe('DFX-FRIE00');
  });
});
