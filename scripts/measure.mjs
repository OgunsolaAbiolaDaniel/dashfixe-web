/**
 * Cold-load timings of a built dist/ on a throttled phone — how rev 2.7's numbers in
 * docs/HANDOVER.md were taken. Serves the folder with gzip (like Vercel), then loads
 * each page 5 times in a fresh context: 412px wide, 4x CPU, 1.6 Mbps / 150 ms.
 *
 *   npx vite build && node scripts/measure.mjs dist "after"
 *
 * Copy dist/ aside before a change to compare against it. Vercel serves HTTP/2; to
 * match it (many small chunks cost more on HTTP/1.1), pass a throwaway certificate:
 *   openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 -subj /CN=localhost
 *   KEY=key.pem CERT=cert.pem node scripts/measure.mjs dist
 * PW_CHANNEL=msedge (or chrome) reuses an installed browser, as in playwright.config.ts.
 */
import http from 'node:http';
import http2 from 'node:http2';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import zlib from 'node:zlib';
import { chromium } from '@playwright/test';

const dist = process.argv[2] ?? 'dist';
const label = process.argv[3] ?? dist;
const H2 = !!(process.env.KEY && process.env.CERT);
const PORT = 4190;
const ORIGIN = `${H2 ? 'https' : 'http'}://localhost:${PORT}`;
const PAGES = ['/', '/trade/plumbing', '/pro', '/help', '/explore'];
const RUNS = 5;
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

// A static server with cleanUrls and the SPA fallback; the API answers "signed out".
const handler = (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  if (path.startsWith('/api/')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end('{"signedIn":false}');
  }
  let file = join(dist, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = existsSync(`${file}.html`) ? `${file}.html` : join(dist, 'index.html');
  let body = readFileSync(file);
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const headers = { 'content-type': type };
  if (/text|javascript|json|xml|manifest/.test(type)) {
    body = zlib.gzipSync(body);
    headers['content-encoding'] = 'gzip';
  }
  res.writeHead(200, headers);
  res.end(body);
};
const server = (
  H2
    ? http2.createSecureServer({ key: readFileSync(process.env.KEY), cert: readFileSync(process.env.CERT), allowHTTP1: true }, handler)
    : http.createServer(handler)
).listen(PORT);

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const rows = [];
for (const path of PAGES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 412, height: 823 }, locale: 'en-GB' });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const urls = new Map();
    let bytes = 0;
    let js = 0;
    cdp.on('Network.responseReceived', (e) => urls.set(e.requestId, e.response.url));
    cdp.on('Network.loadingFinished', (e) => {
      const url = urls.get(e.requestId) ?? '';
      if (!url.startsWith(ORIGIN)) return;
      bytes += e.encodedDataLength;
      if (url.endsWith('.js')) js += e.encodedDataLength;
    });
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      localStorage.setItem('dfx.loc', 'asked'); // no location card over the page
    });
    await page.goto(ORIGIN + path, { waitUntil: 'load' });
    // Bytes up to `load`: the idle warm-up of other pages afterwards isn't this visit's cost.
    const atLoad = { bytes, js };
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      lcp: window.__lcp,
      load: performance.getEntriesByType('navigation')[0].loadEventEnd,
    }));
    runs.push({ ...m, ...atLoad });
    await ctx.close();
  }
  const median = (k) => runs.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(RUNS / 2)];
  rows.push({
    path,
    fcp: Math.round(median('fcp')),
    lcp: Math.round(median('lcp')),
    load: Math.round(median('load')),
    kB: Math.round(median('bytes') / 1024),
    jsKB: Math.round(median('js') / 1024),
  });
}
await browser.close();
server.close();
console.log(`\n${label}  (${H2 ? 'HTTP/2' : 'HTTP/1.1'}, 412px, 4x CPU, 1.6 Mbps / 150 ms, gzip; median of ${RUNS})`);
console.table(rows);
