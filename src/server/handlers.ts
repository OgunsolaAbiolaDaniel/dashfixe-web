/**
 * The pilot API, framework-agnostic — ARCHITECTURE.md §6.
 *
 * One pure-ish function per route, shared by three hosts: the Vercel functions
 * in /api, the Vite dev middleware, and the tests (which call it directly, and
 * whose fetch mock routes the real UI through it). Validation is hand-rolled:
 * four fields do not need a schema library.
 */
import { randomInt } from 'node:crypto';
import { getStore } from './store';
import { clearedSessionCookie, issueToken, sessionCookie, tokenFromCookieHeader, verifyToken } from './session';
import { sendLoginCode } from './sms';

export type ApiRequest = {
  method: string;
  path: string;
  body: unknown;
  cookieHeader?: string;
};

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
  setCookie?: string;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

const bad = (status: number, error: string): ApiResponse => ({ status, body: { error } });
const ok = (body: Record<string, unknown> = { ok: true }): ApiResponse => ({ status: 200, body });

function str(body: unknown, key: string, max = 200): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const v = (body as Record<string, unknown>)[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits, spaces and a leading +; 9–16 digits once normalised. */
function normalisePhone(raw: string): string | null {
  if (!/^[+\d][\d\s-]*$/.test(raw)) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  return raw.startsWith('+') ? `+${digits}` : `+351${digits.replace(/^351/, '')}`;
}

export async function handleApi(req: ApiRequest): Promise<ApiResponse> {
  const store = await getStore();
  const route = `${req.method.toUpperCase()} ${req.path.replace(/\/+$/, '')}`;

  switch (route) {
    case 'POST /api/waitlist': {
      const email = str(req.body, 'email');
      const userType = str(req.body, 'userType') ?? 'HOMEOWNER';
      if (!email || !EMAIL.test(email)) return bad(400, 'invalid_email');
      if (userType !== 'HOMEOWNER' && userType !== 'ARTISAN') return bad(400, 'invalid_user_type');
      await store.addWaitlist({ email, userType, createdAt: new Date().toISOString() });
      return ok();
    }

    case 'POST /api/artisans/apply': {
      const fullName = str(req.body, 'fullName');
      const phoneRaw = str(req.body, 'phone', 32);
      const email = str(req.body, 'email');
      const trade = str(req.body, 'trade', 40);
      const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
      if (!fullName) return bad(400, 'invalid_name');
      if (!phone) return bad(400, 'invalid_phone');
      if (!email || !EMAIL.test(email)) return bad(400, 'invalid_email');
      if (!trade) return bad(400, 'invalid_trade');
      await store.addApplication({ fullName, phone, email, trade, createdAt: new Date().toISOString() });
      return ok();
    }

    case 'POST /api/auth/request-code': {
      const phoneRaw = str(req.body, 'phone', 32);
      const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
      if (!phone) return bad(400, 'invalid_phone');
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await store.putOtp({ phone, code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
      const sent = await sendLoginCode(phone, code);
      // devCode only exists when no SMS provider is configured — pilot mode.
      return ok({ ok: true, delivered: sent.delivered, ...(sent.devCode ? { devCode: sent.devCode } : {}) });
    }

    case 'POST /api/auth/verify': {
      const phoneRaw = str(req.body, 'phone', 32);
      const code = str(req.body, 'code', 10);
      const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
      if (!phone || !code) return bad(400, 'invalid_request');
      const rec = await store.getOtp(phone);
      if (!rec || rec.expiresAt < Date.now()) return bad(401, 'code_expired');
      if ((await store.bumpOtpAttempts(phone)) > MAX_VERIFY_ATTEMPTS) {
        await store.clearOtp(phone);
        return bad(429, 'too_many_attempts');
      }
      if (rec.code !== code) return bad(401, 'wrong_code');
      await store.clearOtp(phone);
      await store.ensureUser(phone);
      return { status: 200, body: { ok: true, phone }, setCookie: sessionCookie(issueToken(phone)) };
    }

    case 'GET /api/auth/me': {
      const session = verifyToken(tokenFromCookieHeader(req.cookieHeader));
      return session ? ok({ signedIn: true, phone: session.phone }) : ok({ signedIn: false });
    }

    case 'POST /api/auth/logout':
      return { status: 200, body: { ok: true }, setCookie: clearedSessionCookie() };

    default:
      return bad(404, 'not_found');
  }
}
