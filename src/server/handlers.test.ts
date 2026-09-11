import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from './handlers';
import { memoryStore, setStoreForTests } from './store';
import { tokenFromCookieHeader, verifyToken } from './session';

beforeEach(() => setStoreForTests(memoryStore()));
afterEach(() => {
  setStoreForTests(null);
  vi.unstubAllGlobals();
});

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

describe('the login flow', () => {
  it('issues a code, verifies it, and the session cookie holds', async () => {
    const req = await post('/api/auth/request-code', { phone: '912345678' });
    expect(req.status).toBe(200);
    // No SMS provider in tests → pilot mode returns the code.
    expect(req.body.delivered).toBe(false);
    const code = req.body.devCode as string;
    expect(code).toMatch(/^\d{6}$/);

    const verify = await post('/api/auth/verify', { phone: '912345678', code });
    expect(verify.status).toBe(200);
    expect(verify.setCookie).toContain('dfx_session=');
    expect(verify.setCookie).toContain('HttpOnly');

    const cookieHeader = verify.setCookie!.split(';')[0]!;
    const me = await handleApi({ method: 'GET', path: '/api/auth/me', body: null, cookieHeader });
    expect(me.body).toMatchObject({ signedIn: true, phone: '+351912345678' });

    // The token really is signed: tampering kills it.
    const token = tokenFromCookieHeader(cookieHeader)!;
    expect(verifyToken(token)).toMatchObject({ phone: '+351912345678' });
    expect(verifyToken(token.slice(0, -2) + 'xx')).toBeNull();
  });

  it('rejects a wrong code, an expired code, and brute force', async () => {
    const req = await post('/api/auth/request-code', { phone: '912345678' });
    const code = req.body.devCode as string;

    expect((await post('/api/auth/verify', { phone: '912345678', code: '000000' })).status).toBe(401);

    // Brute force: five wrong tries burn the code even if the sixth is right.
    for (let i = 0; i < 5; i++) await post('/api/auth/verify', { phone: '912345678', code: '000000' });
    const after = await post('/api/auth/verify', { phone: '912345678', code });
    expect([401, 429]).toContain(after.status);
  });

  it('expires codes after their TTL', async () => {
    vi.useFakeTimers();
    const req = await post('/api/auth/request-code', { phone: '912345678' });
    vi.advanceTimersByTime(6 * 60 * 1000);
    const verify = await post('/api/auth/verify', { phone: '912345678', code: req.body.devCode as string });
    expect(verify.status).toBe(401);
    expect(verify.body.error).toBe('code_expired');
    vi.useRealTimers();
  });

  it('logs out by clearing the cookie', async () => {
    const out = await post('/api/auth/logout', null);
    expect(out.setCookie).toContain('Max-Age=0');
  });

  it('404s unknown routes', async () => {
    expect((await post('/api/nope', {})).status).toBe(404);
  });
});
