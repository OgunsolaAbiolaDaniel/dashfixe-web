/**
 * Vercel entry for the whole pilot API — a thin adapter over the shared,
 * framework-agnostic handlers in src/server/handlers.ts. The same handlers run
 * inside `npm run dev` (Vite middleware) and in the tests.
 */
import { handleApi } from '../src/server/handlers';

type NodeReq = {
  method?: string;
  url?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type NodeRes = {
  setHeader(name: string, value: string): void;
  status(code: number): NodeRes;
  json(body: unknown): void;
};

export default async function handler(req: NodeReq, res: NodeRes) {
  const path = (req.url ?? '/').split('?')[0]!;
  const cookie = req.headers.cookie;
  const out = await handleApi({
    method: req.method ?? 'GET',
    path,
    body: req.body ?? null,
    cookieHeader: Array.isArray(cookie) ? cookie.join('; ') : cookie,
  });
  if (out.setCookie) res.setHeader('Set-Cookie', out.setCookie);
  res.status(out.status).json(out.body);
}
