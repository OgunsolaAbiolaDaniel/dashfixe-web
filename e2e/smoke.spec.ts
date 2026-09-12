import { expect, test } from '@playwright/test';

/**
 * The launch smoke suite: the handful of journeys that must never break, run
 * against the production bundle. Unit and UI tests (Vitest) cover the detail;
 * these prove the built artefact — chunks, heads, API, cookies — holds together.
 */

test('marketing pages load without the map bundle or console errors', async ({ page }) => {
  const scripts: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/help');
  await expect(page.getByRole('heading', { name: 'Straight answers' })).toBeVisible();
  expect(scripts.filter((u) => /LiveMap|MapCanvas|maplibre/i.test(u))).toEqual([]);
  expect(errors).toEqual([]);
});

test('the explore map loads on demand and draws its markers', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.getByRole('heading', { name: 'Who is free right now' })).toBeVisible();
  await expect(page.locator('.maplibregl-canvas')).toBeAttached();
  // Markers mount once the style has loaded from the tile CDN.
  await expect(page.locator('[data-marker]').first()).toBeAttached({ timeout: 25_000 });
});

test('trade pages ship their own head to crawlers, and the sitemap lists them', async ({ request }) => {
  const html = await (await request.get('/trade/plumbing')).text();
  expect(html).toContain('<title>Plumbers in Amora &amp; Seixal · Dashfixe</title>');
  expect(html).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/og\.png"/);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/trade/cleaning</loc>');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
  expect((await request.get('/og.png')).headers()['content-type']).toContain('image/png');
});

test('deep links and cut pages resolve on a cold load', async ({ page }) => {
  await page.goto('/artisan/tf');
  await expect(page.getByRole('heading', { name: 'Tiago Ferreira' })).toBeVisible();
  await page.goto('/fix');
  await expect(page).toHaveURL(/\/explore$/);
});

test('log in with the pilot code, land on next, and stay signed in', async ({ page }) => {
  await page.goto('/login?next=/activity');
  await page.getByLabel('Phone number').fill('912 345 678');
  await page.getByRole('button', { name: 'Send code' }).click();

  const pilot = page.getByText(/your code is shown here/);
  await expect(pilot).toBeVisible();
  const code = /(\d{6})/.exec((await pilot.textContent()) ?? '')?.[1];
  expect(code).toBeTruthy();
  await page.getByLabel('Code').fill(code!);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  // The httpOnly session cookie survives a full reload.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
});

test('the waitlist form reaches the API', async ({ page }) => {
  await page.goto('/waitlist');
  await page.getByLabel('Email address').first().fill(`smoke+${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Join the waitlist' }).first().click();
  await expect(page.getByText("You're on the list")).toBeVisible();
});
