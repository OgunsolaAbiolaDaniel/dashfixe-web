/**
 * The pilot API, framework-agnostic — ARCHITECTURE.md §6.
 *
 * One pure-ish function per route, shared by three hosts: the Vercel function
 * (api/router.ts), the Vite dev/preview middleware, and the tests (which call it
 * directly, and whose fetch mock routes the real UI through it). Validation is
 * hand-rolled: four fields do not need a schema library.
 *
 * Relative imports under src/server carry `.js`: Vercel runs these files as
 * plain Node ES modules, which do not guess extensions (TypeScript and Vite map
 * `.js` back to the `.ts` source).
 */
import { randomInt } from 'node:crypto';
import { getStore } from './store.js';
import {
  challengeCookie,
  clearedChallengeCookie,
  clearedSessionCookie,
  codeMatches,
  codeHash,
  issueChallenge,
  issueToken,
  readChallenge,
  sessionCookie,
  tokenFromCookieHeader,
  verifyToken,
} from './session.js';
import { sendLoginCode } from './sms.js';

export type ApiRequest = {
  method: string;
  path: string;
  body: unknown;
  cookieHeader?: string;
};

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
  /** Zero or more Set-Cookie header values. */
  setCookie?: string[];
};

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

const bad = (status: number, error: string, setCookie?: string[]): ApiResponse => ({
  status,
  body: { error },
  ...(setCookie ? { setCookie } : {}),
});
const ok = (body: Record<string, unknown> = { ok: true }): ApiResponse => ({ status: 200, body });

function str(body: unknown, key: string, max = 200): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const v = (body as Record<string, unknown>)[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A first name: letters (any script), spaces, apostrophes and hyphens. */
const NAME = /^\p{L}[\p{L}\p{M} '’-]{0,39}$/u;
/** Digits, spaces and a leading +; 9–16 digits once normalised. */
function normalisePhone(raw: string): string | null {
  if (!/^[+\d][\d\s-]*$/.test(raw)) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  return raw.startsWith('+') ? `+${digits}` : `+351${digits.replace(/^351/, '')}`;
}

export async function handleApi(req: ApiRequest): Promise<ApiResponse> {
  const route = `${req.method.toUpperCase()} ${req.path.replace(/\/+$/, '')}`;

  switch (route) {
    case 'POST /api/waitlist': {
      const email = str(req.body, 'email');
      const userType = str(req.body, 'userType') ?? 'HOMEOWNER';
      if (!email || !EMAIL.test(email)) return bad(400, 'invalid_email');
      if (userType !== 'HOMEOWNER' && userType !== 'ARTISAN') return bad(400, 'invalid_user_type');
      await (await getStore()).addWaitlist({ email, userType, createdAt: new Date().toISOString() });
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
      await (await getStore()).addApplication({ fullName, phone, email, trade, createdAt: new Date().toISOString() });
      return ok();
    }

    // Login needs no storage: the pending code rides in a signed, httpOnly,
    // short-lived cookie (session.ts), so it works on serverless without a DB.
    case 'POST /api/auth/request-code': {
      const phoneRaw = str(req.body, 'phone', 32);
      const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
      if (!phone) return bad(400, 'invalid_phone');
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const challenge = { phone, hash: codeHash(phone, code), exp: Math.floor((Date.now() + OTP_TTL_MS) / 1000), attempts: 0 };
      const sent = await sendLoginCode(phone, code);
      return {
        // devCode only exists when no SMS provider is configured — pilot mode.
        ...ok({ ok: true, delivered: sent.delivered, ...(sent.devCode ? { devCode: sent.devCode } : {}) }),
        setCookie: [challengeCookie(issueChallenge(challenge), OTP_TTL_MS / 1000)],
      };
    }

    case 'POST /api/auth/verify': {
      const phoneRaw = str(req.body, 'phone', 32);
      const code = str(req.body, 'code', 10);
      const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
      if (!phone || !code) return bad(400, 'invalid_request');

      const challenge = readChallenge(req.cookieHeader);
      if (!challenge || challenge.phone !== phone) return bad(401, 'code_expired', [clearedChallengeCookie()]);
      if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) return bad(429, 'too_many_attempts', [clearedChallengeCookie()]);

      if (!codeMatches(challenge, code)) {
        // Count the miss by re-issuing the challenge, same expiry.
        const next = { ...challenge, attempts: challenge.attempts + 1 };
        const left = challenge.exp - Date.now() / 1000;
        return bad(401, 'wrong_code', [challengeCookie(issueChallenge(next), left)]);
      }

      // Recording the user is best-effort: a storage hiccup must not lock anyone out.
      try {
        await (await getStore()).ensureUser(phone);
      } catch (e) {
        console.error('[dashfixe] could not record user', e);
      }
      return {
        status: 200,
        body: { ok: true, phone },
        setCookie: [sessionCookie(issueToken(phone)), clearedChallengeCookie()],
      };
    }

    case 'GET /api/auth/me': {
      const session = verifyToken(tokenFromCookieHeader(req.cookieHeader));
      return session ? ok({ signedIn: true, phone: session.phone, name: session.name ?? null }) : ok({ signedIn: false });
    }

    // The display name rides in the session token (re-issued here) — no profile
    // table until accounts need more than a first name.
    case 'POST /api/auth/profile': {
      const session = verifyToken(tokenFromCookieHeader(req.cookieHeader));
      if (!session) return bad(401, 'not_signed_in');
      const name = str(req.body, 'name', 40);
      if (!name || !NAME.test(name)) return bad(400, 'invalid_name');
      return {
        status: 200,
        body: { ok: true, name },
        setCookie: [sessionCookie(issueToken(session.phone, name))],
      };
    }

    case 'POST /api/auth/logout':
      return { status: 200, body: { ok: true }, setCookie: [clearedSessionCookie()] };

    default:
      return bad(404, 'not_found');
  }
}
