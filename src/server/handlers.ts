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
import {
  APPLICATION_STATUSES,
  REPORT_CATEGORIES,
  getStore,
  type ApplicationStatus,
  type ArtisanProfile,
  type ReportCategory,
} from './store.js';
import {
  challengeCookie,
  clearedChallengeCookie,
  clearedOpsCookie,
  clearedSessionCookie,
  codeMatches,
  codeHash,
  issueChallenge,
  issueOpsToken,
  issueToken,
  opsCookie,
  opsUnlocked,
  passcodeMatches,
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

const EXPERIENCE = ['0-2', '3-5', '6-10', '10+'] as const;
const AVAILABILITY = ['weekdays', 'evenings', 'weekends'] as const;
const LICENCES = ['dgeg', 'gas', 'none'] as const;

/** A list drawn from `allowed` (or free text up to 40 chars when `allowed` is omitted). */
function list(v: unknown, max: number, allowed?: readonly string[]): string[] | null {
  if (!Array.isArray(v) || v.length > max) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== 'string') return null;
    const s = item.trim();
    if (!s || s.length > 40 || (allowed && !allowed.includes(s))) return null;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** The Pro application's extra answers, or null when any part is malformed. */
function parseProfile(v: unknown): ArtisanProfile | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  const trades = list(p.trades ?? [], 6);
  const areas = list(p.areas, 8);
  const availability = list(p.availability, 3, AVAILABILITY);
  const licences = list(p.licences ?? [], 3, LICENCES);
  const experience = typeof p.experience === 'string' && (EXPERIENCE as readonly string[]).includes(p.experience) ? p.experience : null;
  if (!trades || !areas?.length || !availability?.length || !licences || !experience) return null;
  if (typeof p.transport !== 'boolean' || typeof p.insurance !== 'boolean') return null;
  return { trades, experience, areas, availability, transport: p.transport, licences, insurance: p.insurance };
}

// ── Founders' ops (/ops, rev 2.8) ───────────────────────────────────────────

/** The team's phones (OPS_PHONES, comma-separated, any format the login accepts). */
function opsPhones(): string[] {
  return (process.env.OPS_PHONES ?? '')
    .split(',')
    .map((p) => normalisePhone(p.trim()))
    .filter((p): p is string => !!p);
}

/** OPS_PASSCODE, or null when it is missing or too short to resist guessing. */
function opsPasscode(): string | null {
  const p = process.env.OPS_PASSCODE ?? '';
  return p.length >= 12 ? p : null;
}

/**
 * Who may use the ops API: a signed-in team phone that has also entered the
 * passcode (session.ts explains why the phone alone is not enough in pilot mode).
 */
function opsGate(req: ApiRequest, needUnlock = true): { phone: string } | { denied: ApiResponse } {
  const phones = opsPhones();
  if (!phones.length || !opsPasscode()) return { denied: bad(503, 'ops_disabled') };
  const session = verifyToken(tokenFromCookieHeader(req.cookieHeader));
  if (!session) return { denied: bad(401, 'not_signed_in') };
  if (!phones.includes(session.phone)) return { denied: bad(403, 'not_ops') };
  if (needUnlock && !opsUnlocked(req.cookieHeader, session.phone)) return { denied: bad(403, 'ops_locked') };
  return { phone: session.phone };
}

const field = (body: unknown, key: string): unknown =>
  typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined;

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
      // The Dashfixe Pro application (/pro/apply) adds a profile, and then consent is required.
      const rawProfile = (req.body as Record<string, unknown>).profile;
      const profile = rawProfile === undefined ? undefined : parseProfile(rawProfile);
      if (profile === null) return bad(400, 'invalid_profile');
      if (profile && (req.body as Record<string, unknown>).consent !== true) return bad(400, 'consent_required');
      const reference = `A-${randomInt(1000, 10_000)}`;
      await (await getStore()).addApplication({
        fullName,
        phone,
        email,
        trade,
        ...(profile ? { profile } : {}),
        reference,
        createdAt: new Date().toISOString(),
      });
      return ok({ ok: true, reference });
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
      return { status: 200, body: { ok: true }, setCookie: [clearedSessionCookie(), clearedOpsCookie()] };

    // "Report a problem" on a job (rev 2.9). Signed-in only: the phone is how the team calls back.
    case 'POST /api/support/report': {
      const session = verifyToken(tokenFromCookieHeader(req.cookieHeader));
      if (!session) return bad(401, 'not_signed_in');
      const jobId = str(req.body, 'jobId', 40);
      const category = field(req.body, 'category');
      const rawDetails = field(req.body, 'details');
      if (!jobId || !/^[\w-]+$/.test(jobId)) return bad(400, 'invalid_job');
      if (typeof category !== 'string' || !(REPORT_CATEGORIES as readonly string[]).includes(category)) return bad(400, 'invalid_category');
      if (rawDetails !== undefined && rawDetails !== null && (typeof rawDetails !== 'string' || rawDetails.length > 1000)) {
        return bad(400, 'invalid_details');
      }
      const details = typeof rawDetails === 'string' && rawDetails.trim() ? rawDetails.trim() : null;
      if (category === 'other' && !details) return bad(400, 'details_required');
      const reference = `R-${randomInt(1000, 10_000)}`;
      await (await getStore()).addReport({
        phone: session.phone,
        jobId,
        category: category as ReportCategory,
        details,
        reference,
        createdAt: new Date().toISOString(),
      });
      return ok({ ok: true, reference });
    }

    case 'GET /api/ops/reports': {
      const gate = opsGate(req);
      if ('denied' in gate) return gate.denied;
      return ok({ reports: await (await getStore()).listReports() });
    }

    case 'POST /api/ops/unlock': {
      const gate = opsGate(req, false);
      if ('denied' in gate) return gate.denied;
      const given = field(req.body, 'passcode');
      if (typeof given !== 'string' || given.length > 200 || !passcodeMatches(given, opsPasscode()!)) {
        return bad(403, 'wrong_passcode');
      }
      return { status: 200, body: { ok: true }, setCookie: [opsCookie(issueOpsToken(gate.phone))] };
    }

    case 'POST /api/ops/lock':
      return { status: 200, body: { ok: true }, setCookie: [clearedOpsCookie()] };

    case 'GET /api/ops/applications': {
      const gate = opsGate(req);
      if ('denied' in gate) return gate.denied;
      const store = await getStore();
      return ok({ applications: await store.listApplications(), persistent: store.persistent });
    }

    case 'POST /api/ops/applications/status': {
      const gate = opsGate(req);
      if ('denied' in gate) return gate.denied;
      const id = field(req.body, 'id');
      const status = field(req.body, 'status');
      const rawNote = field(req.body, 'note');
      if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) return bad(400, 'invalid_id');
      if (typeof status !== 'string' || !(APPLICATION_STATUSES as readonly string[]).includes(status)) return bad(400, 'invalid_status');
      if (rawNote !== undefined && rawNote !== null && (typeof rawNote !== 'string' || rawNote.length > 1000)) return bad(400, 'invalid_note');
      const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : null;
      const application = await (await getStore()).setApplicationStatus(id, status as ApplicationStatus, note);
      return application ? ok({ ok: true, application }) : bad(404, 'not_found');
    }

    default:
      return bad(404, 'not_found');
  }
}
