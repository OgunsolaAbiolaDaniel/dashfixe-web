/**
 * The client's one door to the pilot API — ARCHITECTURE.md §6. Same-origin
 * JSON; cookies ride along for the session. Every failure collapses to a
 * result object so forms can render one honest error state.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function api<T = { ok: true }>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, status: res.status, error: String(data.error ?? 'request_failed') };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: 'network' };
  }
}
