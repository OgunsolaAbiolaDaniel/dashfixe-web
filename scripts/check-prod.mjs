/**
 * Production smoke check — runs against the REAL deployment, not a local server.
 *
 *   node scripts/check-prod.mjs [https://dashfixe-web.vercel.app]
 *
 * Why it exists: `vite preview` (where the Playwright suite runs) is not Vercel.
 * Routing (rewrites, cleanUrls), the serverless API and the env vars only exist
 * in production — rev 1.6 shipped a cleanUrls + rewrite combination that 404'd
 * every non-prerendered page on a cold load while every local test passed. CI runs
 * this after each successful production deploy (.github/workflows/prod-check.yml).
 *
 * Exits non-zero on any failure. No dependencies; Node 20+ (global fetch, crypto).
 */
import { createHmac } from 'node:crypto';

const BASE = (process.argv[2] || process.env.PROD_URL || 'https://dashfixe-web.vercel.app').replace(/\/+$/, '');
const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ ok: true, name, detail: detail ?? '' });
  } catch (e) {
    results.push({ ok: false, name, detail: e.message });
  }
};
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const get = (path, init) => fetch(BASE + path, { redirect: 'manual', ...init });

// ── Pages load cold (a refresh or a shared link, not a click inside the app) ──
for (const path of ['/', '/explore', '/explore?when=later&day=20&win=4', '/login', '/activity', '/account', '/pro', '/pro/app', '/pro/apply', '/pro/application', '/pro/login', '/pro/dashboard', '/job/dfx-1042', '/artisan/tf', '/how-it-works', '/trade/plumbing', '/help', '/no-such-page']) {
  await check(`GET ${path} serves the app`, async () => {
    const r = await get(path);
    const type = r.headers.get('content-type') ?? '';
    expect(r.status === 200, `status ${r.status}`);
    expect(type.includes('text/html'), `content-type ${type}`);
    expect((await r.text()).includes('<div id="root">'), 'not the app shell');
    return `${r.status}`;
  });
}

// ── Static assets and SEO files ──
await check('trade page ships its own <title> to crawlers', async () => {
  const html = await (await get('/trade/plumbing')).text();
  expect(/<title>Plumbers in Amora/.test(html), 'wrong or missing title');
});
await check('favicon.ico is an icon', async () => {
  const r = await get('/favicon.ico');
  expect(r.status === 200 && /icon|image/.test(r.headers.get('content-type') ?? ''), `${r.status} ${r.headers.get('content-type')}`);
});
await check('manifest.webmanifest is served', async () => {
  const r = await get('/manifest.webmanifest');
  expect(r.status === 200, `status ${r.status}`);
  expect((await r.json()).short_name === 'Dashfixe', 'unexpected manifest');
});
await check('robots.txt keeps the private pages out', async () => {
  const txt = await (await get('/robots.txt')).text();
  expect(txt.includes('Disallow: /activity') && txt.includes('Disallow: /account'), 'missing Disallow for /activity or /account');
});
await check('/for-artisans permanently redirects to /pro', async () => {
  const r = await get('/for-artisans');
  expect([301, 308].includes(r.status), `status ${r.status}`);
  expect((r.headers.get('location') ?? '').replace(/^https?:\/\/[^/]+/, '') === '/pro', `location ${r.headers.get('location')}`);
});
await check('sitemap lists /how-it-works and not the parked waitlist', async () => {
  const xml = await (await get('/sitemap.xml')).text();
  expect(xml.includes('/how-it-works</loc>'), 'missing /how-it-works');
  expect(!xml.includes('/waitlist'), 'waitlist is listed');
});

// ── The API, end to end: pilot login with a name ──
await check('login: request-code → verify → name → me', async () => {
  const post = (path, body, cookie) =>
    get(path, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const jar = new Map();
  const take = (r) => {
    for (const c of r.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const [k, ...v] = pair.split('=');
      if (/Max-Age=0\b/.test(c)) jar.delete(k);
      else jar.set(k, v.join('='));
    }
  };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

  const rc = await post('/api/auth/request-code', { phone: '912 345 678' });
  take(rc);
  const body = await rc.json();
  expect(rc.status === 200, `request-code ${rc.status}`);
  if (body.delivered) return 'SMS is live — code sent by text, verify skipped';
  expect(body.devCode, 'no pilot code returned');

  const v = await post('/api/auth/verify', { phone: '912 345 678', code: body.devCode }, cookie());
  take(v);
  expect(v.status === 200, `verify ${v.status}`);
  const p = await post('/api/auth/profile', { name: 'Smoke' }, cookie());
  take(p);
  expect(p.status === 200, `profile ${p.status}`);
  const me = await (await get('/api/auth/me', { headers: { cookie: cookie() } })).json();
  expect(me.signedIn && me.name === 'Smoke', `me ${JSON.stringify(me)}`);
  return 'pilot mode (on-screen code)';
});

// ── Security: AUTH_SECRET must be set — a token signed with the public fallback key must fail ──
await check('forged session (public fallback key) is rejected', async () => {
  const payload = Buffer.from(JSON.stringify({ phone: '+351900000001', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  const mac = createHmac('sha256', 'dev-secret-do-not-ship').update(payload).digest('base64url');
  const me = await (await get('/api/auth/me', { headers: { cookie: `dfx_session=${payload}.${mac}` } })).json();
  expect(me.signedIn === false, 'ACCEPTED — AUTH_SECRET is not set in production');
});

// ── Report ──
const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${BASE}: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
