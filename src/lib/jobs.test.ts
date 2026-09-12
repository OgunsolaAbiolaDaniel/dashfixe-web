import { describe, expect, it } from 'vitest';
import { ACTIVE_JOB_ID, activeJob, createJob, finishJob, formatEuro, getJob, listJobs, rateJob } from './jobs';
import { estimateFor } from './estimate';

const SEEDED = ['dfx-1042', 'dfx-1031', 'dfx-1027', 'dfx-1019'];

describe('sample jobs', () => {
  it('keeps every receipt honest: lines sum to the total', () => {
    for (const id of SEEDED) {
      const job = getJob(id)!;
      const sum = job.lines.reduce((acc, l) => acc + l.amount, 0);
      expect(sum, id).toBe(job.total);
    }
  });

  it('has both languages on every line label and title', () => {
    for (const id of SEEDED) {
      const job = getJob(id)!;
      expect(job.title.EN).toBeTruthy();
      expect(job.title.PT).toBeTruthy();
      for (const l of job.lines) {
        expect(l.label.EN).toBeTruthy();
        expect(l.label.PT).toBeTruthy();
      }
    }
  });

  it('starts with one live job, with a position and an arrival', () => {
    const active = activeJob()!;
    expect(active.id).toBe(ACTIVE_JOB_ID);
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

describe('the job loop', () => {
  it('prices an estimate the same way the seeded job was priced', () => {
    const est = estimateFor({ price: '€60–75' });
    expect(est.total).toBe(63);
    expect(est.lines.map((l) => l.amount)).toEqual([14, 49]);
    expect(est.lines.every((l) => l.label.EN && l.label.PT)).toBe(true);
  });

  it('books a job, makes it the live one, finishes it, and remembers a rating', () => {
    const est = estimateFor({ price: '€55–70' });
    const job = createJob({
      artisanId: 'ra',
      artisanName: 'Rui Almeida',
      initials: 'RA',
      trade: 'plumbing',
      title: { EN: 'Blocked sink', PT: 'Blocked sink' },
      status: 'travelling',
      arrives: '15:10',
      lines: est.lines,
      total: est.total,
    });
    expect(listJobs()[0]!.id).toBe(job.id);
    expect(activeJob()!.id).toBe(job.id);

    finishJob(job.id);
    expect(getJob(job.id)).toMatchObject({ status: 'done', paid: true });
    expect(activeJob()!.id).toBe(ACTIVE_JOB_ID); // the seeded one is live again

    rateJob(job.id, 4);
    expect(getJob(job.id)!.rating).toBe(4);
  });
});
