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
export type ArtisanApplication = {
  fullName: string;
  phone: string;
  email: string;
  trade: string;
  createdAt: string;
};
export type OtpRecord = { phone: string; code: string; expiresAt: number; attempts: number };

export interface Store {
  addWaitlist(entry: WaitlistEntry): Promise<void>;
  addApplication(app: ArtisanApplication): Promise<void>;
  /** Upserts the user row; first login is sign-up (phone-first, Uber-style). */
  ensureUser(phone: string): Promise<void>;
  putOtp(rec: OtpRecord): Promise<void>;
  getOtp(phone: string): Promise<OtpRecord | null>;
  bumpOtpAttempts(phone: string): Promise<number>;
  clearOtp(phone: string): Promise<void>;
}

// ── In-memory driver (dev + tests) ──────────────────────────────────────────

export function memoryStore(): Store {
  const waitlist: WaitlistEntry[] = [];
  const applications: ArtisanApplication[] = [];
  const users = new Set<string>();
  const otps = new Map<string, OtpRecord>();
  return {
    async addWaitlist(entry) {
      waitlist.push(entry);
    },
    async addApplication(app) {
      applications.push(app);
    },
    async ensureUser(phone) {
      users.add(phone);
    },
    async putOtp(rec) {
      otps.set(rec.phone, rec);
    },
    async getOtp(phone) {
      return otps.get(phone) ?? null;
    },
    async bumpOtpAttempts(phone) {
      const rec = otps.get(phone);
      if (!rec) return 0;
      rec.attempts += 1;
      return rec.attempts;
    },
    async clearOtp(phone) {
      otps.delete(phone);
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
CREATE TABLE IF NOT EXISTS users (
  phone TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INT NOT NULL DEFAULT 0
);
`;

async function pgStore(databaseUrl: string): Promise<Store> {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  await pool.query(DDL);
  return {
    async addWaitlist(entry) {
      await pool.query('INSERT INTO waitlist_entries (email, user_type) VALUES ($1, $2)', [
        entry.email,
        entry.userType,
      ]);
    },
    async addApplication(app) {
      await pool.query(
        'INSERT INTO artisan_applications (full_name, phone, email, trade) VALUES ($1, $2, $3, $4)',
        [app.fullName, app.phone, app.email, app.trade],
      );
    },
    async ensureUser(phone) {
      await pool.query('INSERT INTO users (phone) VALUES ($1) ON CONFLICT DO NOTHING', [phone]);
    },
    async putOtp(rec) {
      await pool.query(
        `INSERT INTO otp_codes (phone, code, expires_at, attempts) VALUES ($1, $2, $3, 0)
         ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = $3, attempts = 0`,
        [rec.phone, rec.code, rec.expiresAt],
      );
    },
    async getOtp(phone) {
      const r = await pool.query('SELECT phone, code, expires_at, attempts FROM otp_codes WHERE phone = $1', [phone]);
      const row = r.rows[0];
      return row ? { phone: row.phone, code: row.code, expiresAt: Number(row.expires_at), attempts: row.attempts } : null;
    },
    async bumpOtpAttempts(phone) {
      const r = await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = $1 RETURNING attempts', [phone]);
      return r.rows[0]?.attempts ?? 0;
    },
    async clearOtp(phone) {
      await pool.query('DELETE FROM otp_codes WHERE phone = $1', [phone]);
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
