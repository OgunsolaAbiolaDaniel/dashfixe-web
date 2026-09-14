import { describe, expect, it } from 'vitest';
import { buildNotices, getSeen, markSeen } from './notifications';
import { finishJob, listJobs, rateJob } from './jobs';
import { getWallet, redeemCode } from './wallet';

describe('notifications', () => {
  it('derives one notice per job state from the history, newest first', () => {
    const ids = buildNotices(listJobs(), getWallet()).map((n) => n.id);
    expect(ids).toEqual(['dfx-1042:travelling', 'dfx-1031:receipt', 'dfx-1031:rate', 'dfx-1027:receipt', 'dfx-1019:cancelled']);
  });

  it('raises a new notice when a job moves on, and drops the rating nudge once rated', () => {
    finishJob('dfx-1042');
    rateJob('dfx-1031', 5);
    const ids = buildNotices(listJobs(), getWallet()).map((n) => n.id);
    expect(ids).toContain('dfx-1042:receipt');
    expect(ids).not.toContain('dfx-1042:travelling');
    expect(ids).not.toContain('dfx-1031:rate');
  });

  it('tells the customer about credit added, linking to the account', () => {
    redeemCode('PILOT10');
    const credit = buildNotices(listJobs(), getWallet()).find((n) => n.kind === 'credit');
    expect(credit).toMatchObject({ key: 'notif.credit', vars: { amount: '€10.00', code: 'PILOT10' }, to: '/account' });
  });

  it('remembers what was seen', () => {
    expect(getSeen()).toEqual([]);
    markSeen(['a', 'b']);
    markSeen(['b', 'c']);
    expect(getSeen()).toEqual(['a', 'b', 'c']);
  });
});
