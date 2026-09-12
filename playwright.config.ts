import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests on the BUILT app — docs/ARCHITECTURE.md §8. `vite preview` serves
 * dist/ plus the pilot API (vite.config.ts), so these drive the real bundle, the
 * pre-rendered heads and the real handlers end to end.
 *
 *   npx vite build && npm run smoke
 *
 * Locally, PW_CHANNEL=msedge (or chrome) reuses an installed browser instead of
 * downloading Playwright's Chromium. CI installs Chromium (.github/workflows).
 */
const PORT = 4175;

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-GB',
    trace: 'retain-on-failure',
    // MapLibre needs WebGL; headless Chromium gets it from SwiftShader.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
