import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
  '/for-artisans',
  '/no-such-page',
];

for (const path of PAGES) {
  test(`a11y ${path}: no serious or critical WCAG violations`, async ({ page }) => {
    await page.goto(path);
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
  });
}
