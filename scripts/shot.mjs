/**
 * Headless screenshot helper for pages the in-app preview cannot render
 * (WebGL maps need a real animation frame). Uses raw Chrome DevTools Protocol
 * over Node's built-in WebSocket — no extra dependencies.
 *
 *   node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs] ["js expression"]
 *
 * Looks for a Chromium in CHROME_PATH, then Playwright's cache, then Edge.
 */
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [url, out = 'shot.png', width = '1440', height = '900', waitMs = '8000', probe = ''] = process.argv.slice(2);
if (!url) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs] [probeExpr]');
  process.exit(1);
}

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const pw = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter((n) => n.startsWith('chromium-')).sort().reverse()) {
      const p = join(pw, d, 'chrome-win64', 'chrome.exe');
      if (existsSync(p)) return p;
    }
  }
  for (const p of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ]) if (existsSync(p)) return p;
  throw new Error('No Chromium found. Set CHROME_PATH.');
}

const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn(findChrome(), [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--no-first-run',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let targets;
  for (let i = 0; i < 40; i++) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (targets.length) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      logs.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      logs.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''));
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(+waitMs);

  if (probe) {
    const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true, awaitPromise: true });
    console.log('probe:', JSON.stringify(r.result?.result?.value ?? r.result));
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved', out);
  if (logs.length) console.log('console errors:\n  ' + logs.join('\n  '));
  ws.close();
} finally {
  chrome.kill();
}
