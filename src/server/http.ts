/**
 * The pilot API's request/response shapes and the small helpers every route
 * uses — shared by handlers.ts (the public API) and adminApi.ts (the console).
 * Server-only.
 */
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

export const bad = (status: number, error: string, setCookie?: string[]): ApiResponse => ({
  status,
  body: { error },
  ...(setCookie ? { setCookie } : {}),
});

export const ok = (body: Record<string, unknown> = { ok: true }): ApiResponse => ({ status: 200, body });

/** A trimmed, non-empty string field of at most `max` characters, or null. */
export function str(body: unknown, key: string, max = 200): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const v = (body as Record<string, unknown>)[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

/** Any field, unvalidated. */
export const field = (body: unknown, key: string): unknown =>
  typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
