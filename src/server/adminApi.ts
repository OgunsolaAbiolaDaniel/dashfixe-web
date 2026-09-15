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
import {
  APPLICATION_STATUSES,
  REPORT_STATUSES,
  REQUEST_ACTIONS,
  getStore,
  type RequestAction,
  type AdminPatch,
  type AdminRecord,
  type ApplicationPatch,
  type ApplicationStatus,
  type ReportPatch,
  type ReportStatus,
  type Store,
} from './store.js';
import { computeStats } from './adminStats.js';
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

type OwnerChange = { change: false } | { change: true; id: number | null; name: string | null } | { error: ApiResponse };

/**
 * Who may own a piece of work. `work.assign` (Supervisor, Super admin) gives it to
 * anyone active; everyone else may only take something unowned, or let go of
 * their own.
 */
async function ownerChange(store: Store, me: AdminRecord, current: number | null, requested: unknown): Promise<OwnerChange> {
  if (requested === undefined || requested === current) return { change: false };
  if (requested !== null && (typeof requested !== 'number' || !Number.isInteger(requested))) return { error: bad(400, 'invalid_owner') };
  if (!can(me.role, 'work.assign')) {
    const taking = requested === me.id && current === null;
    const releasing = requested === null && current === me.id;
    if (!taking && !releasing) return { error: bad(403, 'forbidden') };
  }
  if (requested === null) return { change: true, id: null, name: null };
  const person = await store.getAdmin(requested);
  if (!person || person.disabled) return { error: bad(400, 'invalid_owner') };
  return { change: true, id: person.id, name: person.name };
}

const decided = (status: string) => status === 'approved' || status === 'declined';

/** A record the console knows: an application (A-1234 or #12) or a report (R-1234). */
async function findRecord(store: Store, ref: string) {
  if (/^R-\d+$/.test(ref)) {
    const report = (await store.listReports(5000)).find((r) => r.reference === ref);
    return report ? ({ type: 'report', report } as const) : null;
  }
  const app = (await store.listApplications(5000)).find((a) => (a.reference ?? `#${a.id}`) === ref);
  return app ? ({ type: 'application', app } as const) : null;
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

    // ── The work (rev 2.13) ──

    case 'GET /api/admin/people':
      // Names for owners and history — every signed-in admin needs them; nothing private.
      return ok({ people: (await store.listAdmins()).filter((a) => !a.disabled).map((a) => ({ id: a.id, name: a.name, role: a.role })) });

    case 'GET /api/admin/stats': {
      const [apps, reports, waitlist] = await Promise.all([store.listApplications(5000), store.listReports(5000), store.listWaitlist(20000)]);
      const stats = computeStats(apps, reports, waitlist, now);
      // The waitlist is Supervisor-and-up; Admins get its figure as null.
      return ok({ ...stats, waitlist: can(me.role, 'waitlist.view') ? stats.waitlist : null, persistent: store.persistent });
    }

    case 'GET /api/admin/applications': {
      if (!can(me.role, 'applications.work')) return bad(403, 'forbidden');
      return ok({ applications: await store.listApplications(1000), persistent: store.persistent });
    }

    case 'POST /api/admin/applications/update': {
      if (!can(me.role, 'applications.work')) return bad(403, 'forbidden');
      const id = field(req.body, 'id');
      if (typeof id !== 'number' || !Number.isInteger(id)) return bad(400, 'invalid_id');
      const app = await store.getApplication(id);
      if (!app) return bad(404, 'not_found');
      const status = field(req.body, 'status');
      const note = field(req.body, 'note');
      if (status !== undefined && (typeof status !== 'string' || !(APPLICATION_STATUSES as readonly string[]).includes(status))) return bad(400, 'invalid_status');
      if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > 1000)) return bad(400, 'invalid_note');
      // Deciding, or undoing a decision, is a Supervisor's (an Admin sends a request — PR 3).
      if (typeof status === 'string' && status !== app.status && (decided(status) || decided(app.status)) && !can(me.role, 'applications.decide')) {
        return bad(403, 'needs_supervisor');
      }
      const owner = await ownerChange(store, me, app.ownerId, field(req.body, 'ownerId'));
      if ('error' in owner) return owner.error;

      const stamp = new Date(now).toISOString();
      const patch: ApplicationPatch = {};
      const events: Array<[string, string]> = [];
      if (typeof status === 'string' && status !== app.status) {
        patch.status = status as ApplicationStatus;
        patch.reviewedAt = stamp;
        if (status === 'called' && !app.calledAt) patch.calledAt = stamp;
        events.push(['application.status', `${app.status} → ${status}`]);
      }
      if (note !== undefined) {
        const clean = typeof note === 'string' && note.trim() ? note.trim() : null;
        if (clean !== app.note) {
          patch.note = clean;
          events.push(['application.note', clean ? clean.slice(0, 120) : 'cleared']);
        }
      }
      if (owner.change) {
        patch.ownerId = owner.id;
        events.push(['application.assign', owner.name ?? 'unassigned']);
      }
      const updated = Object.keys(patch).length ? await store.updateApplication(app.id, patch) : app;
      for (const [action, detail] of events) await record(store, me, action, app.reference ?? `#${app.id}`, detail);
      return ok({ ok: true, application: updated });
    }

    case 'GET /api/admin/reports': {
      if (!can(me.role, 'reports.work')) return bad(403, 'forbidden');
      return ok({ reports: await store.listReports(1000) });
    }

    case 'POST /api/admin/reports/update': {
      if (!can(me.role, 'reports.work')) return bad(403, 'forbidden');
      const id = field(req.body, 'id');
      if (typeof id !== 'number' || !Number.isInteger(id)) return bad(400, 'invalid_id');
      const report = await store.getReport(id);
      if (!report) return bad(404, 'not_found');
      const status = field(req.body, 'status');
      const rawResolution = field(req.body, 'resolution');
      if (status !== undefined && (typeof status !== 'string' || !(REPORT_STATUSES as readonly string[]).includes(status))) return bad(400, 'invalid_status');
      if (rawResolution !== undefined && rawResolution !== null && (typeof rawResolution !== 'string' || rawResolution.length > 1000)) return bad(400, 'invalid_resolution');
      const resolution = typeof rawResolution === 'string' ? rawResolution.trim() : '';
      const changing = typeof status === 'string' && status !== report.status;
      if (changing && status === 'resolved') {
        if (resolution.length < 3) return bad(400, 'resolution_required');
        if (report.category === 'safety' && !can(me.role, 'reports.resolveSafety')) return bad(403, 'needs_supervisor');
      }
      // Reopening a resolved report overrules whoever resolved it.
      if (changing && report.status === 'resolved' && !can(me.role, 'reports.resolveSafety')) return bad(403, 'needs_supervisor');
      const owner = await ownerChange(store, me, report.ownerId, field(req.body, 'ownerId'));
      if ('error' in owner) return owner.error;

      const stamp = new Date(now).toISOString();
      const patch: ReportPatch = {};
      const events: Array<[string, string]> = [];
      if (changing) {
        patch.status = status as ReportStatus;
        if (status === 'called' && !report.calledAt) patch.calledAt = stamp;
        if (status === 'resolved') {
          patch.resolution = resolution;
          patch.resolvedAt = stamp;
          patch.calledAt = report.calledAt ?? stamp;
        }
        if (report.status === 'resolved') {
          patch.resolution = null;
          patch.resolvedAt = null;
        }
        events.push(['report.status', status === 'resolved' ? `resolved: ${resolution.slice(0, 120)}` : `${report.status} → ${status}`]);
      }
      if (owner.change) {
        patch.ownerId = owner.id;
        events.push(['report.assign', owner.name ?? 'unassigned']);
      }
      const updated = Object.keys(patch).length ? await store.updateReport(report.id, patch) : report;
      for (const [action, detail] of events) await record(store, me, action, report.reference, detail);
      return ok({ ok: true, report: updated });
    }

    case 'GET /api/admin/waitlist': {
      if (!can(me.role, 'waitlist.view')) return bad(403, 'forbidden');
      return ok({ entries: await store.listWaitlist(20000) });
    }

    case 'POST /api/admin/export': {
      // Exports carry people's emails and phones: Supervisor and up, and always logged.
      if (!can(me.role, 'data.export')) return bad(403, 'forbidden');
      const kind = field(req.body, 'kind');
      let rows: unknown[];
      if (kind === 'waitlist') rows = await store.listWaitlist(20000);
      else if (kind === 'applications') rows = await store.listApplications(5000);
      else if (kind === 'reports') rows = await store.listReports(5000);
      else return bad(400, 'invalid_kind');
      await record(store, me, 'data.export', kind, `${rows.length} rows`);
      return ok({ kind, rows });
    }

    case 'POST /api/admin/history': {
      // One record's story: every change and who made it.
      if (!can(me.role, 'applications.work')) return bad(403, 'forbidden');
      const target = str(req.body, 'record', 40);
      if (!target) return bad(400, 'invalid_record');
      return ok({ events: await store.listAudit({ record: target, limit: 100 }) });
    }

    // ── Supervisor sign-off and discussion (rev 2.14) ──

    case 'GET /api/admin/requests': {
      // Reviewers see every request; everyone else, their own.
      const all = can(me.role, 'requests.review');
      return ok({ scope: all ? 'all' : 'own', requests: await store.listRequests(all ? { limit: 500 } : { createdBy: me.id, limit: 500 }) });
    }

    case 'POST /api/admin/requests': {
      if (!can(me.role, 'requests.create')) return bad(403, 'forbidden');
      const recordType = field(req.body, 'recordType');
      const recordId = field(req.body, 'recordId');
      const action = field(req.body, 'action');
      const rawNote = field(req.body, 'note');
      const rawPayload = field(req.body, 'payload');
      if (recordType !== 'application' && recordType !== 'report') return bad(400, 'invalid_record');
      if (typeof recordId !== 'number' || !Number.isInteger(recordId)) return bad(400, 'invalid_id');
      if (typeof action !== 'string' || !(REQUEST_ACTIONS as readonly string[]).includes(action)) return bad(400, 'invalid_action');
      for (const v of [rawNote, rawPayload]) if (v !== undefined && v !== null && (typeof v !== 'string' || v.length > 1000)) return bad(400, 'invalid_note');
      const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : null;
      const payload = typeof rawPayload === 'string' && rawPayload.trim() ? rawPayload.trim() : null;

      let recordRef: string;
      if (recordType === 'application') {
        const app = await store.getApplication(recordId);
        if (!app) return bad(404, 'not_found');
        if (action !== 'approve' && action !== 'decline') return bad(400, 'invalid_action');
        if (decided(app.status)) return bad(409, 'already_decided');
        recordRef = app.reference ?? `#${app.id}`;
      } else {
        const report = await store.getReport(recordId);
        if (!report) return bad(404, 'not_found');
        if (action !== 'resolve') return bad(400, 'invalid_action');
        if (report.status === 'resolved') return bad(409, 'already_resolved');
        if (!payload || payload.length < 3) return bad(400, 'resolution_required');
        recordRef = report.reference;
      }

      try {
        const request = await store.createRequest({ recordType, recordId, recordRef, action: action as RequestAction, payload, note, createdBy: me.id, createdByName: me.name });
        if (note) await store.addMessage({ thread: recordRef, authorId: me.id, authorName: me.name, authorRole: me.role, body: note, requestId: request.id });
        await record(store, me, 'request.create', recordRef, `${action}${note ? ` — ${note.slice(0, 100)}` : ''}`);
        return ok({ ok: true, request });
      } catch (e) {
        if ((e as Error).message === 'already_requested') return bad(409, 'already_requested');
        throw e;
      }
    }

    case 'POST /api/admin/requests/review': {
      if (!can(me.role, 'requests.review')) return bad(403, 'forbidden');
      const id = field(req.body, 'id');
      const decision = field(req.body, 'decision');
      const rawNote = field(req.body, 'note');
      if (typeof id !== 'number' || !Number.isInteger(id)) return bad(400, 'invalid_id');
      if (decision !== 'approve' && decision !== 'return') return bad(400, 'invalid_decision');
      if (rawNote !== undefined && rawNote !== null && (typeof rawNote !== 'string' || rawNote.length > 1000)) return bad(400, 'invalid_note');
      const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : null;
      if (decision === 'return' && (!note || note.length < 3)) return bad(400, 'note_required');

      const request = await store.getRequest(id);
      if (!request) return bad(404, 'not_found');
      if (request.status !== 'pending') return bad(409, 'not_pending');
      // Maker-checker: whoever asked can never sign their own request off.
      if (request.createdBy === me.id) return bad(403, 'own_request');

      const stamp = new Date(now).toISOString();
      const via = `request #${request.id} from ${request.createdByName}`;
      if (decision === 'approve') {
        if (request.recordType === 'application') {
          const app = await store.getApplication(request.recordId);
          if (!app) return bad(404, 'not_found');
          if (decided(app.status)) return bad(409, 'already_decided');
          const status = request.action === 'decline' ? 'declined' : 'approved';
          await store.updateApplication(app.id, { status, reviewedAt: stamp });
          await record(store, me, 'application.status', request.recordRef, `${app.status} → ${status} (${via})`);
        } else {
          const report = await store.getReport(request.recordId);
          if (!report) return bad(404, 'not_found');
          if (report.status === 'resolved') return bad(409, 'already_resolved');
          await store.updateReport(report.id, { status: 'resolved', resolution: request.payload, resolvedAt: stamp, calledAt: report.calledAt ?? stamp });
          await record(store, me, 'report.status', request.recordRef, `resolved: ${(request.payload ?? '').slice(0, 100)} (${via})`);
        }
      }
      const updated = await store.updateRequest(request.id, {
        status: decision === 'approve' ? 'approved' : 'returned',
        reviewedBy: me.id,
        reviewedByName: me.name,
        reviewedAt: stamp,
        reviewNote: note,
      });
      if (note) await store.addMessage({ thread: request.recordRef, authorId: me.id, authorName: me.name, authorRole: me.role, body: note, requestId: request.id });
      await record(store, me, decision === 'approve' ? 'request.approve' : 'request.return', request.recordRef, `#${request.id}${note ? ` — ${note.slice(0, 100)}` : ''}`);
      return ok({ ok: true, request: updated });
    }

    case 'POST /api/admin/requests/withdraw': {
      const id = field(req.body, 'id');
      if (typeof id !== 'number' || !Number.isInteger(id)) return bad(400, 'invalid_id');
      const request = await store.getRequest(id);
      if (!request) return bad(404, 'not_found');
      if (request.createdBy !== me.id) return bad(403, 'forbidden');
      if (request.status !== 'pending') return bad(409, 'not_pending');
      const updated = await store.updateRequest(request.id, { status: 'withdrawn', reviewedAt: new Date(now).toISOString() });
      await record(store, me, 'request.withdraw', request.recordRef, `#${request.id}`);
      return ok({ ok: true, request: updated });
    }

    case 'POST /api/admin/thread': {
      const ref = str(req.body, 'record', 40);
      if (!ref) return bad(400, 'invalid_record');
      if (!(await findRecord(store, ref))) return bad(404, 'not_found');
      return ok({ messages: await store.listMessages(ref) });
    }

    case 'POST /api/admin/messages': {
      const ref = str(req.body, 'record', 40);
      const body = str(req.body, 'body', 2000);
      if (!ref) return bad(400, 'invalid_record');
      if (!body) return bad(400, 'empty_message');
      if (!(await findRecord(store, ref))) return bad(404, 'not_found');
      const message = await store.addMessage({ thread: ref, authorId: me.id, authorName: me.name, authorRole: me.role, body, requestId: null });
      return ok({ ok: true, message });
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
