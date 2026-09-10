import type { ReactNode } from 'react';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';

/**
 * The marketing-surface page frame — ARCHITECTURE.md §2. Every marketing page is
 * SiteNav + content + SiteFooter; nothing on this surface builds its own chrome.
 */
export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-panel">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
