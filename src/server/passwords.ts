/**
 * Admin passwords — salted scrypt from Node's standard library (no dependency).
 * Stored as `scrypt$N$r$p$salt$hash`, so the cost can be raised later without
 * breaking existing hashes. Checks are constant-time. Server-only.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
export const MIN_PASSWORD = 12;
export const MAX_PASSWORD = 200;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password.normalize('NFKC'), salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const key = await scrypt(password, Buffer.from(salt, 'base64url'), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

let decoy: Promise<string> | null = null;

/** Spend the same time as a real check, so an unknown email can't be told apart by timing. */
export async function burnPasswordCheck(password: string): Promise<void> {
  decoy ??= hashPassword(randomBytes(12).toString('base64url'));
  await verifyPassword(password, await decoy);
}

/** A password good enough to store: 12–200 characters. */
export function acceptablePassword(v: unknown): string | null {
  return typeof v === 'string' && v.length >= MIN_PASSWORD && v.length <= MAX_PASSWORD ? v : null;
}
