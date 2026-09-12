import { vi } from 'vitest';
import { handleApi, type ApiResponse } from '../server/handlers';
import { memoryStore, setStoreForTests } from '../server/store';

/** A tiny browser-like cookie jar: Set-Cookie in, Cookie header out, Max-Age=0 deletes. */
export function cookieJar() {
  const jar = new Map<string, string>();
  return {
    take(out: ApiResponse) {
      for (const c of out.setCookie ?? []) {
        const [pair] = c.split(';');
        const [name, ...rest] = pair!.split('=');
        if (/Max-Age=0\b/.test(c)) jar.delete(name!);
        else jar.set(name!, rest.join('='));
      }
    },
    header(): string | undefined {
      return jar.size ? [...jar].map(([k, v]) => `${k}=${v}`).join('; ') : undefined;
    },
    clear() {
      jar.clear();
    },
  };
}

/**
 * Routes the UI's real fetch calls through the real API handlers with a fresh
 * in-memory store — integration in jsdom, no HTTP. Cookies (the session and the
 * login-code challenge) are carried between calls like a browser would.
 */
export function installPilotApi() {
  setStoreForTests(memoryStore());
  const jar = cookieJar();

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0]!;
      if (!path.startsWith('/api/')) throw new Error(`unexpected fetch in test: ${url}`);
      const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : null;
      const out = await handleApi({ method: init?.method ?? 'GET', path, body, cookieHeader: jar.header() });
      jar.take(out);
      return {
        ok: out.status < 400,
        status: out.status,
        json: async () => out.body,
      } as Response;
    }),
  );

  return {
    reset() {
      setStoreForTests(memoryStore());
      jar.clear();
    },
  };
}
