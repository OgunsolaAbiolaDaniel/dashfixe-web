import { describe, expect, it } from 'vitest';
import { ACTIVE_JOB_ID, formatEuro, getJob } from './jobs';

describe('sample jobs', () => {
  it('keeps every receipt honest: lines sum to the total', () => {
    for (const id of ['dfx-1042', 'dfx-1031', 'dfx-1027']) {
      const job = getJob(id)!;
      const sum = job.lines.reduce((acc, l) => acc + l.amount, 0);
      expect(sum, id).toBe(job.total);
    }
  });

  it('has both languages on every line label and title', () => {
    for (const id of ['dfx-1042', 'dfx-1031', 'dfx-1027']) {
      const job = getJob(id)!;
      expect(job.title.EN).toBeTruthy();
      expect(job.title.PT).toBeTruthy();
      for (const l of job.lines) {
        expect(l.label.EN).toBeTruthy();
        expect(l.label.PT).toBeTruthy();
      }
    }
  });

  it('tracks exactly one live job, and it has a position and an arrival', () => {
    const active = getJob(ACTIVE_JOB_ID)!;
    expect(active.status).toBe('travelling');
    expect(active.from).toBeDefined();
    expect(active.arrives).toBeTruthy();
    expect(active.paid).toBe(false);
  });

  it('returns null for unknown ids and formats euros', () => {
    expect(getJob('nope')).toBeNull();
    expect(formatEuro(63)).toBe('€63.00');
  });
});
