import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests } from './store';
import { cookieJar } from '../test/pilotApi.mock';

/** The admin console API (rev 2.12): setup, sign-in, passwords, team, audit. */
const KEY = 'correct horse battery';
const OWNER = { name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' };

beforeEach(() => {
  setStoreForTests(memoryStore());
  vi.stubEnv('OPS_PASSCODE', KEY);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-15T10:00:00Z'));
});
afterEach(() => {
  setStoreForTests(null);
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function browser() {
  const jar = cookieJar();
  const call = async (method: string, path: string, body: unknown = null, cookieHeader = jar.header()) => {
    const out = await handleApi({ method, path, body, cookieHeader });
    jar.take(out);
    return out;
  };
  return {
    jar,
    get: (path: string) => call('GET', path),
    post: (path: string, body: unknown) => call('POST', path, body),
    /** Replay a request with an old cookie, without touching the jar. */
    with: (cookieHeader: string | undefined, path: string) => handleApi({ method: 'GET', path, body: null, cookieHeader }),
    login: (email: string, password: string) => call('POST', '/api/admin/login', { email, password }),
  };
}

/** The owner claims the console, then adds someone with a starting password. */
async function ownerWithTeam() {
  const owner = browser();
  await owner.post('/api/admin/setup', { key: KEY, ...OWNER });
  const add = async (name: string, email: string, role: string) =>
    (await owner.post('/api/admin/team', { name, email, role, password: `start-${role}-pass` })).body.admin as { id: number };
  const marta = await add('Marta Silva', 'marta@dashfixe.pt', 'supervisor');
  const joao = await add('João Costa', 'joao@dashfixe.pt', 'admin');
  return { owner, marta, joao };
}

/** Sign in with a starting password and replace it. */
async function firstSignIn(email: string, start: string, next: string) {
  const b = browser();
  await b.login(email, start);
  await b.post('/api/admin/password', { current: start, next });
  return b;
}

describe('first-time setup', () => {
  it('needs the setup key, creates one Super admin, then closes', async () => {
    const b = browser();
    expect((await b.get('/api/admin/setup')).body).toEqual({ needed: true, available: true });
    expect((await b.post('/api/admin/setup', { ...OWNER, key: 'a guess of a key' })).body.error).toBe('wrong_key');
    expect((await b.post('/api/admin/setup', { ...OWNER, key: KEY, password: 'short' })).body.error).toBe('weak_password');
    expect((await b.post('/api/admin/setup', { ...OWNER, key: KEY, email: 'nope' })).body.error).toBe('invalid_email');

    const done = await b.post('/api/admin/setup', { key: KEY, ...OWNER, email: '  Owner@Dashfixe.PT ' });
    expect(done.body.admin).toMatchObject({ role: 'super', email: 'owner@dashfixe.pt', mustChange: false });
    expect(JSON.stringify(done.body)).not.toMatch(/scrypt|passwordHash/);
    expect(done.setCookie?.[0]).toMatch(/^dfx_admin=.*Path=\/api\/admin; HttpOnly;.*SameSite=Strict/);
    expect((await b.get('/api/admin/me')).body.admin).toMatchObject({ name: 'Owner', role: 'super' });

    expect((await browser().get('/api/admin/setup')).body.needed).toBe(false);
    expect((await browser().post('/api/admin/setup', { key: KEY, ...OWNER, email: 'second@x.pt' })).status).toBe(409);
  });

  it('stays off without a long enough OPS_PASSCODE', async () => {
    vi.stubEnv('OPS_PASSCODE', 'short');
    expect((await browser().post('/api/admin/setup', { key: 'short', ...OWNER })).status).toBe(503);
  });
});

describe('signing in', () => {
  it('locks an account for 15 minutes after 5 wrong passwords, and logs it', async () => {
    const { owner } = await ownerWithTeam();
    const b = browser();
    for (let i = 0; i < 4; i++) expect((await b.login(OWNER.email, 'wrong-password-x')).status).toBe(401);
    const locked = await b.login(OWNER.email, 'wrong-password-x');
    expect(locked).toMatchObject({ status: 429, body: { error: 'locked' } });
    // Even the right password waits out the lock.
    expect((await b.login(OWNER.email, OWNER.password)).status).toBe(429);
    vi.setSystemTime(new Date('2026-09-15T10:16:00Z'));
    expect((await b.login(OWNER.email, OWNER.password)).status).toBe(200);

    const events = (await owner.get('/api/admin/audit')).body.events as Array<{ action: string; record: string }>;
    expect(events.some((e) => e.action === 'signin.locked' && e.record === OWNER.email)).toBe(true);
  });

  it('answers an unknown email exactly like a wrong password', async () => {
    await ownerWithTeam();
    const unknown = await browser().login('nobody@dashfixe.pt', 'whatever-password');
    const wrong = await browser().login(OWNER.email, 'whatever-password');
    expect(unknown).toEqual(wrong);
  });

  it('makes a starting password work once: change it before anything else, within 72 hours', async () => {
    await ownerWithTeam();
    const joao = browser();
    const first = await joao.login('joao@dashfixe.pt', 'start-admin-pass');
    expect(first.body.admin).toMatchObject({ mustChange: true, role: 'admin' });
    expect((await joao.get('/api/admin/audit')).body.error).toBe('must_change_password');
    expect((await joao.post('/api/admin/password', { current: 'nope', next: 'a-brand-new-pass' })).body.error).toBe('wrong_password');
    expect((await joao.post('/api/admin/password', { current: 'start-admin-pass', next: 'short' })).body.error).toBe('weak_password');
    expect((await joao.post('/api/admin/password', { current: 'start-admin-pass', next: 'start-admin-pass' })).body.error).toBe('same_password');

    const oldSession = joao.jar.header();
    const changed = await joao.post('/api/admin/password', { current: 'start-admin-pass', next: 'a-brand-new-pass' });
    expect(changed.body.admin).toMatchObject({ mustChange: false });
    expect((await joao.get('/api/admin/audit')).status).toBe(200);
    // The session from before the change no longer works anywhere.
    expect((await joao.with(oldSession, '/api/admin/me')).status).toBe(401);
  });

  it('refuses an unused starting password after 72 hours', async () => {
    await ownerWithTeam();
    vi.setSystemTime(new Date('2026-09-18T10:01:00Z'));
    expect((await browser().login('marta@dashfixe.pt', 'start-supervisor-pass')).body.error).toBe('temp_expired');
  });

  it('ends a session after 12 hours', async () => {
    const { owner } = await ownerWithTeam();
    vi.setSystemTime(new Date('2026-09-15T22:01:00Z'));
    expect((await owner.get('/api/admin/me')).status).toBe(401);
  });
});

describe('the team (Super admin only)', () => {
  it('turns away Supervisors and Admins', async () => {
    await ownerWithTeam();
    const marta = await firstSignIn('marta@dashfixe.pt', 'start-supervisor-pass', 'marta-own-password');
    const joao = await firstSignIn('joao@dashfixe.pt', 'start-admin-pass', 'joao-own-password');
    for (const b of [marta, joao]) {
      expect((await b.get('/api/admin/team')).body.error).toBe('forbidden');
      expect((await b.post('/api/admin/team', { name: 'X', email: 'x@x.pt', role: 'super', password: 'long-enough-pass' })).body.error).toBe('forbidden');
      expect((await b.post('/api/admin/team/update', { id: 1, disabled: true })).body.error).toBe('forbidden');
    }
    expect((await browser().get('/api/admin/team')).status).toBe(401);
  });

  it('adds, rejects duplicates, and never shows a password hash', async () => {
    const { owner } = await ownerWithTeam();
    const team = (await owner.get('/api/admin/team')).body.admins as Array<{ email: string; role: string; mustChange: boolean }>;
    expect(team.map((a) => [a.email, a.role, a.mustChange])).toEqual([
      ['owner@dashfixe.pt', 'super', false],
      ['marta@dashfixe.pt', 'supervisor', true],
      ['joao@dashfixe.pt', 'admin', true],
    ]);
    expect(JSON.stringify(team)).not.toMatch(/scrypt|passwordHash/);
    expect((await owner.post('/api/admin/team', { name: 'M', email: 'MARTA@dashfixe.pt', role: 'admin', password: 'long-enough-pass' })).status).toBe(409);
    expect((await owner.post('/api/admin/team', { name: 'M', email: 'm@x.pt', role: 'owner', password: 'long-enough-pass' })).body.error).toBe('invalid_role');
  });

  it("won't let you disable or demote yourself", async () => {
    const { owner } = await ownerWithTeam();
    expect((await owner.post('/api/admin/team/update', { id: 1, disabled: true })).body.error).toBe('not_yourself');
    expect((await owner.post('/api/admin/team/update', { id: 1, role: 'admin' })).body.error).toBe('not_yourself');
  });

  it('disabling or resetting someone signs them out at once', async () => {
    const { owner, marta, joao } = await ownerWithTeam();
    const m = await firstSignIn('marta@dashfixe.pt', 'start-supervisor-pass', 'marta-own-password');
    const j = await firstSignIn('joao@dashfixe.pt', 'start-admin-pass', 'joao-own-password');

    await owner.post('/api/admin/team/update', { id: marta.id, disabled: true });
    expect((await m.get('/api/admin/me')).status).toBe(401);
    expect((await browser().login('marta@dashfixe.pt', 'marta-own-password')).body.error).toBe('disabled');

    const reset = await owner.post('/api/admin/team/update', { id: joao.id, password: 'fresh-start-pass' });
    expect(reset.body.admin).toMatchObject({ mustChange: true });
    expect((await j.get('/api/admin/me')).status).toBe(401);
    expect((await browser().login('joao@dashfixe.pt', 'fresh-start-pass')).body.admin).toMatchObject({ mustChange: true });

    const promoted = await owner.post('/api/admin/team/update', { id: joao.id, role: 'supervisor' });
    expect(promoted.body.admin).toMatchObject({ role: 'supervisor' });
  });
});

describe('the audit log', () => {
  it('shows the Super admin everything, a Supervisor the team, an Admin their own actions', async () => {
    await ownerWithTeam();
    const m = await firstSignIn('marta@dashfixe.pt', 'start-supervisor-pass', 'marta-own-password');
    const j = await firstSignIn('joao@dashfixe.pt', 'start-admin-pass', 'joao-own-password');
    const owner = browser();
    await owner.login(OWNER.email, OWNER.password);

    const all = (await owner.get('/api/admin/audit')).body;
    expect(all.scope).toBe('all');
    expect((all.events as Array<{ action: string }>).map((e) => e.action)).toEqual(
      expect.arrayContaining(['setup', 'team.add', 'password.change', 'signin']),
    );

    const team = (await m.get('/api/admin/audit')).body;
    expect(team.scope).toBe('team');
    expect((team.events as Array<{ role: string }>).every((e) => e.role !== 'super')).toBe(true);
    expect((team.events as Array<{ adminName: string }>).some((e) => e.adminName === 'João Costa')).toBe(true);

    const own = (await j.get('/api/admin/audit')).body;
    expect(own.scope).toBe('own');
    expect((own.events as Array<{ adminName: string }>).every((e) => e.adminName === 'João Costa')).toBe(true);
  });
});
