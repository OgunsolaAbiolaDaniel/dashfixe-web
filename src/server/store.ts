/**
 * Storage for the pilot backend — ARCHITECTURE.md §6.
 *
 * Two drivers behind one interface:
 * - Postgres when DATABASE_URL is set (Neon works as-is). Tables are created on
 *   first use — fine for the pilot; real migrations arrive with the Spring Boot
 *   service if/when the backend outgrows serverless.
 * - In-memory otherwise: `npm run dev` and the tests need no secrets. Dev data
 *   does not survive a restart, and the server says so at startup.
 *
 * This file is server-only. Nothing under src/server may be imported by client code.
 */
import { isAdminRole, type AdminRole } from '../shared/adminRoles.js';

export type WaitlistEntry = { email: string; userType: 'HOMEOWNER' | 'ARTISAN'; createdAt: string };
/** The Dashfixe Pro application's extra answers (/pro/apply, rev 2.3). */
export type ArtisanProfile = {
  /** Other trades besides the primary one. */
  trades: string[];
  experience: string;
  areas: string[];
  availability: string[];
  transport: boolean;
  licences: string[];
  insurance: boolean;
};
export type ArtisanApplication = {
  fullName: string;
  phone: string;
  email: string;
  trade: string;
  /** Present for applications made through /pro/apply. */
  profile?: ArtisanProfile;
  /** Shown to the applicant on their status page. */
  reference?: string;
  createdAt: string;
};

/** Where a founder's review has got to (/ops, rev 2.8). Every application starts `received`. */
export const APPLICATION_STATUSES = ['received', 'called', 'approved', 'declined'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type StoredApplication = ArtisanApplication & {
  id: number;
  status: ApplicationStatus;
  /** The founder's private note from the call. */
  note: string | null;
  reviewedAt: string | null;
};

/** "Report a problem" on a job (rev 2.9): what went wrong, as the customer picks it. */
export const REPORT_CATEGORIES = ['late', 'price', 'quality', 'damage', 'safety', 'other'] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type JobReport = {
  /** The signed-in customer's phone — how the team calls back. */
  phone: string;
  jobId: string;
  category: ReportCategory;
  details: string | null;
  /** Shown to the customer, e.g. R-4821. */
  reference: string;
  createdAt: string;
};
export type StoredReport = JobReport & { id: number };

/** A console account (rev 2.12). The hash never leaves the server. */
export type AdminRecord = {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  /** Set by a Super admin's starting password or reset: the next sign-in must choose a new one. */
  mustChange: boolean;
  disabled: boolean;
  /** Bumped to sign every session of this admin out. */
  sessionVersion: number;
  failedAttempts: number;
  lockedUntil: string | null;
  /** A starting password stops working after this. */
  tempExpiresAt: string | null;
  lastActiveAt: string | null;
  createdBy: number | null;
  createdAt: string;
};
export type NewAdmin = Pick<AdminRecord, 'email' | 'name' | 'role' | 'passwordHash' | 'mustChange' | 'tempExpiresAt' | 'createdBy'>;
export type AdminPatch = Partial<
  Pick<AdminRecord, 'name' | 'role' | 'passwordHash' | 'mustChange' | 'disabled' | 'sessionVersion' | 'failedAttempts' | 'lockedUntil' | 'tempExpiresAt' | 'lastActiveAt'>
>;

/** One line of the console's audit log. `role` is the actor's role at the time. */
export type AuditEvent = {
  id: number;
  at: string;
  adminId: number | null;
  adminName: string | null;
  role: AdminRole | null;
  action: string;
  record: string | null;
  detail: string | null;
};
export type AuditQuery = { limit?: number; adminId?: number; excludeRole?: AdminRole };

/**
 * Login codes are NOT stored here: they ride in a signed cookie (session.ts), so
 * auth works on serverless with no database. Only data worth keeping lives here.
 */
export interface Store {
  /** False for the in-memory driver: what /ops shows is gone after a restart. */
  readonly persistent: boolean;
  addWaitlist(entry: WaitlistEntry): Promise<void>;
  addApplication(app: ArtisanApplication): Promise<void>;
  /** Newest first, at most `limit`. */
  listApplications(limit?: number): Promise<StoredApplication[]>;
  /** The updated application, or null when there is no such id. */
  setApplicationStatus(id: number, status: ApplicationStatus, note: string | null): Promise<StoredApplication | null>;
  addReport(report: JobReport): Promise<void>;
  /** Newest first, at most `limit` — the team reads them on /ops. */
  listReports(limit?: number): Promise<StoredReport[]>;
  /** Upserts the user row; first login is sign-up (phone-first, Uber-style). */
  ensureUser(phone: string): Promise<void>;
  /** Throws when the storage can't be reached — GET /api/health. */
  ping(): Promise<void>;

  // The admin console (rev 2.12)
  countAdmins(): Promise<number>;
  /** Throws Error('email_taken') for a duplicate email. */
  createAdmin(admin: NewAdmin): Promise<AdminRecord>;
  /** First-time setup: creates the admin only while there are none (race-safe). */
  createFirstAdmin(admin: NewAdmin): Promise<AdminRecord | null>;
  getAdmin(id: number): Promise<AdminRecord | null>;
  getAdminByEmail(email: string): Promise<AdminRecord | null>;
  updateAdmin(id: number, patch: AdminPatch): Promise<AdminRecord | null>;
  listAdmins(): Promise<AdminRecord[]>;
  addAudit(event: Omit<AuditEvent, 'id' | 'at'>): Promise<void>;
  /** Newest first. */
  listAudit(query?: AuditQuery): Promise<AuditEvent[]>;
}

// ── In-memory driver (dev + tests) ──────────────────────────────────────────

export function memoryStore(): Store {
  const waitlist: WaitlistEntry[] = [];
  const applications: StoredApplication[] = [];
  const reports: StoredReport[] = [];
  const users = new Set<string>();
  const admins: AdminRecord[] = [];
  const audit: AuditEvent[] = [];
  const createAdmin = async (a: NewAdmin): Promise<AdminRecord> => {
    if (admins.some((x) => x.email === a.email)) throw new Error('email_taken');
    const record: AdminRecord = {
      ...a,
      id: admins.length + 1,
      disabled: false,
      sessionVersion: 1,
      failedAttempts: 0,
      lockedUntil: null,
      lastActiveAt: null,
      createdAt: new Date().toISOString(),
    };
    admins.push(record);
    return { ...record };
  };
  return {
    persistent: false,
    async addWaitlist(entry) {
      waitlist.push(entry);
    },
    async addApplication(app) {
      applications.push({ ...app, id: applications.length + 1, status: 'received', note: null, reviewedAt: null });
    },
    async listApplications(limit = 500) {
      return [...applications].reverse().slice(0, limit);
    },
    async setApplicationStatus(id, status, note) {
      const app = applications.find((a) => a.id === id);
      if (!app) return null;
      Object.assign(app, { status, note, reviewedAt: new Date().toISOString() });
      return { ...app };
    },
    async addReport(report) {
      reports.push({ ...report, id: reports.length + 1 });
    },
    async listReports(limit = 500) {
      return [...reports].reverse().slice(0, limit);
    },
    async ensureUser(phone) {
      users.add(phone);
    },
    async ping() {},
    async countAdmins() {
      return admins.length;
    },
    createAdmin,
    async createFirstAdmin(a) {
      return admins.length ? null : createAdmin(a);
    },
    async getAdmin(id) {
      const a = admins.find((x) => x.id === id);
      return a ? { ...a } : null;
    },
    async getAdminByEmail(email) {
      const a = admins.find((x) => x.email === email);
      return a ? { ...a } : null;
    },
    async updateAdmin(id, patch) {
      const a = admins.find((x) => x.id === id);
      if (!a) return null;
      Object.assign(a, patch);
      return { ...a };
    },
    async listAdmins() {
      return admins.map((a) => ({ ...a }));
    },
    async addAudit(event) {
      audit.push({ ...event, id: audit.length + 1, at: new Date().toISOString() });
    },
    async listAudit({ limit = 200, adminId, excludeRole } = {}) {
      return [...audit]
        .reverse()
        .filter((e) => (adminId === undefined || e.adminId === adminId) && (!excludeRole || (e.role !== null && e.role !== excludeRole)))
        .slice(0, limit);
    },
  };
}

// ── Postgres driver ─────────────────────────────────────────────────────────

const DDL = `
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS artisan_applications (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  trade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS profile JSONB;
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS users (
  phone TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS job_reports (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  job_id TEXT NOT NULL,
  category TEXT NOT NULL,
  details TEXT,
  reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  must_change BOOLEAN NOT NULL DEFAULT true,
  disabled BOOLEAN NOT NULL DEFAULT false,
  session_version INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  temp_expires_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_audit (
  id SERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id INTEGER,
  admin_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  record TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS admin_audit_at ON admin_audit (at DESC, id DESC);
`;

type AdminRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  must_change: boolean;
  disabled: boolean;
  session_version: number;
  failed_attempts: number;
  locked_until: Date | null;
  temp_expires_at: Date | null;
  last_active_at: Date | null;
  created_by: number | null;
  created_at: Date;
};

type AuditRow = {
  id: number;
  at: Date;
  admin_id: number | null;
  admin_name: string | null;
  role: string | null;
  action: string;
  record: string | null;
  detail: string | null;
};

const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);

function adminFromRow(r: AdminRow): AdminRecord {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: isAdminRole(r.role) ? r.role : 'admin',
    passwordHash: r.password_hash,
    mustChange: r.must_change,
    disabled: r.disabled,
    sessionVersion: r.session_version,
    failedAttempts: r.failed_attempts,
    lockedUntil: isoOrNull(r.locked_until),
    tempExpiresAt: isoOrNull(r.temp_expires_at),
    lastActiveAt: isoOrNull(r.last_active_at),
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
  };
}

/** AdminPatch key → column. Only these can be updated. */
const ADMIN_COLUMNS: Record<keyof AdminPatch, string> = {
  name: 'name',
  role: 'role',
  passwordHash: 'password_hash',
  mustChange: 'must_change',
  disabled: 'disabled',
  sessionVersion: 'session_version',
  failedAttempts: 'failed_attempts',
  lockedUntil: 'locked_until',
  tempExpiresAt: 'temp_expires_at',
  lastActiveAt: 'last_active_at',
};

const INSERT_ADMIN =
  'INSERT INTO admins (email, name, role, password_hash, must_change, temp_expires_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
const adminValues = (a: NewAdmin) => [a.email, a.name, a.role, a.passwordHash, a.mustChange, a.tempExpiresAt, a.createdBy];

type ReportRow = {
  id: number;
  phone: string;
  job_id: string;
  category: ReportCategory;
  details: string | null;
  reference: string;
  created_at: Date;
};

const APPLICATION_COLUMNS = 'id, full_name, phone, email, trade, profile, reference, status, note, reviewed_at, created_at';

type ApplicationRow = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  trade: string;
  profile: ArtisanProfile | null;
  reference: string | null;
  status: string;
  note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
};

function fromRow(r: ApplicationRow): StoredApplication {
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    trade: r.trade,
    ...(r.profile ? { profile: r.profile } : {}),
    ...(r.reference ? { reference: r.reference } : {}),
    status: (APPLICATION_STATUSES as readonly string[]).includes(r.status) ? (r.status as ApplicationStatus) : 'received',
    note: r.note,
    reviewedAt: r.reviewed_at ? r.reviewed_at.toISOString() : null,
    createdAt: r.created_at.toISOString(),
  };
}

async function pgStore(databaseUrl: string): Promise<Store> {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  await pool.query(DDL);
  return {
    persistent: true,
    async addWaitlist(entry) {
      await pool.query('INSERT INTO waitlist_entries (email, user_type) VALUES ($1, $2)', [
        entry.email,
        entry.userType,
      ]);
    },
    async addApplication(app) {
      await pool.query(
        'INSERT INTO artisan_applications (full_name, phone, email, trade, profile, reference) VALUES ($1, $2, $3, $4, $5, $6)',
        [app.fullName, app.phone, app.email, app.trade, app.profile ? JSON.stringify(app.profile) : null, app.reference ?? null],
      );
    },
    async listApplications(limit = 500) {
      const { rows } = await pool.query<ApplicationRow>(
        `SELECT ${APPLICATION_COLUMNS} FROM artisan_applications ORDER BY created_at DESC, id DESC LIMIT $1`,
        [limit],
      );
      return rows.map(fromRow);
    },
    async setApplicationStatus(id, status, note) {
      const { rows } = await pool.query<ApplicationRow>(
        `UPDATE artisan_applications SET status = $2, note = $3, reviewed_at = now() WHERE id = $1 RETURNING ${APPLICATION_COLUMNS}`,
        [id, status, note],
      );
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async addReport(r) {
      await pool.query('INSERT INTO job_reports (phone, job_id, category, details, reference) VALUES ($1, $2, $3, $4, $5)', [
        r.phone,
        r.jobId,
        r.category,
        r.details,
        r.reference,
      ]);
    },
    async listReports(limit = 500) {
      const { rows } = await pool.query<ReportRow>(
        'SELECT id, phone, job_id, category, details, reference, created_at FROM job_reports ORDER BY created_at DESC, id DESC LIMIT $1',
        [limit],
      );
      return rows.map((r) => ({
        id: r.id,
        phone: r.phone,
        jobId: r.job_id,
        category: r.category,
        details: r.details,
        reference: r.reference,
        createdAt: r.created_at.toISOString(),
      }));
    },
    async ensureUser(phone) {
      await pool.query('INSERT INTO users (phone) VALUES ($1) ON CONFLICT DO NOTHING', [phone]);
    },
    async ping() {
      await pool.query('SELECT 1');
    },
    async countAdmins() {
      const { rows } = await pool.query<{ n: string }>('SELECT count(*) AS n FROM admins');
      return Number(rows[0]?.n ?? 0);
    },
    async createAdmin(a) {
      try {
        const { rows } = await pool.query<AdminRow>(INSERT_ADMIN, adminValues(a));
        return adminFromRow(rows[0]!);
      } catch (e) {
        // The lib target predates Error's `cause` option; attach it by hand so the original stays inspectable.
        if ((e as { code?: string }).code === '23505') throw Object.assign(new Error('email_taken'), { cause: e });
        throw e;
      }
    },
    async createFirstAdmin(a) {
      // An advisory lock serialises concurrent setups: exactly one can see zero admins.
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(7361)');
        const { rows: count } = await client.query<{ n: string }>('SELECT count(*) AS n FROM admins');
        if (Number(count[0]?.n ?? 0) > 0) {
          await client.query('ROLLBACK');
          return null;
        }
        const { rows } = await client.query<AdminRow>(INSERT_ADMIN, adminValues(a));
        await client.query('COMMIT');
        return adminFromRow(rows[0]!);
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    async getAdmin(id) {
      const { rows } = await pool.query<AdminRow>('SELECT * FROM admins WHERE id = $1', [id]);
      return rows[0] ? adminFromRow(rows[0]) : null;
    },
    async getAdminByEmail(email) {
      const { rows } = await pool.query<AdminRow>('SELECT * FROM admins WHERE email = $1', [email]);
      return rows[0] ? adminFromRow(rows[0]) : null;
    },
    async updateAdmin(id, patch) {
      const values: unknown[] = [id];
      const sets: string[] = [];
      for (const [key, value] of Object.entries(patch)) {
        const column = ADMIN_COLUMNS[key as keyof AdminPatch];
        if (!column || value === undefined) continue;
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }
      const { rows } = sets.length
        ? await pool.query<AdminRow>(`UPDATE admins SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, values)
        : await pool.query<AdminRow>('SELECT * FROM admins WHERE id = $1', [id]);
      return rows[0] ? adminFromRow(rows[0]) : null;
    },
    async listAdmins() {
      const { rows } = await pool.query<AdminRow>('SELECT * FROM admins ORDER BY created_at, id');
      return rows.map(adminFromRow);
    },
    async addAudit(e) {
      await pool.query('INSERT INTO admin_audit (admin_id, admin_name, role, action, record, detail) VALUES ($1, $2, $3, $4, $5, $6)', [
        e.adminId,
        e.adminName,
        e.role,
        e.action,
        e.record,
        e.detail,
      ]);
    },
    async listAudit({ limit = 200, adminId, excludeRole } = {}) {
      const values: unknown[] = [];
      const where: string[] = [];
      if (adminId !== undefined) {
        values.push(adminId);
        where.push(`admin_id = $${values.length}`);
      }
      if (excludeRole) {
        values.push(excludeRole);
        where.push(`role IS NOT NULL AND role <> $${values.length}`);
      }
      values.push(limit);
      const { rows } = await pool.query<AuditRow>(
        `SELECT id, at, admin_id, admin_name, role, action, record, detail FROM admin_audit ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY at DESC, id DESC LIMIT $${values.length}`,
        values,
      );
      return rows.map((r) => ({
        id: r.id,
        at: r.at.toISOString(),
        adminId: r.admin_id,
        adminName: r.admin_name,
        role: isAdminRole(r.role) ? r.role : null,
        action: r.action,
        record: r.record,
        detail: r.detail,
      }));
    },
  };
}

// ── Selection ───────────────────────────────────────────────────────────────

let selected: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!selected) {
    const url = process.env.DATABASE_URL;
    if (url) {
      // A failed connection must not be memoised: the next request tries again,
      // instead of every request failing until the instance is recycled.
      const attempt = pgStore(url);
      attempt.catch(() => {
        if (selected === attempt) selected = null;
      });
      selected = attempt;
    } else {
      console.warn('[dashfixe] DATABASE_URL not set — using the in-memory store (data will not survive a restart).');
      selected = Promise.resolve(memoryStore());
    }
  }
  return selected;
}

/** Test hook: swap the store (and reset the memoised choice). */
export function setStoreForTests(store: Store | null) {
  selected = store ? Promise.resolve(store) : null;
}
