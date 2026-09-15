import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility gate (docs/ARCHITECTURE.md §8): axe-core against WCAG 2 A/AA on
 * the pages people actually land on, built bundle, real browser. Serious and
 * critical violations fail CI; minor/moderate ones are printed for follow-up.
 * The map canvas is excluded — a WebGL surface has no DOM for axe to read; its
 * controls and markers are real buttons and are checked.
 */
const PAGES = [
  '/',
  '/explore',
  '/login',
  '/how-it-works',
  '/help',
  '/trade/plumbing',
  '/pro',
  '/pro/app',
  '/pro/apply',
  '/pro/login',
  '/pro/help',
  '/admin',
  '/no-such-page',
];

/** Signed-in pages, reached through the pilot login first. (/ops shows its set-up notice: CI has no team variables.) */
const PRIVATE = ['/account', '/activity', '/pro/dashboard', '/ops', '/job/dfx-1042'];

async function audit(page: Page, path: string) {
  await expect(page.locator('h1').first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.maplibregl-canvas')
      .analyze();

  const minor = violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');
  if (minor.length) console.log(`${path} (minor): ${minor.map((v) => v.id).join(', ')}`);

  const blocking = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(blocking).toEqual([]);
}

for (const path of PAGES) {
  test(`a11y ${path}: no serious or critical WCAG violations`, async ({ page }) => {
    await page.goto(path);
    // Map markers mount once the tiles load; audit them every time, not by timing.
    if (path === '/explore') await expect(page.locator('[data-marker]').first()).toBeAttached({ timeout: 25_000 });
    await audit(page, path);
  });
}

for (const path of PRIVATE) {
  test(`a11y ${path} (signed in): no serious or critical WCAG violations`, async ({ page }) => {
    await page.goto(`/login?next=${path}`);
    await page.getByLabel('Phone number').fill('912 345 678');
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('First name').fill('Ana');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await audit(page, path);
  });
}
