import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests, type StoredApplication, type StoredReport, type StoredWaitlistEntry } from './store';
import { computeStats } from './adminStats';
import { cookieJar } from '../test/pilotApi.mock';

/**
 * The console's work (rev 2.13): applications, problem reports, the waitlist,
 * exports and history — and who may do what with them.
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

/** The owner, a Supervisor and an Admin, each signed in with their own password. */
async function team() {
  const owner = browser();
  await owner.post('/api/admin/setup', { key: KEY, name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' });
  const people: Record<string, { id: number }> = {};
  for (const [name, email, role] of [['Marta Silva', 'marta@dashfixe.pt', 'supervisor'], ['João Costa', 'joao@dashfixe.pt', 'admin'], ['Rita Luz', 'rita@dashfixe.pt', 'admin']] as const) {
    people[role === 'supervisor' ? 'marta' : name === 'João Costa' ? 'joao' : 'rita'] = (await owner.post('/api/admin/team', { name, email, role, password: `start-${email}` })).body.admin as { id: number };
  }
  const signIn = async (email: string) => {
    const b = browser();
    await b.post('/api/admin/login', { email, password: `start-${email}` });
    await b.post('/api/admin/password', { current: `start-${email}`, next: `${email}-own-pass` });
    return b;
  };
  return { owner, supervisor: await signIn('marta@dashfixe.pt'), admin: await signIn('joao@dashfixe.pt'), rita: await signIn('rita@dashfixe.pt'), people };
}

async function apply(fullName: string) {
  const out = await handleApi({ method: 'POST', path: '/api/artisans/apply', body: { fullName, phone: '914 111 222', email: 'a@example.com', trade: 'plumbing' } });
  return out.body.reference as string;
}

async function report(category: string, details = 'It went wrong') {
  const customer = browser();
  const rc = await customer.post('/api/auth/request-code', { phone: '912 345 678' });
  await customer.post('/api/auth/verify', { phone: '912 345 678', code: rc.body.devCode });
  return (await customer.post('/api/support/report', { jobId: 'dfx-1042', category, details })).body.reference as string;
}

describe('applications in the console', () => {
  it('lets an Admin call and note, but a decision needs a Supervisor', async () => {
    const { admin, supervisor } = await team();
    const ref = await apply('Tiago Ferreira');
    const [app] = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];
    expect(app).toMatchObject({ status: 'received', ownerId: null, calledAt: null });

    const called = await admin.post('/api/admin/applications/update', { id: app!.id, status: 'called', note: 'Van, gas licence' });
    expect(called.body.application).toMatchObject({ status: 'called', note: 'Van, gas licence', calledAt: expect.any(String) });

    expect((await admin.post('/api/admin/applications/update', { id: app!.id, status: 'approved' })).body.error).toBe('needs_supervisor');
    expect((await supervisor.post('/api/admin/applications/update', { id: app!.id, status: 'approved' })).body.application).toMatchObject({ status: 'approved' });
    // An Admin can't undo a decision either.
    expect((await admin.post('/api/admin/applications/update', { id: app!.id, status: 'called' })).body.error).toBe('needs_supervisor');

    const history = (await admin.post('/api/admin/history', { record: ref })).body.events as Array<{ action: string; adminName: string; detail: string }>;
    // Newest first. One save that calls and notes logs the status, then the note.
    expect(history.map((e) => [e.action, e.adminName, e.detail])).toEqual([
      ['application.status', 'Marta Silva', 'called → approved'],
      ['application.note', 'João Costa', 'Van, gas licence'],
      ['application.status', 'João Costa', 'received → called'],
    ]);
  });

  it('lets an Admin take unowned work or let theirs go; a Supervisor assigns anyone', async () => {
    const { admin, rita, supervisor, people } = await team();
    await apply('Ana Costa');
    const [app] = (await admin.get('/api/admin/applications')).body.applications as StoredApplication[];

    expect((await admin.post('/api/admin/applications/update', { id: app!.id, ownerId: people.rita!.id })).body.error).toBe('forbidden');
    expect((await admin.post('/api/admin/applications/update', { id: app!.id, ownerId: people.joao!.id })).body.application).toMatchObject({ ownerId: people.joao!.id });
    // Rita can't take it from João.
    expect((await rita.post('/api/admin/applications/update', { id: app!.id, ownerId: people.rita!.id })).body.error).toBe('forbidden');
    expect((await admin.post('/api/admin/applications/update', { id: app!.id, ownerId: null })).body.application).toMatchObject({ ownerId: null });

    expect((await supervisor.post('/api/admin/applications/update', { id: app!.id, ownerId: people.rita!.id })).body.application).toMatchObject({ ownerId: people.rita!.id });
    expect((await supervisor.post('/api/admin/applications/update', { id: app!.id, ownerId: 999 })).body.error).toBe('invalid_owner');
  });
});

describe('problem reports in the console', () => {
  it('needs a written resolution, and a Supervisor for safety', async () => {
    const { admin, supervisor } = await team();
    await report('price', 'Asked for €20 more');
    await report('safety', 'Smelled of gas');
    const reports = (await admin.get('/api/admin/reports')).body.reports as StoredReport[];
    const safety = reports.find((r) => r.category === 'safety')!;
    const price = reports.find((r) => r.category === 'price')!;
    expect(price).toMatchObject({ status: 'open', ownerId: null, resolution: null });

    const called = await admin.post('/api/admin/reports/update', { id: price.id, status: 'called' });
    expect(called.body.report).toMatchObject({ status: 'called', calledAt: expect.any(String) });
    expect((await admin.post('/api/admin/reports/update', { id: price.id, status: 'resolved', resolution: ' ' })).body.error).toBe('resolution_required');
    const resolved = await admin.post('/api/admin/reports/update', { id: price.id, status: 'resolved', resolution: 'Refunded the €20' });
    expect(resolved.body.report).toMatchObject({ status: 'resolved', resolution: 'Refunded the €20', resolvedAt: expect.any(String) });
    // Only a Supervisor reopens.
    expect((await admin.post('/api/admin/reports/update', { id: price.id, status: 'open' })).body.error).toBe('needs_supervisor');

    expect((await admin.post('/api/admin/reports/update', { id: safety.id, status: 'resolved', resolution: 'Spoke to both' })).body.error).toBe('needs_supervisor');
    expect((await supervisor.post('/api/admin/reports/update', { id: safety.id, status: 'resolved', resolution: 'Spoke to both' })).body.report).toMatchObject({ status: 'resolved' });
  });
});

describe('the waitlist and exports', () => {
  it('keeps them to Supervisors and up, and logs every export', async () => {
    const { admin, supervisor, owner } = await team();
    await handleApi({ method: 'POST', path: '/api/waitlist', body: { email: 'ana@example.com' } });
    expect((await admin.get('/api/admin/waitlist')).body.error).toBe('forbidden');
    expect((await admin.post('/api/admin/export', { kind: 'waitlist' })).body.error).toBe('forbidden');
    expect((await admin.get('/api/admin/stats')).body.waitlist).toBeNull();

    expect(((await supervisor.get('/api/admin/waitlist')).body.entries as StoredWaitlistEntry[]).map((e) => e.email)).toEqual(['ana@example.com']);
    const exported = await supervisor.post('/api/admin/export', { kind: 'waitlist' });
    expect(exported.body.rows).toHaveLength(1);
    expect((await supervisor.post('/api/admin/export', { kind: 'passwords' })).body.error).toBe('invalid_kind');

    const log = (await owner.get('/api/admin/audit')).body.events as Array<{ action: string; adminName: string; detail: string }>;
    expect(log.find((e) => e.action === 'data.export')).toMatchObject({ adminName: 'Marta Silva', detail: '1 rows' });
  });

  it('gives everyone the team names, but nothing else about them', async () => {
    const { admin } = await team();
    const people = (await admin.get('/api/admin/people')).body.people as Array<Record<string, unknown>>;
    expect(people).toHaveLength(4);
    expect(Object.keys(people[0]!).sort()).toEqual(['id', 'name', 'role']);
  });
});

describe('the overview figures', () => {
  const NOW = Date.parse('2026-09-15T12:00:00Z');
  const hours = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
  const app = (id: number, status: StoredApplication['status'], createdH: number, calledH?: number, extra: Partial<StoredApplication> = {}): StoredApplication => ({
    id,
    fullName: `A${id}`,
    phone: '+351900000000',
    email: 'a@x.pt',
    trade: 'plumbing',
    createdAt: hours(createdH),
    status,
    note: null,
    reviewedAt: null,
    ownerId: null,
    calledAt: calledH === undefined ? null : hours(calledH),
    ...extra,
  });

  it('counts, buckets, finds the median first call and the coverage', () => {
    const apps = [
      app(1, 'received', 2),
      app(2, 'received', 60), // over the 48 h target
      app(3, 'called', 30, 26), // called after 4 h
      app(4, 'approved', 200, 190, { profile: { trades: ['carpentry'], experience: '6-10', areas: ['Amora', 'Seixal'], availability: ['weekdays'], transport: true, licences: [], insurance: true } }), // 10 h
      app(5, 'declined', 100, 98), // 2 h
    ];
    const reports: StoredReport[] = [
      { id: 1, phone: 'p', jobId: 'dfx-1', category: 'safety', details: null, reference: 'R-1', createdAt: hours(2), status: 'open', ownerId: null, resolution: null, calledAt: null, resolvedAt: null },
      { id: 2, phone: 'p', jobId: 'dfx-2', category: 'price', details: null, reference: 'R-2', createdAt: hours(3), status: 'open', ownerId: null, resolution: null, calledAt: null, resolvedAt: null },
    ];
    const s = computeStats(apps, reports, [{ id: 1, email: 'w@x.pt', userType: 'HOMEOWNER', createdAt: hours(1) }], NOW);

    expect(s.applications.byStatus).toEqual({ received: 2, called: 1, approved: 1, declined: 1 });
    expect(s.applications.new7).toBe(4);
    expect(s.applications.prev7).toBe(1);
    // 2 h, 30 h, 60 h and 100 h old → 0, 1, 2 and 4 days ago; oldest bucket first.
    expect(s.applications.daily).toEqual([0, 0, 1, 0, 1, 1, 1]);
    expect(s.applications.overdue).toBe(1);
    expect(s.applications.oldestWaitingAt).toBe(hours(60));
    expect(s.applications.medianFirstCallMs).toBe(4 * 3_600_000); // first calls after 2 h, 4 h and 10 h
    expect(s.applications.approvalRate).toBe(0.5);
    expect(s.reports).toMatchObject({ open: 2, safetyOpen: 1, overdue: 1 }); // the safety one is past its 1 h
    expect(s.coverage).toEqual({ plumbing: { Amora: 1, Seixal: 1 }, carpentry: { Amora: 1, Seixal: 1 } });
    expect(s.waitlist).toMatchObject({ total: 1, new7: 1 });
  });
});
