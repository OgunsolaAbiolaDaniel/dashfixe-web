import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests } from './store';
import { cookieJar } from '../test/pilotApi.mock';

/** "Report a problem" on a job (rev 2.9): stored for the team, read on /ops. */
beforeEach(() => {
  setStoreForTests(memoryStore());
  vi.stubEnv('OPS_PHONES', '913 000 000');
  vi.stubEnv('OPS_PASSCODE', 'correct horse battery');
});
afterEach(() => {
  setStoreForTests(null);
  vi.unstubAllEnvs();
});

function browser() {
  const jar = cookieJar();
  const call = async (method: string, path: string, body: unknown = null) => {
    const out = await handleApi({ method, path, body, cookieHeader: jar.header() });
    jar.take(out);
    return out;
  };
  return {
    get: (path: string) => call('GET', path),
    post: (path: string, body: unknown) => call('POST', path, body),
    async signIn(phone: string) {
      const rc = await call('POST', '/api/auth/request-code', { phone });
      await call('POST', '/api/auth/verify', { phone, code: rc.body.devCode });
    },
  };
}

describe('POST /api/support/report', () => {
  it('needs a signed-in customer, a job, a known category, and details for "other"', async () => {
    const b = browser();
    const report = { jobId: 'dfx-1042', category: 'late', details: 'Not here yet' };
    expect((await b.post('/api/support/report', report)).status).toBe(401);

    await b.signIn('912 345 678');
    expect((await b.post('/api/support/report', { ...report, jobId: '../etc' })).body.error).toBe('invalid_job');
    expect((await b.post('/api/support/report', { ...report, category: 'vibes' })).body.error).toBe('invalid_category');
    expect((await b.post('/api/support/report', { ...report, details: 'x'.repeat(1001) })).body.error).toBe('invalid_details');
    expect((await b.post('/api/support/report', { jobId: 'dfx-1042', category: 'other', details: '   ' })).body.error).toBe('details_required');

    const sent = await b.post('/api/support/report', report);
    expect(sent.status).toBe(200);
    expect(sent.body.reference).toMatch(/^R-\d{4}$/);
    // A category that speaks for itself needs no details.
    expect((await b.post('/api/support/report', { jobId: 'dfx-1042', category: 'safety' })).status).toBe(200);
  });

  it('reaches the team on /ops, newest first, with the phone to call back', async () => {
    const customer = browser();
    await customer.signIn('912 345 678');
    await customer.post('/api/support/report', { jobId: 'dfx-1042', category: 'price', details: 'Asked for €20 more' });
    await customer.post('/api/support/report', { jobId: 'dfx-1031', category: 'quality', details: '  Light flickers  ' });
    expect((await customer.get('/api/ops/reports')).body.error).toBe('not_ops');

    const team = browser();
    await team.signIn('913 000 000');
    expect((await team.get('/api/ops/reports')).body.error).toBe('ops_locked');
    await team.post('/api/ops/unlock', { passcode: 'correct horse battery' });
    const reports = (await team.get('/api/ops/reports')).body.reports as Array<Record<string, unknown>>;
    expect(reports).toHaveLength(2);
    expect(reports[0]).toMatchObject({ jobId: 'dfx-1031', category: 'quality', details: 'Light flickers', phone: '+351912345678' });
    expect(reports[1]).toMatchObject({ jobId: 'dfx-1042', category: 'price' });
  });
});
