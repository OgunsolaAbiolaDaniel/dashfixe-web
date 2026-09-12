/**
 * Vercel entry for the whole pilot API — a thin adapter over the shared,
 * framework-agnostic handlers in src/server/handlers.ts. The same handlers run
 * inside `npm run dev` / `vite preview` (middleware) and in the tests.
 *
 * Why one file and a rewrite: outside Next.js, Vercel treats `api/[...path].ts`
 * as a SINGLE dynamic segment, so `/api/auth/request-code` 404'd. vercel.json
 * rewrites every `/api/*` path here instead. The `.js` import extension is
 * required: Vercel runs this as a plain Node ES module.
 */
import { handleApi } from '../src/server/handlers.js';

type NodeReq = {
  method?: string;
  url?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type NodeRes = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): NodeRes;
  json(body: unknown): void;
};

/** The API path the visitor asked for, whether or not the rewrite kept it in req.url. */
function apiPath(rawUrl: string | undefined): string {
  const url = new URL(rawUrl ?? '/', 'http://localhost');
  if (url.pathname !== '/api/router') return url.pathname;
  const rewritten = url.searchParams.get('path');
  return rewritten ? `/api/${rewritten.replace(/^\/+/, '')}` : url.pathname;
}

export default async function handler(req: NodeReq, res: NodeRes) {
  const cookie = req.headers.cookie;
  try {
    const out = await handleApi({
      method: req.method ?? 'GET',
      path: apiPath(req.url),
      body: req.body ?? null,
      cookieHeader: Array.isArray(cookie) ? cookie.join('; ') : cookie,
    });
    if (out.setCookie?.length) res.setHeader('Set-Cookie', out.setCookie);
    res.status(out.status).json(out.body);
  } catch (e) {
    console.error('[dashfixe] api error', e);
    res.status(500).json({ error: 'server_error' });
  }
}
