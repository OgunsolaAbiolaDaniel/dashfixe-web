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
  /** The admin who owns it in the console (rev 2.13), or nobody yet. */
  ownerId: number | null;
  /** First time it was marked called — the "time to first call" figure. */
  calledAt: string | null;
};
export type ApplicationPatch = Partial<Pick<StoredApplication, 'status' | 'note' | 'reviewedAt' | 'ownerId' | 'calledAt'>>;

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
/** Where the team's handling of a report has got to (rev 2.13). */
export const REPORT_STATUSES = ['open', 'called', 'resolved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type StoredReport = JobReport & {
  id: number;
  status: ReportStatus;
  ownerId: number | null;
  /** What happened and what we did — required to resolve. */
  resolution: string | null;
  calledAt: string | null;
  resolvedAt: string | null;
};
export type ReportPatch = Partial<Pick<StoredReport, 'status' | 'ownerId' | 'resolution' | 'calledAt' | 'resolvedAt'>>;

export type StoredWaitlistEntry = WaitlistEntry & { id: number };

/**
 * Supervisor sign-off (rev 2.14, maker-checker): an Admin asks, a Supervisor
 * approves (which applies it) or sends it back. At most one pending per record.
 */
export const REQUEST_ACTIONS = ['approve', 'decline', 'resolve'] as const;
export type RequestAction = (typeof REQUEST_ACTIONS)[number];
export const REQUEST_STATUSES = ['pending', 'approved', 'returned', 'withdrawn'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type SignOffRequest = {
  id: number;
  recordType: 'application' | 'report';
  recordId: number;
  /** A-7304, #12 or R-4821 — also the discussion thread's name. */
  recordRef: string;
  action: RequestAction;
  /** For `resolve`: the resolution the Admin proposes. */
  payload: string | null;
  note: string | null;
  status: RequestStatus;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};
export type NewRequest = Pick<SignOffRequest, 'recordType' | 'recordId' | 'recordRef' | 'action' | 'payload' | 'note' | 'createdBy' | 'createdByName'>;
export type RequestPatch = Partial<Pick<SignOffRequest, 'status' | 'reviewedBy' | 'reviewedByName' | 'reviewedAt' | 'reviewNote'>>;

/** One line in a record's discussion (rev 2.14). */
export type ConsoleMessage = {
  id: number;
  thread: string;
  authorId: number;
  authorName: string;
  authorRole: AdminRole;
  body: string;
  requestId: number | null;
  createdAt: string;
};

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
export type AuditQuery = { limit?: number; adminId?: number; excludeRole?: AdminRole; /** One record's history, e.g. A-7304. */ record?: string };

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
  getApplication(id: number): Promise<StoredApplication | null>;
  /** reviewedAt/calledAt are set by the caller; null clears. */
  updateApplication(id: number, patch: ApplicationPatch): Promise<StoredApplication | null>;
  addReport(report: JobReport): Promise<void>;
  /** Newest first, at most `limit` — the team reads them on /ops and /admin/reports. */
  listReports(limit?: number): Promise<StoredReport[]>;
  getReport(id: number): Promise<StoredReport | null>;
  updateReport(id: number, patch: ReportPatch): Promise<StoredReport | null>;
  /** Newest first. */
  listWaitlist(limit?: number): Promise<StoredWaitlistEntry[]>;
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

  // Supervisor sign-off and discussion (rev 2.14)
  /** Throws Error('already_requested') while another request on the record is pending. */
  createRequest(request: NewRequest): Promise<SignOffRequest>;
  getRequest(id: number): Promise<SignOffRequest | null>;
  updateRequest(id: number, patch: RequestPatch): Promise<SignOffRequest | null>;
  /** Newest first; `createdBy` narrows to one person's. */
  listRequests(query?: { createdBy?: number; limit?: number }): Promise<SignOffRequest[]>;
  addMessage(message: Omit<ConsoleMessage, 'id' | 'createdAt'>): Promise<ConsoleMessage>;
  /** Oldest first — a conversation reads top to bottom. */
  listMessages(thread: string, limit?: number): Promise<ConsoleMessage[]>;
}

// ── In-memory driver (dev + tests) ──────────────────────────────────────────

export function memoryStore(): Store {
  const waitlist: StoredWaitlistEntry[] = [];
  const applications: StoredApplication[] = [];
  const reports: StoredReport[] = [];
  const users = new Set<string>();
  const admins: AdminRecord[] = [];
  const audit: AuditEvent[] = [];
  const requests: SignOffRequest[] = [];
  const messages: ConsoleMessage[] = [];
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
      waitlist.push({ ...entry, id: waitlist.length + 1 });
    },
    async listWaitlist(limit = 5000) {
      return [...waitlist].reverse().slice(0, limit);
    },
    async addApplication(app) {
      applications.push({ ...app, id: applications.length + 1, status: 'received', note: null, reviewedAt: null, ownerId: null, calledAt: null });
    },
    async getApplication(id) {
      const a = applications.find((x) => x.id === id);
      return a ? { ...a } : null;
    },
    async updateApplication(id, patch) {
      const a = applications.find((x) => x.id === id);
      if (!a) return null;
      Object.assign(a, patch);
      return { ...a };
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
      reports.push({ ...report, id: reports.length + 1, status: 'open', ownerId: null, resolution: null, calledAt: null, resolvedAt: null });
    },
    async listReports(limit = 500) {
      return [...reports].reverse().slice(0, limit);
    },
    async getReport(id) {
      const r = reports.find((x) => x.id === id);
      return r ? { ...r } : null;
    },
    async updateReport(id, patch) {
      const r = reports.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      return { ...r };
    },
    async ensureUser(phone) {
      users.add(phone);
    },
    async ping() {},
    async createRequest(r) {
      if (requests.some((x) => x.status === 'pending' && x.recordType === r.recordType && x.recordId === r.recordId)) {
        throw new Error('already_requested');
      }
      const request: SignOffRequest = {
        ...r,
        id: requests.length + 1,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewNote: null,
      };
      requests.push(request);
      return { ...request };
    },
    async getRequest(id) {
      const r = requests.find((x) => x.id === id);
      return r ? { ...r } : null;
    },
    async updateRequest(id, patch) {
      const r = requests.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      return { ...r };
    },
    async listRequests({ createdBy, limit = 500 } = {}) {
      return [...requests]
        .reverse()
        .filter((r) => createdBy === undefined || r.createdBy === createdBy)
        .slice(0, limit)
        .map((r) => ({ ...r }));
    },
    async addMessage(m) {
      const message: ConsoleMessage = { ...m, id: messages.length + 1, createdAt: new Date().toISOString() };
      messages.push(message);
      return { ...message };
    },
    async listMessages(thread, limit = 500) {
      return messages.filter((m) => m.thread === thread).slice(-limit).map((m) => ({ ...m }));
    },
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
    async listAudit({ limit = 200, adminId, excludeRole, record } = {}) {
      return [...audit]
        .reverse()
        .filter(
          (e) =>
            (adminId === undefined || e.adminId === adminId) &&
            (!excludeRole || (e.role !== null && e.role !== excludeRole)) &&
            (record === undefined || e.record === record),
        )
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
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE artisan_applications ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;
ALTER TABLE job_reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE job_reports ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE job_reports ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE job_reports ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;
ALTER TABLE job_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
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
CREATE INDEX IF NOT EXISTS admin_audit_record ON admin_audit (record);
CREATE TABLE IF NOT EXISTS admin_requests (
  id SERIAL PRIMARY KEY,
  record_type TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  record_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by INTEGER NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by INTEGER,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_requests_one_pending ON admin_requests (record_type, record_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS admin_requests_created ON admin_requests (created_at DESC, id DESC);
CREATE TABLE IF NOT EXISTS admin_messages (
  id SERIAL PRIMARY KEY,
  thread TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  request_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_messages_thread ON admin_messages (thread, created_at, id);
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

type RequestRow = {
  id: number;
  record_type: string;
  record_id: number;
  record_ref: string;
  action: string;
  payload: string | null;
  note: string | null;
  status: string;
  created_by: number;
  created_by_name: string;
  created_at: Date;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: Date | null;
  review_note: string | null;
};

function requestFromRow(r: RequestRow): SignOffRequest {
  return {
    id: r.id,
    recordType: r.record_type === 'report' ? 'report' : 'application',
    recordId: r.record_id,
    recordRef: r.record_ref,
    action: (REQUEST_ACTIONS as readonly string[]).includes(r.action) ? (r.action as RequestAction) : 'approve',
    payload: r.payload,
    note: r.note,
    status: (REQUEST_STATUSES as readonly string[]).includes(r.status) ? (r.status as RequestStatus) : 'pending',
    createdBy: r.created_by,
    createdByName: r.created_by_name,
    createdAt: r.created_at.toISOString(),
    reviewedBy: r.reviewed_by,
    reviewedByName: r.reviewed_by_name,
    reviewedAt: isoOrNull(r.reviewed_at),
    reviewNote: r.review_note,
  };
}

const REQUEST_PATCH: Record<keyof RequestPatch, string> = {
  status: 'status',
  reviewedBy: 'reviewed_by',
  reviewedByName: 'reviewed_by_name',
  reviewedAt: 'reviewed_at',
  reviewNote: 'review_note',
};

type MessageRow = {
  id: number;
  thread: string;
  author_id: number;
  author_name: string;
  author_role: string;
  body: string;
  request_id: number | null;
  created_at: Date;
};

function messageFromRow(r: MessageRow): ConsoleMessage {
  return {
    id: r.id,
    thread: r.thread,
    authorId: r.author_id,
    authorName: r.author_name,
    authorRole: isAdminRole(r.author_role) ? r.author_role : 'admin',
    body: r.body,
    requestId: r.request_id,
    createdAt: r.created_at.toISOString(),
  };
}

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
  status: string;
  owner_id: number | null;
  resolution: string | null;
  called_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
};

const REPORT_COLUMNS = 'id, phone, job_id, category, details, reference, status, owner_id, resolution, called_at, resolved_at, created_at';

function reportFromRow(r: ReportRow): StoredReport {
  return {
    id: r.id,
    phone: r.phone,
    jobId: r.job_id,
    category: r.category,
    details: r.details,
    reference: r.reference,
    status: (REPORT_STATUSES as readonly string[]).includes(r.status) ? (r.status as ReportStatus) : 'open',
    ownerId: r.owner_id,
    resolution: r.resolution,
    calledAt: isoOrNull(r.called_at),
    resolvedAt: isoOrNull(r.resolved_at),
    createdAt: r.created_at.toISOString(),
  };
}

/** Patch key → column, for applications and reports. Only these can be updated. */
const APPLICATION_PATCH: Record<keyof ApplicationPatch, string> = {
  status: 'status',
  note: 'note',
  reviewedAt: 'reviewed_at',
  ownerId: 'owner_id',
  calledAt: 'called_at',
};
const REPORT_PATCH: Record<keyof ReportPatch, string> = {
  status: 'status',
  ownerId: 'owner_id',
  resolution: 'resolution',
  calledAt: 'called_at',
  resolvedAt: 'resolved_at',
};

/** `SET a = $2, b = $3` from a patch, keeping only known keys ($1 is the id). */
function setClause(patch: Record<string, unknown>, columns: Record<string, string>): { sql: string; values: unknown[] } {
  const values: unknown[] = [];
  const sets: string[] = [];
  for (const [key, value] of Object.entries(patch)) {
    const column = columns[key];
    if (!column || value === undefined) continue;
    values.push(value);
    sets.push(`${column} = $${values.length + 1}`);
  }
  return { sql: sets.join(', '), values };
}

const APPLICATION_COLUMNS = 'id, full_name, phone, email, trade, profile, reference, status, note, reviewed_at, owner_id, called_at, created_at';

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
  owner_id: number | null;
  called_at: Date | null;
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
    ownerId: r.owner_id,
    calledAt: isoOrNull(r.called_at),
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
    async listWaitlist(limit = 5000) {
      const { rows } = await pool.query<{ id: number; email: string; user_type: string; created_at: Date }>(
        'SELECT id, email, user_type, created_at FROM waitlist_entries ORDER BY created_at DESC, id DESC LIMIT $1',
        [limit],
      );
      return rows.map((r) => ({
        id: r.id,
        email: r.email,
        userType: r.user_type === 'ARTISAN' ? 'ARTISAN' : 'HOMEOWNER',
        createdAt: r.created_at.toISOString(),
      }));
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
    async getApplication(id) {
      const { rows } = await pool.query<ApplicationRow>(`SELECT ${APPLICATION_COLUMNS} FROM artisan_applications WHERE id = $1`, [id]);
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async updateApplication(id, patch) {
      const { sql, values } = setClause(patch, APPLICATION_PATCH);
      const { rows } = sql
        ? await pool.query<ApplicationRow>(`UPDATE artisan_applications SET ${sql} WHERE id = $1 RETURNING ${APPLICATION_COLUMNS}`, [id, ...values])
        : await pool.query<ApplicationRow>(`SELECT ${APPLICATION_COLUMNS} FROM artisan_applications WHERE id = $1`, [id]);
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
      const { rows } = await pool.query<ReportRow>(`SELECT ${REPORT_COLUMNS} FROM job_reports ORDER BY created_at DESC, id DESC LIMIT $1`, [limit]);
      return rows.map(reportFromRow);
    },
    async getReport(id) {
      const { rows } = await pool.query<ReportRow>(`SELECT ${REPORT_COLUMNS} FROM job_reports WHERE id = $1`, [id]);
      return rows[0] ? reportFromRow(rows[0]) : null;
    },
    async updateReport(id, patch) {
      const { sql, values } = setClause(patch, REPORT_PATCH);
      const { rows } = sql
        ? await pool.query<ReportRow>(`UPDATE job_reports SET ${sql} WHERE id = $1 RETURNING ${REPORT_COLUMNS}`, [id, ...values])
        : await pool.query<ReportRow>(`SELECT ${REPORT_COLUMNS} FROM job_reports WHERE id = $1`, [id]);
      return rows[0] ? reportFromRow(rows[0]) : null;
    },
    async ensureUser(phone) {
      await pool.query('INSERT INTO users (phone) VALUES ($1) ON CONFLICT DO NOTHING', [phone]);
    },
    async ping() {
      await pool.query('SELECT 1');
    },
    async createRequest(r) {
      try {
        const { rows } = await pool.query<RequestRow>(
          'INSERT INTO admin_requests (record_type, record_id, record_ref, action, payload, note, created_by, created_by_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [r.recordType, r.recordId, r.recordRef, r.action, r.payload, r.note, r.createdBy, r.createdByName],
        );
        return requestFromRow(rows[0]!);
      } catch (e) {
        // The partial unique index: one pending request per record.
        if ((e as { code?: string }).code === '23505') throw Object.assign(new Error('already_requested'), { cause: e });
        throw e;
      }
    },
    async getRequest(id) {
      const { rows } = await pool.query<RequestRow>('SELECT * FROM admin_requests WHERE id = $1', [id]);
      return rows[0] ? requestFromRow(rows[0]) : null;
    },
    async updateRequest(id, patch) {
      const { sql, values } = setClause(patch, REQUEST_PATCH);
      const { rows } = sql
        ? await pool.query<RequestRow>(`UPDATE admin_requests SET ${sql} WHERE id = $1 RETURNING *`, [id, ...values])
        : await pool.query<RequestRow>('SELECT * FROM admin_requests WHERE id = $1', [id]);
      return rows[0] ? requestFromRow(rows[0]) : null;
    },
    async listRequests({ createdBy, limit = 500 } = {}) {
      const { rows } =
        createdBy === undefined
          ? await pool.query<RequestRow>('SELECT * FROM admin_requests ORDER BY created_at DESC, id DESC LIMIT $1', [limit])
          : await pool.query<RequestRow>('SELECT * FROM admin_requests WHERE created_by = $1 ORDER BY created_at DESC, id DESC LIMIT $2', [createdBy, limit]);
      return rows.map(requestFromRow);
    },
    async addMessage(m) {
      const { rows } = await pool.query<MessageRow>(
        'INSERT INTO admin_messages (thread, author_id, author_name, author_role, body, request_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [m.thread, m.authorId, m.authorName, m.authorRole, m.body, m.requestId],
      );
      return messageFromRow(rows[0]!);
    },
    async listMessages(thread, limit = 500) {
      const { rows } = await pool.query<MessageRow>(
        'SELECT * FROM (SELECT * FROM admin_messages WHERE thread = $1 ORDER BY created_at DESC, id DESC LIMIT $2) recent ORDER BY created_at, id',
        [thread, limit],
      );
      return rows.map(messageFromRow);
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
    async listAudit({ limit = 200, adminId, excludeRole, record } = {}) {
      const values: unknown[] = [];
      const where: string[] = [];
      if (record !== undefined) {
        values.push(record);
        where.push(`record = $${values.length}`);
      }
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
