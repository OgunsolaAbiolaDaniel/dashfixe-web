/**
 * The admin console's API — /api/admin/* (rev 2.12). docs/ARCHITECTURE.md →
 * "The admin console".
 *
 * Its own accounts (email + password), separate from the customer phone login,
 * which in pilot mode signs anyone in. Roles come from shared/adminRoles.ts and
 * are enforced here on every request; the console only hides what this refuses.
 *
 * - First-time setup: while there are no admins, OPS_PASSCODE (the secret the
 *   owner already set) creates the first Super admin. Then setup closes.
 * - Sign-in: 5 wrong passwords lock the account for 15 minutes. A starting
 *   password (set by a Super admin) works once, within 72 hours, and must be
 *   changed at once.
 * - Sessions: 12 hours, bound to a session version that a password change,
 *   reset or disable bumps — signing that admin out everywhere.
 * - Team rules: nobody disables or demotes themselves; the last active Super
 *   admin can't be disabled or demoted.
 * - Everything that changes something is written to the audit log.
 *
 * Server-only; relative imports carry .js (see handlers.ts).
 */
import { ADMIN_ROLES, can, isAdminRole, type AdminRole } from '../shared/adminRoles.js';
import { getStore, type AdminPatch, type AdminRecord, type Store } from './store.js';
import { acceptablePassword, burnPasswordCheck, hashPassword, verifyPassword } from './passwords.js';
import { adminCookie, clearedAdminCookie, issueAdminToken, passcodeMatches, readAdminToken } from './session.js';
import { EMAIL, bad, field, ok, str, type ApiRequest, type ApiResponse } from './http.js';

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;
const TEMP_PASSWORD_MS = 72 * 60 * 60 * 1000;
const ACTIVE_WRITE_MS = 5 * 60 * 1000;

/** OPS_PASSCODE doubles as the one-time setup key; too short and setup stays off. */
function setupKey(): string | null {
  const key = process.env.OPS_PASSCODE ?? '';
  return key.length >= 12 ? key : null;
}

function email(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  return e.length <= 120 && EMAIL.test(e) ? e : null;
}

/** What the console may know about an admin: never the hash. */
export function publicAdmin(a: AdminRecord, now = Date.now()) {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    mustChange: a.mustChange,
    disabled: a.disabled,
    locked: !!a.lockedUntil && Date.parse(a.lockedUntil) > now,
    tempExpired: a.mustChange && !!a.tempExpiresAt && Date.parse(a.tempExpiresAt) < now,
    lastActiveAt: a.lastActiveAt,
    createdAt: a.createdAt,
  };
}

async function record(store: Store, actor: AdminRecord | null, action: string, target?: string | null, detail?: string | null) {
  await store.addAudit({
    adminId: actor?.id ?? null,
    adminName: actor?.name ?? null,
    role: actor?.role ?? null,
    action,
    record: target ?? null,
    detail: detail ?? null,
  });
}

function signedIn(admin: AdminRecord): ApiResponse {
  return {
    status: 200,
    body: { ok: true, admin: publicAdmin(admin) },
    setCookie: [adminCookie(issueAdminToken(admin.id, admin.sessionVersion))],
  };
}

async function currentAdmin(store: Store, req: ApiRequest): Promise<{ admin: AdminRecord; exp: number } | null> {
  const token = readAdminToken(req.cookieHeader);
  if (!token) return null;
  const admin = await store.getAdmin(token.id);
  if (!admin || admin.disabled || admin.sessionVersion !== token.version) return null;
  return { admin, exp: token.exp };
}

export async function handleAdmin(req: ApiRequest): Promise<ApiResponse> {
  const route = `${req.method.toUpperCase()} ${req.path.replace(/\/+$/, '')}`;
  const store = await getStore();
  const now = Date.now();

  // ── Open to anyone ──
  switch (route) {
    case 'GET /api/admin/setup':
      return ok({ needed: (await store.countAdmins()) === 0, available: !!setupKey() });

    case 'POST /api/admin/setup': {
      const key = setupKey();
      if (!key) return bad(503, 'setup_unavailable');
      const given = field(req.body, 'key');
      if (typeof given !== 'string' || given.length > 200 || !passcodeMatches(given, key)) return bad(403, 'wrong_key');
      const name = str(req.body, 'name', 60);
      const address = email(field(req.body, 'email'));
      const password = acceptablePassword(field(req.body, 'password'));
      if (!name) return bad(400, 'invalid_name');
      if (!address) return bad(400, 'invalid_email');
      if (!password) return bad(400, 'weak_password');
      const admin = await store.createFirstAdmin({
        email: address,
        name,
        role: 'super',
        passwordHash: await hashPassword(password),
        mustChange: false,
        tempExpiresAt: null,
        createdBy: null,
      });
      if (!admin) return bad(409, 'already_set_up');
      await record(store, admin, 'setup', admin.email, 'first Super admin');
      return signedIn(admin);
    }

    case 'POST /api/admin/login': {
      const address = email(field(req.body, 'email'));
      const password = field(req.body, 'password');
      if (!address || typeof password !== 'string' || password.length > 200) return bad(401, 'invalid_credentials');
      const admin = await store.getAdminByEmail(address);
      if (!admin) {
        await burnPasswordCheck(password);
        return bad(401, 'invalid_credentials');
      }
      if (admin.lockedUntil && Date.parse(admin.lockedUntil) > now) {
        return { status: 429, body: { error: 'locked', until: admin.lockedUntil } };
      }
      if (!(await verifyPassword(password, admin.passwordHash))) {
        const failed = admin.failedAttempts + 1;
        if (failed >= LOCK_AFTER) {
          const until = new Date(now + LOCK_MS).toISOString();
          await store.updateAdmin(admin.id, { failedAttempts: 0, lockedUntil: until });
          await record(store, null, 'signin.locked', admin.email, `${LOCK_AFTER} wrong passwords · 15 min`);
          return { status: 429, body: { error: 'locked', until } };
        }
        await store.updateAdmin(admin.id, { failedAttempts: failed });
        return bad(401, 'invalid_credentials');
      }
      // The password was right: only now say why it still can't sign in.
      if (admin.disabled) return bad(403, 'disabled');
      if (admin.mustChange && admin.tempExpiresAt && Date.parse(admin.tempExpiresAt) < now) return bad(403, 'temp_expired');
      const updated = await store.updateAdmin(admin.id, { failedAttempts: 0, lockedUntil: null, lastActiveAt: new Date(now).toISOString() });
      await record(store, admin, 'signin');
      return signedIn(updated ?? admin);
    }

    case 'POST /api/admin/logout':
      return { status: 200, body: { ok: true }, setCookie: [clearedAdminCookie()] };
  }

  // ── Signed in ──
  const session = await currentAdmin(store, req);
  if (!session) return bad(401, 'not_signed_in', [clearedAdminCookie()]);
  const me = session.admin;
  if (!me.lastActiveAt || now - Date.parse(me.lastActiveAt) > ACTIVE_WRITE_MS) {
    await store.updateAdmin(me.id, { lastActiveAt: new Date(now).toISOString() });
  }

  switch (route) {
    case 'GET /api/admin/me':
      return ok({ admin: publicAdmin(me, now), sessionEndsAt: new Date(session.exp * 1000).toISOString() });

    case 'POST /api/admin/password': {
      const current = field(req.body, 'current');
      const next = acceptablePassword(field(req.body, 'next'));
      if (typeof current !== 'string' || current.length > 200 || !(await verifyPassword(current, me.passwordHash))) {
        return bad(403, 'wrong_password');
      }
      if (!next) return bad(400, 'weak_password');
      if (next === current) return bad(400, 'same_password');
      const updated = await store.updateAdmin(me.id, {
        passwordHash: await hashPassword(next),
        mustChange: false,
        tempExpiresAt: null,
        sessionVersion: me.sessionVersion + 1,
      });
      await record(store, me, 'password.change', me.email);
      return signedIn(updated!);
    }
  }

  // Until a starting password is replaced, nothing else opens.
  if (me.mustChange) return bad(403, 'must_change_password');

  switch (route) {
    case 'GET /api/admin/team': {
      if (!can(me.role, 'team.manage')) return bad(403, 'forbidden');
      return ok({ admins: (await store.listAdmins()).map((a) => publicAdmin(a, now)) });
    }

    case 'POST /api/admin/team': {
      if (!can(me.role, 'team.manage')) return bad(403, 'forbidden');
      const name = str(req.body, 'name', 60);
      const address = email(field(req.body, 'email'));
      const role = field(req.body, 'role');
      const password = acceptablePassword(field(req.body, 'password'));
      if (!name) return bad(400, 'invalid_name');
      if (!address) return bad(400, 'invalid_email');
      if (!isAdminRole(role)) return bad(400, 'invalid_role');
      if (!password) return bad(400, 'weak_password');
      try {
        const admin = await store.createAdmin({
          email: address,
          name,
          role,
          passwordHash: await hashPassword(password),
          mustChange: true,
          tempExpiresAt: new Date(now + TEMP_PASSWORD_MS).toISOString(),
          createdBy: me.id,
        });
        await record(store, me, 'team.add', admin.email, `role ${role}`);
        return ok({ ok: true, admin: publicAdmin(admin, now) });
      } catch (e) {
        if ((e as Error).message === 'email_taken') return bad(409, 'email_taken');
        throw e;
      }
    }

    case 'POST /api/admin/team/update': {
      if (!can(me.role, 'team.manage')) return bad(403, 'forbidden');
      const id = field(req.body, 'id');
      const role = field(req.body, 'role');
      const disabled = field(req.body, 'disabled');
      const rawPassword = field(req.body, 'password');
      if (typeof id !== 'number' || !Number.isInteger(id)) return bad(400, 'invalid_id');
      if (role !== undefined && !isAdminRole(role)) return bad(400, 'invalid_role');
      if (disabled !== undefined && typeof disabled !== 'boolean') return bad(400, 'invalid_request');
      const password = rawPassword === undefined ? undefined : acceptablePassword(rawPassword);
      if (password === null) return bad(400, 'weak_password');

      const target = await store.getAdmin(id);
      if (!target) return bad(404, 'not_found');
      const demoting = role !== undefined && role !== target.role && target.role === 'super';
      if (target.id === me.id && ((role !== undefined && role !== target.role) || disabled === true)) return bad(400, 'not_yourself');
      if (target.role === 'super' && !target.disabled && (demoting || disabled === true)) {
        const otherSupers = (await store.listAdmins()).filter((a) => a.role === 'super' && !a.disabled && a.id !== target.id);
        if (!otherSupers.length) return bad(400, 'last_super');
      }

      const patch: AdminPatch = {};
      const events: Array<[string, string]> = [];
      if (role !== undefined && role !== target.role) {
        patch.role = role as AdminRole;
        events.push(['team.role', `${target.role} → ${role}`]);
      }
      if (disabled !== undefined && disabled !== target.disabled) {
        patch.disabled = disabled;
        if (disabled) patch.sessionVersion = target.sessionVersion + 1;
        events.push([disabled ? 'team.disable' : 'team.enable', '']);
      }
      if (password) {
        patch.passwordHash = await hashPassword(password);
        patch.mustChange = true;
        patch.tempExpiresAt = new Date(now + TEMP_PASSWORD_MS).toISOString();
        patch.sessionVersion = target.sessionVersion + 1;
        patch.failedAttempts = 0;
        patch.lockedUntil = null;
        events.push(['team.password', 'new starting password']);
      }
      const updated = await store.updateAdmin(target.id, patch);
      for (const [action, detail] of events) await record(store, me, action, target.email, detail || null);
      return ok({ ok: true, admin: publicAdmin(updated!, now) });
    }

    case 'GET /api/admin/audit': {
      const scope = can(me.role, 'audit.all') ? 'all' : can(me.role, 'audit.team') ? 'team' : 'own';
      const events = await store.listAudit(
        scope === 'all' ? { limit: 200 } : scope === 'team' ? { limit: 200, excludeRole: 'super' } : { limit: 200, adminId: me.id },
      );
      return ok({ scope, events });
    }
  }

  return bad(404, 'not_found');
}

/** For tests and docs: the roles, in order of access. */
export const ROLE_ORDER: readonly AdminRole[] = ADMIN_ROLES;
