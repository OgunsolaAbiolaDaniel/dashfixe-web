import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests } from './store';
import { tokenFromCookieHeader, verifyToken } from './session';
import { cookieJar } from '../test/pilotApi.mock';

beforeEach(() => setStoreForTests(memoryStore()));
afterEach(() => {
  setStoreForTests(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** One browser: requests share a cookie jar, like the real login page. */
function browser() {
  const jar = cookieJar();
  return {
    jar,
    async post(path: string, body: unknown) {
      const out = await handleApi({ method: 'POST', path, body, cookieHeader: jar.header() });
      jar.take(out);
      return out;
    },
  };
}

const post = (path: string, body: unknown) => handleApi({ method: 'POST', path, body });

describe('POST /api/waitlist', () => {
  it('accepts a homeowner email and rejects junk', async () => {
    expect((await post('/api/waitlist', { email: 'ana@example.com' })).status).toBe(200);
    expect((await post('/api/waitlist', { email: 'not-an-email' })).status).toBe(400);
    expect((await post('/api/waitlist', { email: 'a@b.pt', userType: 'ROBOT' })).status).toBe(400);
  });
});

describe('POST /api/artisans/apply', () => {
  it('validates every field and normalises the phone', async () => {
    const good = await post('/api/artisans/apply', {
      fullName: 'Tiago Ferreira',
      phone: '912 345 678',
      email: 'tiago@example.com',
      trade: 'plumbing',
    });
    expect(good.status).toBe(200);
    const noPhone = await post('/api/artisans/apply', {
      fullName: 'X',
      phone: 'abc',
      email: 'x@y.pt',
      trade: 'plumbing',
    });
    expect(noPhone.status).toBe(400);
    expect(noPhone.body.error).toBe('invalid_phone');
  });
});

describe('the login flow (stateless: the pending code rides in a signed cookie)', () => {
  it('issues a code, verifies it, and the session cookie holds', async () => {
    const b = browser();
    const req = await b.post('/api/auth/request-code', { phone: '912345678' });
    expect(req.status).toBe(200);
    // No SMS provider in tests → pilot mode returns the code.
    expect(req.body.delivered).toBe(false);
    const code = req.body.devCode as string;
    expect(code).toMatch(/^\d{6}$/);
    // The challenge cookie never carries the code itself.
    expect(req.setCookie![0]).toMatch(/^dfx_otp=.+HttpOnly/);
    expect(Buffer.from(req.setCookie![0]!.split('=')[1]!.split('.')[0]!, 'base64url').toString()).not.toContain(code);

    const verify = await b.post('/api/auth/verify', { phone: '912345678', code });
    expect(verify.status).toBe(200);
    const session = verify.setCookie!.find((c) => c.startsWith('dfx_session='))!;
    expect(session).toContain('HttpOnly');

    const me = await handleApi({ method: 'GET', path: '/api/auth/me', body: null, cookieHeader: b.jar.header() });
    expect(me.body).toMatchObject({ signedIn: true, phone: '+351912345678' });

    // The token really is signed: tampering kills it.
    const token = tokenFromCookieHeader(session.split(';')[0])!;
    expect(verifyToken(token)).toMatchObject({ phone: '+351912345678' });
    expect(verifyToken(token.slice(0, -2) + 'xx')).toBeNull();
  });

  it('works when request-code and verify hit different server instances', async () => {
    const b = browser();
    const code = (await b.post('/api/auth/request-code', { phone: '912345678' })).body.devCode as string;
    setStoreForTests(memoryStore()); // a cold instance with nothing in memory
    expect((await b.post('/api/auth/verify', { phone: '912345678', code })).status).toBe(200);
  });

  it('rejects a wrong code, burns it after five misses, and refuses a code without its cookie', async () => {
    const b = browser();
    const code = (await b.post('/api/auth/request-code', { phone: '912345678' })).body.devCode as string;

    expect((await b.post('/api/auth/verify', { phone: '912345678', code: '000000' })).body.error).toBe('wrong_code');
    for (let i = 0; i < 4; i++) await b.post('/api/auth/verify', { phone: '912345678', code: '000000' });
    const after = await b.post('/api/auth/verify', { phone: '912345678', code });
    expect(after.status).toBe(429);

    // Another browser (no challenge cookie) cannot use someone else's code.
    const other = browser();
    const code2 = (await b.post('/api/auth/request-code', { phone: '912345678' })).body.devCode as string;
    expect((await other.post('/api/auth/verify', { phone: '912345678', code: code2 })).body.error).toBe('code_expired');
  });

  it('refuses a challenge issued for a different phone', async () => {
    const b = browser();
    const code = (await b.post('/api/auth/request-code', { phone: '912345678' })).body.devCode as string;
    expect((await b.post('/api/auth/verify', { phone: '913000000', code })).status).toBe(401);
  });

  it('expires codes after their TTL', async () => {
    vi.useFakeTimers();
    const b = browser();
    const req = await b.post('/api/auth/request-code', { phone: '912345678' });
    vi.advanceTimersByTime(6 * 60 * 1000);
    const verify = await b.post('/api/auth/verify', { phone: '912345678', code: req.body.devCode as string });
    expect(verify.status).toBe(401);
    expect(verify.body.error).toBe('code_expired');
  });

  it('logs out by clearing the cookie', async () => {
    const out = await post('/api/auth/logout', null);
    expect(out.setCookie![0]).toContain('Max-Age=0');
  });

  it('404s unknown routes', async () => {
    expect((await post('/api/nope', {})).status).toBe(404);
  });
});
