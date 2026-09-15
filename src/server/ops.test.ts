import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests } from './store';
import { cookieJar } from '../test/pilotApi.mock';

/**
 * /ops (rev 2.8): the founders' review. A signed-in team phone AND the passcode —
 * because in pilot mode anyone can sign in as any phone.
 */
const OWNER = '912 345 678';
const PASSCODE = 'correct horse battery';

beforeEach(() => {
  setStoreForTests(memoryStore());
  vi.stubEnv('OPS_PHONES', `+351 ${OWNER}, 913 000 000`);
  vi.stubEnv('OPS_PASSCODE', PASSCODE);
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

async function apply(fullName: string) {
  await handleApi({
    method: 'POST',
    path: '/api/artisans/apply',
    body: { fullName, phone: '914 111 222', email: 'a@example.com', trade: 'plumbing' },
  });
}

describe('the ops API', () => {
  it('is off until both OPS_PHONES and a long enough OPS_PASSCODE are set', async () => {
    const b = browser();
    await b.signIn(OWNER);
    vi.stubEnv('OPS_PASSCODE', 'short');
    expect((await b.get('/api/ops/applications')).body.error).toBe('ops_disabled');
    vi.stubEnv('OPS_PASSCODE', PASSCODE);
    vi.stubEnv('OPS_PHONES', '');
    expect((await b.get('/api/ops/applications')).status).toBe(503);
  });

  it('turns away visitors, other phones, and the team until the passcode is entered', async () => {
    const b = browser();
    expect((await b.get('/api/ops/applications')).status).toBe(401);

    await b.signIn('915 555 555');
    expect((await b.get('/api/ops/applications')).body.error).toBe('not_ops');
    expect((await b.post('/api/ops/unlock', { passcode: PASSCODE })).body.error).toBe('not_ops');

    await b.signIn(OWNER);
    expect((await b.get('/api/ops/applications')).body.error).toBe('ops_locked');
    expect((await b.post('/api/ops/unlock', { passcode: 'correct horse' })).body.error).toBe('wrong_passcode');
    expect((await b.post('/api/ops/unlock', { passcode: 42 })).status).toBe(403);

    const unlocked = await b.post('/api/ops/unlock', { passcode: PASSCODE });
    expect(unlocked.status).toBe(200);
    expect(unlocked.setCookie?.[0]).toMatch(/^dfx_ops=.*Path=\/api\/ops; HttpOnly;.*SameSite=Strict/);
    expect((await b.get('/api/ops/applications')).status).toBe(200);
  });

  it('binds the unlock to the phone that entered it', async () => {
    const b = browser();
    await b.signIn(OWNER);
    await b.post('/api/ops/unlock', { passcode: PASSCODE });
    await b.signIn('913 000 000'); // the other team phone, same browser
    expect((await b.get('/api/ops/applications')).body.error).toBe('ops_locked');
  });

  it('lists applications newest first and records the review', async () => {
    await apply('Tiago Ferreira');
    await apply('Ana Costa');
    const b = browser();
    await b.signIn(OWNER);
    await b.post('/api/ops/unlock', { passcode: PASSCODE });

    const list = await b.get('/api/ops/applications');
    const apps = list.body.applications as Array<{ id: number; fullName: string; status: string }>;
    expect(apps.map((a) => a.fullName)).toEqual(['Ana Costa', 'Tiago Ferreira']);
    expect(apps.every((a) => a.status === 'received')).toBe(true);
    expect(list.body.persistent).toBe(false);

    const tiago = apps[1]!.id;
    const saved = await b.post('/api/ops/applications/status', { id: tiago, status: 'approved', note: '  Great call, has a van.  ' });
    expect(saved.body.application).toMatchObject({ status: 'approved', note: 'Great call, has a van.', reviewedAt: expect.any(String) });
    const again = (await b.get('/api/ops/applications')).body.applications as Array<{ id: number; status: string }>;
    expect(again.find((a) => a.id === tiago)?.status).toBe('approved');

    expect((await b.post('/api/ops/applications/status', { id: tiago, status: 'hired' })).body.error).toBe('invalid_status');
    expect((await b.post('/api/ops/applications/status', { id: '1', status: 'called' })).body.error).toBe('invalid_id');
    expect((await b.post('/api/ops/applications/status', { id: tiago, status: 'called', note: 'x'.repeat(1001) })).body.error).toBe('invalid_note');
    expect((await b.post('/api/ops/applications/status', { id: 999, status: 'called' })).status).toBe(404);
  });

  it('locks again on Lock and on sign-out', async () => {
    const b = browser();
    await b.signIn(OWNER);
    await b.post('/api/ops/unlock', { passcode: PASSCODE });
    await b.post('/api/ops/lock', {});
    expect((await b.get('/api/ops/applications')).body.error).toBe('ops_locked');

    await b.post('/api/ops/unlock', { passcode: PASSCODE });
    await b.post('/api/auth/logout', {});
    await b.signIn(OWNER);
    expect((await b.get('/api/ops/applications')).body.error).toBe('ops_locked');
  });
});
