import type { ReactNode } from 'react';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';

/**
 * The marketing-surface page frame — ARCHITECTURE.md §2. Every marketing page is
 * SiteNav + content + SiteFooter; nothing on this surface builds its own chrome.
 * `surface="pro"` dresses it as Dashfixe Pro, the artisan world (rev 2.2).
 */
export default function MarketingShell({ children, surface = 'customer' }: { children: ReactNode; surface?: 'customer' | 'pro' }) {
  return (
    <div className="min-h-screen bg-panel">
      <SiteNav surface={surface} />
      <main>{children}</main>
      <SiteFooter surface={surface} />
    </div>
  );
}
