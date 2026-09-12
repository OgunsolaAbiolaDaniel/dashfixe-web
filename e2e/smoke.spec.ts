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
  expect(html).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/og\.jpg"/);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/trade/cleaning</loc>');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
  expect((await request.get('/og.jpg')).headers()['content-type']).toContain('image/jpeg');
});

test('deep links and cut pages resolve on a cold load', async ({ page }) => {
  await page.goto('/artisan/tf');
  await expect(page.getByRole('heading', { name: 'Tiago Ferreira' })).toBeVisible();
  await page.goto('/fix');
  await expect(page).toHaveURL(/\/explore$/);
});

test('pilot login: Send code signs in, a name once, land on next, stay signed in', async ({ page }) => {
  await page.goto('/login?next=/activity');
  await page.getByLabel('Phone number').fill('912 345 678');
  await page.getByRole('button', { name: 'Send code' }).click();

  // No SMS provider → no code to type; the one-time name step instead.
  await page.getByLabel('First name').fill('Ana');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  // The httpOnly session cookie (name included) survives a full reload.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account' })).toContainText('Ana');
});

test('the waitlist form reaches the API', async ({ page }) => {
  await page.goto('/waitlist');
  await page.getByLabel('Email address').first().fill(`smoke+${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Join the waitlist' }).first().click();
  await expect(page.getByText("You're on the list")).toBeVisible();
});
