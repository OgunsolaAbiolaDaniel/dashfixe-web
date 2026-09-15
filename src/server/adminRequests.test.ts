import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests, type ConsoleMessage, type SignOffRequest, type StoredApplication, type StoredReport } from './store';
import { cookieJar } from '../test/pilotApi.mock';

/**
 * Supervisor sign-off (rev 2.14): an Admin asks, a Supervisor approves — which
 * applies the decision — or sends it back with a reason; nobody signs off their
 * own request. Plus each record's discussion.
 */
const KEY = 'correct horse battery';

beforeEach(() => {
  setStoreForTests(memoryStore());
  vi.stubEnv('OPS_PASSCODE', KEY);
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
  return { get: (path: string) => call('GET', path), post: (path: string, body: unknown) => call('POST', path, body) };
}

async function team() {
  const owner = browser();
  await owner.post('/api/admin/setup', { key: KEY, name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' });
  const signIn = async (name: string, email: string, role: string) => {
    await owner.post('/api/admin/team', { name, email, role, password: `start-${email}` });
    const b = browser();
    await b.post('/api/admin/login', { email, password: `start-${email}` });
    await b.post('/api/admin/password', { current: `start-${email}`, next: `${email}-own-pass` });
    return b;
  };
  return {
    owner,
    supervisor: await signIn('Marta Silva', 'marta@dashfixe.pt', 'supervisor'),
    admin: await signIn('João Costa', 'joao@dashfixe.pt', 'admin'),
    rita: await signIn('Rita Luz', 'rita@dashfixe.pt', 'admin'),
  };
}

async function application() {
  await handleApi({ method: 'POST', path: '/api/artisans/apply', body: { fullName: 'Tiago Ferreira', phone: '914 111 222', email: 'a@example.com', trade: 'plumbing' } });
}

describe('asking a supervisor', () => {
  it('lets an Admin ask, and a Supervisor approve — which applies the decision', async () => {
    const { admin, supervisor, owner } = await team();
    await application();
    const [app] = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];
    const ref = app!.reference!;

    const asked = await admin.post('/api/admin/requests', { recordType: 'application', recordId: app!.id, action: 'approve', note: 'Van, gas licence seen' });
    expect(asked.body.request).toMatchObject({ status: 'pending', action: 'approve', recordRef: ref, createdByName: 'João Costa' });
    // One pending request per record.
    expect((await admin.post('/api/admin/requests', { recordType: 'application', recordId: app!.id, action: 'decline' })).body.error).toBe('already_requested');
    // Supervisors decide directly, so they don't ask.
    expect((await supervisor.post('/api/admin/requests', { recordType: 'application', recordId: app!.id, action: 'approve' })).body.error).toBe('forbidden');

    const reviewed = await supervisor.post('/api/admin/requests/review', { id: (asked.body.request as SignOffRequest).id, decision: 'approve', note: 'Agreed' });
    expect(reviewed.body.request).toMatchObject({ status: 'approved', reviewedByName: 'Marta Silva', reviewNote: 'Agreed' });
    expect(((await admin.get('/api/admin/applications')).body.applications as StoredApplication[])[0]).toMatchObject({ status: 'approved' });

    const thread = (await admin.post('/api/admin/thread', { record: ref })).body.messages as ConsoleMessage[];
    expect(thread.map((m) => [m.authorName, m.body])).toEqual([
      ['João Costa', 'Van, gas licence seen'],
      ['Marta Silva', 'Agreed'],
    ]);
    const log = (await owner.get('/api/admin/audit')).body.events as Array<{ action: string; detail: string }>;
    expect(log.map((e) => e.action)).toEqual(expect.arrayContaining(['request.create', 'request.approve', 'application.status']));
    expect(log.find((e) => e.action === 'application.status')!.detail).toMatch(/received → approved \(request #1 from João Costa\)/);
  });

  it('sends a request back only with a reason, and lets the asker withdraw', async () => {
    const { admin, rita, supervisor } = await team();
    await application();
    const [app] = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];
    const asked = (await admin.post('/api/admin/requests', { recordType: 'application', recordId: app!.id, action: 'decline' })).body.request as SignOffRequest;

    expect((await supervisor.post('/api/admin/requests/review', { id: asked.id, decision: 'return' })).body.error).toBe('note_required');
    const returned = await supervisor.post('/api/admin/requests/review', { id: asked.id, decision: 'return', note: 'Call them first' });
    expect(returned.body.request).toMatchObject({ status: 'returned', reviewNote: 'Call them first' });
    expect(((await admin.get('/api/admin/applications')).body.applications as StoredApplication[])[0]).toMatchObject({ status: 'received' });
    expect((await supervisor.post('/api/admin/requests/review', { id: asked.id, decision: 'approve' })).body.error).toBe('not_pending');

    const again = (await admin.post('/api/admin/requests', { recordType: 'application', recordId: app!.id, action: 'approve' })).body.request as SignOffRequest;
    expect((await rita.post('/api/admin/requests/withdraw', { id: again.id })).body.error).toBe('forbidden');
    expect((await admin.post('/api/admin/requests/withdraw', { id: again.id })).body.request).toMatchObject({ status: 'withdrawn' });
  });

  it("shows Admins their own requests and reviewers everyone's", async () => {
    const { admin, rita, supervisor } = await team();
    await application();
    await application();
    const apps = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];
    await admin.post('/api/admin/requests', { recordType: 'application', recordId: apps[0]!.id, action: 'approve' });
    await rita.post('/api/admin/requests', { recordType: 'application', recordId: apps[1]!.id, action: 'decline' });

    const mine = (await admin.get('/api/admin/requests')).body;
    expect(mine.scope).toBe('own');
    expect((mine.requests as SignOffRequest[]).map((r) => r.createdByName)).toEqual(['João Costa']);
    const all = (await supervisor.get('/api/admin/requests')).body;
    expect(all.scope).toBe('all');
    expect(all.requests).toHaveLength(2);
    // An Admin can't review.
    expect((await rita.post('/api/admin/requests/review', { id: 1, decision: 'approve' })).body.error).toBe('forbidden');
  });

  it('carries a proposed resolution for a safety report through to the report', async () => {
    const { admin, supervisor } = await team();
    const customer = browser();
    const rc = await customer.post('/api/auth/request-code', { phone: '912 345 678' });
    await customer.post('/api/auth/verify', { phone: '912 345 678', code: rc.body.devCode });
    await customer.post('/api/support/report', { jobId: 'dfx-1042', category: 'safety', details: 'Smelled of gas' });
    const [report] = (await admin.get('/api/admin/reports')).body.reports as StoredReport[];

    expect((await admin.post('/api/admin/requests', { recordType: 'report', recordId: report!.id, action: 'resolve' })).body.error).toBe('resolution_required');
    const asked = (await admin.post('/api/admin/requests', { recordType: 'report', recordId: report!.id, action: 'resolve', payload: 'Gas company checked, no leak' })).body.request as SignOffRequest;
    await supervisor.post('/api/admin/requests/review', { id: asked.id, decision: 'approve' });
    expect(((await admin.get('/api/admin/reports')).body.reports as StoredReport[])[0]).toMatchObject({ status: 'resolved', resolution: 'Gas company checked, no leak' });
  });
});

describe('the discussion on a record', () => {
  it('takes messages from anyone in the console, for records that exist', async () => {
    const { admin, supervisor } = await team();
    await application();
    const [app] = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];
    const ref = app!.reference!;
    await admin.post('/api/admin/messages', { record: ref, body: 'Is a gas licence enough for boilers?' });
    await supervisor.post('/api/admin/messages', { record: ref, body: 'Yes, for boilers it is.' });
    expect((await admin.post('/api/admin/messages', { record: ref, body: '   ' })).body.error).toBe('empty_message');
    expect((await admin.post('/api/admin/messages', { record: 'A-0000', body: 'Hello' })).status).toBe(404);

    const thread = (await supervisor.post('/api/admin/thread', { record: ref })).body.messages as ConsoleMessage[];
    expect(thread.map((m) => [m.authorName, m.authorRole])).toEqual([
      ['João Costa', 'admin'],
      ['Marta Silva', 'supervisor'],
    ]);
  });
});
