import { vi } from 'vitest';
import { handleApi } from '../server/handlers';
import { memoryStore, setStoreForTests } from '../server/store';

/**
 * Routes the UI's real fetch calls through the real API handlers with a fresh
 * in-memory store — integration in jsdom, no HTTP. Session cookies are carried
 * between calls like a browser would.
 */
export function installPilotApi() {
  setStoreForTests(memoryStore());
  let cookie: string | undefined;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0]!;
      if (!path.startsWith('/api/')) throw new Error(`unexpected fetch in test: ${url}`);
      const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : null;
      const out = await handleApi({ method: init?.method ?? 'GET', path, body, cookieHeader: cookie });
      if (out.setCookie) cookie = out.setCookie.split(';')[0];
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
      cookie = undefined;
    },
  };
}
