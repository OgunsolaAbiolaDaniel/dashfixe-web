/**
 * Stateless sessions: an HMAC-signed token in an httpOnly cookie. No dependency,
 * no session table; AUTH_SECRET rotates everyone out. Server-only.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'dfx_session';
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  console.warn('[dashfixe] AUTH_SECRET not set — using an insecure dev secret. Set it in production.');
  return 'dev-secret-do-not-ship';
}

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

export function issueToken(phone: string, now = Date.now()): string {
  const payload = b64url(Buffer.from(JSON.stringify({ phone, exp: Math.floor(now / 1000) + THIRTY_DAYS_S })));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined, now = Date.now()): { phone: string } | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { phone?: string; exp?: number };
    if (typeof data.phone !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp * 1000 < now) return null;
    return { phone: data.phone };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${THIRTY_DAYS_S}`;
}

export function clearedSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function tokenFromCookieHeader(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return undefined;
}
