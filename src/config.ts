/**
 * Build-time switches — docs/ARCHITECTURE.md §9 (the launch switch).
 *
 * Read through functions, not module constants, so tests can flip them with
 * `vi.stubEnv` and so importing this file from Node (vite.config.ts pulls in the
 * SEO table) never touches `import.meta.env` until a switch is actually asked.
 */

/**
 * Launch day: set `VITE_LAUNCHED=true` in Vercel and redeploy. `/waitlist`
 * redirects to `/`, every link that pointed at it follows, and the page drops out
 * of the sitemap. The honesty badges are NOT tied to this — they come off screen
 * by screen as real supply replaces the sample data (Phase 6).
 */
export function launched(): boolean {
  return import.meta.env.VITE_LAUNCHED === 'true';
}
