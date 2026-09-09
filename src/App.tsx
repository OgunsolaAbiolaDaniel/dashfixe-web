import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import WaitlistPage from './pages/WaitlistPage';

/**
 * Routing follows the site map in SITEMAP.md, which mirrors `Dashfixe Flow.dc.html`.
 *
 * Only Lane 1 is built. Lane 2 and 3 destinations resolve through `link()` in src/routes.ts
 * until their pages land, so there are no dead links in the meantime.
 */

/** Hash links must still work after a client-side navigation. */
function HashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <HashScroll />
      <Routes>
        {/* Lane 1 · Arriving */}
        <Route path="/" element={<HomePage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />

        {/* Lane 2 · Getting something fixed — Dashfixe Customer Pages.dc.html */}
        {/* TODO /fix  /artisan/:id  /job/:id  /trade/:slug  /book */}
        {/* TODO /help  /coverage  /about */}
        {/* Lane 2 · Search + map — Dashfixe Web.dc.html */}
        {/* TODO /explore */}

        {/* Lane 3 · Becoming an artisan — Dashfixe for Artisans.dc.html */}
        {/* TODO /for-artisans  /for-artisans/apply  /for-artisans/details  /artisan-app */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
