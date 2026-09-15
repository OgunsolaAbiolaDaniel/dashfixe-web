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
}

// ── In-memory driver (dev + tests) ──────────────────────────────────────────

export function memoryStore(): Store {
  const waitlist: WaitlistEntry[] = [];
  const applications: StoredApplication[] = [];
  const reports: StoredReport[] = [];
  const users = new Set<string>();
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
`;

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
  };
}

// ── Selection ───────────────────────────────────────────────────────────────

let selected: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!selected) {
    const url = process.env.DATABASE_URL;
    if (url) {
      selected = pgStore(url);
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
