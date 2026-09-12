/**
 * Stateless auth: HMAC-signed tokens in httpOnly cookies. No dependency, no
 * session table, no OTP table — which is what lets login work on serverless
 * with no database at all (each request may land on a different instance, so
 * nothing auth needs can live in memory). AUTH_SECRET rotates everyone out.
 * Server-only.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'dfx_session';
const OTP_COOKIE = 'dfx_otp';
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

let warned = false;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (!warned) {
    warned = true;
    // The fallback is in a public repo: anyone could forge a session with it.
    console.warn('[dashfixe] AUTH_SECRET not set — using an insecure dev secret. Set it in production.');
  }
  return 'dev-secret-do-not-ship';
}

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

function safeEqual(x: string, y: string): boolean {
  const a = Buffer.from(x);
  const b = Buffer.from(y);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** `payload.mac` — readable by anyone, forgeable by no one without AUTH_SECRET. */
function seal(data: object): string {
  const payload = b64url(Buffer.from(JSON.stringify(data)));
  return `${payload}.${sign(payload)}`;
}

function unseal(token: string | undefined, now: number): Record<string, unknown> | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac || !safeEqual(mac, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
    if (typeof data.exp !== 'number' || data.exp * 1000 < now) return null;
    return data;
  } catch {
    return null;
  }
}

const secure = () => (process.env.NODE_ENV === 'production' ? ' Secure;' : '');

export function cookieFromHeader(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

// ── Sessions ────────────────────────────────────────────────────────────────

export type Session = { phone: string; name?: string };

/** The session carries the display name too, so no profile table is needed yet. */
export function issueToken(phone: string, name?: string, now = Date.now()): string {
  return seal({ phone, ...(name ? { name } : {}), exp: Math.floor(now / 1000) + THIRTY_DAYS_S });
}

export function verifyToken(token: string | undefined, now = Date.now()): Session | null {
  const data = unseal(token, now);
  if (!data || typeof data.phone !== 'string') return null;
  return typeof data.name === 'string' ? { phone: data.phone, name: data.name } : { phone: data.phone };
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure()} SameSite=Lax; Max-Age=${THIRTY_DAYS_S}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function tokenFromCookieHeader(cookieHeader: string | undefined): string | undefined {
  return cookieFromHeader(cookieHeader, SESSION_COOKIE);
}

// ── Login-code challenges ───────────────────────────────────────────────────
//
// The code itself never goes in the cookie — only a keyed hash of it, so the
// cookie is useless without AUTH_SECRET even when real SMS delivery is on.

export type Challenge = { phone: string; hash: string; exp: number; attempts: number };

export function codeHash(phone: string, code: string): string {
  return sign(`otp:${phone}:${code}`);
}

export function codeMatches(challenge: Challenge, code: string): boolean {
  return safeEqual(challenge.hash, codeHash(challenge.phone, code));
}

export function issueChallenge(c: Challenge): string {
  return seal(c);
}

export function readChallenge(cookieHeader: string | undefined, now = Date.now()): Challenge | null {
  const data = unseal(cookieFromHeader(cookieHeader, OTP_COOKIE), now);
  if (!data || typeof data.phone !== 'string' || typeof data.hash !== 'string' || typeof data.attempts !== 'number') {
    return null;
  }
  return data as unknown as Challenge;
}

/** Scoped to the auth endpoints and no longer-lived than the code it carries. */
export function challengeCookie(token: string, maxAgeS: number): string {
  return `${OTP_COOKIE}=${token}; Path=/api/auth; HttpOnly;${secure()} SameSite=Strict; Max-Age=${Math.max(0, Math.ceil(maxAgeS))}`;
}

export function clearedChallengeCookie(): string {
  return `${OTP_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=0`;
}
