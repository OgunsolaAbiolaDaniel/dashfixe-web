import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import WaitlistPage from './pages/WaitlistPage';
import ExplorePage from './pages/ExplorePage';
import AuthSheet from './components/home/AuthSheet';
import { AuthProvider, useAuth } from './auth';
import { LangProvider } from './i18n';

/**
 * Routing follows the site map in SITEMAP.md, which mirrors `Dashfixe Flow.dc.html`.
 *
 * Lane 1 and the search-and-map surface are built. The rest resolve through `link()`
 * in src/routes.ts until their pages land, so there are no dead links in the meantime.
 */

/** Hash links must still work after a client-side navigation. */
function HashScroll() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, pathname]);
  return null;
}

/** One auth sheet for the whole app, so the gate works on every route. */
function GlobalAuthSheet() {
  const { authOpen, closeAuth, completeAuth } = useAuth();
  if (!authOpen) return null;
  return <AuthSheet onClose={closeAuth} onContinue={completeAuth} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
      <AuthProvider>
        <HashScroll />
        <Routes>
          {/* Lane 1 · Arriving */}
          <Route path="/" element={<HomePage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />

          {/* Lane 2 · Search + map — Dashfixe Web.dc.html */}
          <Route path="/explore" element={<ExplorePage />} />

          {/* Lane 2 · Getting something fixed — Dashfixe Customer Pages.dc.html */}
          {/* TODO /fix  /artisan/:id  /job/:id  /trade/:slug  /book */}
          {/* TODO /help  /coverage  /about */}

          {/* Lane 3 · Becoming an artisan — Dashfixe for Artisans.dc.html */}
          {/* TODO /for-artisans  /for-artisans/apply  /for-artisans/details  /artisan-app */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalAuthSheet />
      </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
