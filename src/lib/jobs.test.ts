import { describe, expect, it } from 'vitest';
import {
  ACTIVE_JOB_ID,
  activeJob,
  cancelJob,
  createJob,
  daysUntil,
  finishJob,
  formatEuro,
  getJob,
  listJobs,
  rateJob,
  reportOnJob,
  rescheduleJob,
} from './jobs';
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

describe('changing a booking (rev 2.9)', () => {
  const book = () =>
    createJob({
      artisanId: 'tf',
      artisanName: 'Tiago Ferreira',
      initials: 'TF',
      trade: 'plumbing',
      title: { EN: 'Boiler service', PT: 'Boiler service' },
      status: 'agreed',
      dayOffset: 2,
      slot: { window: '10–12' },
      lines: [{ label: { EN: 'Service', PT: 'Serviço' }, amount: 60 }],
      total: 60,
    });

  it('moves a booked job to another day and window', () => {
    const now = new Date(2026, 8, 15, 9, 0);
    const job = book();
    const moved = rescheduleJob(job.id, 5, '16–18', now)!;
    expect(moved).toMatchObject({ date: '2026-09-20', slot: { window: '16–18' }, status: 'agreed' });
    expect(daysUntil(moved.date, now)).toBe(5);
  });

  it('cancels a booking before travel, and never a job already on the way', () => {
    const job = book();
    expect(cancelJob(ACTIVE_JOB_ID)).toBe(false); // travelling
    expect(rescheduleJob(ACTIVE_JOB_ID, 1, '10–12')).toBeNull();
    expect(cancelJob(job.id)).toBe(true);
    expect(getJob(job.id)!.status).toBe('cancelled');
    expect(activeJob()!.id).toBe(ACTIVE_JOB_ID);
  });

  it('remembers a reported problem with the job', () => {
    reportOnJob(ACTIVE_JOB_ID, { reference: 'R-1234', category: 'late', at: '2026-09-15T10:00:00Z' });
    expect(getJob(ACTIVE_JOB_ID)!.report).toEqual({ reference: 'R-1234', category: 'late', at: '2026-09-15T10:00:00Z' });
  });
});
