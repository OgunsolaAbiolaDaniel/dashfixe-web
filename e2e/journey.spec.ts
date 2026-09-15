import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The customer journey end to end, on the built app (rev 2.10): the real bundle,
 * the real pilot API (vite preview), the real map. Each test is one customer in a
 * fresh browser.
 *
 *   now:   search on the home → pick an artisan → log in at the commit point →
 *          chat → approve the estimate → book → track → (walkthrough) done →
 *          receipt → rate → it's in Activity
 *   later: book a slot → change the time → cancel → Activity says so
 *
 * The chat's replies are scripted on timers, so waits are generous, never sleeps.
 */
const REPLY = { timeout: 15_000 };

/** Tiago's card in the /explore list. */
const tiagoCard = (page: Page): Locator =>
  page.getByRole('article').filter({ has: page.getByRole('link', { name: 'Tiago Ferreira' }) });

/** The pilot login: Send code signs in; the first time, a name. */
async function logIn(page: Page) {
  await page.getByLabel('Phone number').fill('912 345 678');
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('First name').fill('Ana');
  await page.getByRole('button', { name: 'Continue' }).click();
}

/** Tiago's chat: the one coming back from log in may already be open; otherwise open it from his card. */
async function openTiagoChat(page: Page): Promise<Locator> {
  const composer = page.getByLabel('Message');
  const alreadyOpen = await composer
    .waitFor({ timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (!alreadyOpen) await tiagoCard(page).getByRole('button', { name: /^Chat/ }).click();
  await expect(composer).toBeVisible();
  return composer;
}

/** Send the need, wait for the itemised estimate, approve it and book. */
async function agreeAndBook(page: Page, composer: Locator, need: string) {
  if (!(await composer.inputValue())) await composer.fill(need);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Estimate', { exact: true })).toBeVisible(REPLY);
  await page.getByRole('button', { name: /^Approve €/ }).click();
  await page.getByRole('button', { name: 'Confirm and book' }).click();
}

test('now: search, chat, book, track, receipt, rate', async ({ page }) => {
  test.setTimeout(90_000);

  // Search on the home as a visitor.
  await page.goto('/');
  await page.getByLabel('What needs fixing').fill('Leaking kitchen tap');
  await page.getByRole('button', { name: "See who's available" }).click();
  await expect(page).toHaveURL(/\/explore\?.*need=Leaking/);
  await expect(page.getByRole('heading', { name: 'Who is free right now' })).toBeVisible();

  // Chat is the commit point: it asks for a log in, then brings the customer back.
  await tiagoCard(page).getByRole('button', { name: /^Chat/ }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await logIn(page);
  await expect(page).toHaveURL(/\/explore/);

  // Agree the price in chat, then book.
  const composer = await openTiagoChat(page);
  await agreeAndBook(page, composer, 'Leaking kitchen tap');
  await page.getByRole('link', { name: 'Track Tiago' }).click();

  // Track.
  await expect(page.getByRole('heading', { name: 'Tiago is heading over' })).toBeVisible();
  await expect(page.getByText('Plumbing · Leaking kitchen tap')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Need help with this job?' })).toBeVisible();
  const jobPath = new URL(page.url()).pathname;

  // The walkthrough finishes the job; the receipt, then a rating.
  await page.getByRole('button', { name: 'Walkthrough: finish this job' }).click();
  await expect(page.getByText('Receipt', { exact: true })).toBeVisible();
  await expect(page.getByText('Paid in app')).toBeVisible();
  await page.getByRole('button', { name: 'Rate 5 stars' }).click();
  await expect(page.getByText('Thanks — this helps the next customer.')).toBeVisible();

  // It's in Activity, linked to its receipt, and stays rated after a reload.
  await page.getByRole('link', { name: 'Activity' }).first().click();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Leaking kitchen tap/ })).toHaveAttribute('href', jobPath);
  await page.goto(jobPath);
  await expect(page.getByText('You rated this job 5★.')).toBeVisible();
});

test('later: book a slot, change the time, cancel', async ({ page }) => {
  test.setTimeout(90_000);

  // Three days ahead, 12–14: every window that day is open, whatever the clock says.
  await page.goto(`/login?next=${encodeURIComponent('/explore?when=later&day=3&win=2&need=Boiler%20service')}`);
  await logIn(page);
  await expect(page).toHaveURL(/when=later/);

  const composer = await openTiagoChat(page);
  await agreeAndBook(page, composer, 'Boiler service');
  await page.getByRole('link', { name: 'View booking' }).click();

  await expect(page.getByRole('heading', { name: 'Booked with Tiago' })).toBeVisible();
  await expect(page.getByText(/· 12–14$/)).toBeVisible();

  // Change the time: same day, 16–18.
  await page.getByRole('button', { name: /Change the time/ }).click();
  await page.getByRole('button', { name: 'Window 12–14' }).click();
  await page.getByRole('button', { name: '16–18' }).click();
  await page.getByRole('button', { name: 'Save the new time' }).click();
  await expect(page.getByRole('status')).toContainText('16–18');
  await expect(page.getByText(/· 16–18$/)).toBeVisible();

  // Cancel — free before travel — and land on Activity, where it's a plain row (no page to open).
  await page.getByRole('button', { name: /Cancel the booking/ }).click();
  await page.getByRole('button', { name: 'Yes, cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  await expect(page.getByText('Boiler service', { exact: true })).toBeVisible();
  await expect(page.getByText(/· Tiago Ferreira · Cancelled before travel$/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Boiler service/ })).toHaveCount(0);
});
