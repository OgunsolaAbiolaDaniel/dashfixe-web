import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import WaitlistPage from './pages/WaitlistPage';
import ExplorePage from './pages/ExplorePage';
import ActivityPage from './pages/ActivityPage';
import ArtisanProfilePage from './pages/ArtisanProfilePage';
import JobPage from './pages/JobPage';
import ForArtisansPage from './pages/ForArtisansPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import LegalPage from './pages/LegalPage';
import { ROUTES, link } from './routes';

/**
 * The route tree — docs/ARCHITECTURE.md §4. Kept apart from the BrowserRouter and
 * providers in App.tsx so tests can mount it inside a MemoryRouter and assert on
 * real navigation, including the redirects.
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

export default function AppRoutes() {
  return (
    <>
      <HashScroll />
      <Routes>
        {/* Product surface (ARCHITECTURE.md §2) */}
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.explore} element={<ExplorePage />} />
        <Route path={ROUTES.activity} element={<ActivityPage />} />
        <Route path={ROUTES.artisan} element={<ArtisanProfilePage />} />
        <Route path={ROUTES.job} element={<JobPage />} />

        {/* Marketing surface */}
        <Route path={ROUTES.waitlist} element={<WaitlistPage />} />
        <Route path={ROUTES.forArtisans} element={<ForArtisansPage />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
        <Route path={ROUTES.help} element={<HelpPage />} />
        <Route path={ROUTES.privacy} element={<LegalPage kind="privacy" />} />
        <Route path={ROUTES.terms} element={<LegalPage kind="terms" />} />
        <Route path={ROUTES.cookies} element={<LegalPage kind="cookies" />} />

        {/* Cut pages never 404 — they redirect to where their job moved (§4). */}
        <Route path="/fix" element={<Navigate to={link('fix')} replace />} />
        <Route path="/book" element={<Navigate to={link('book')} replace />} />
        <Route path="/coverage" element={<Navigate to={link('coverage')} replace />} />
        <Route path="/for-artisans/apply" element={<Navigate to={link('artisanApply')} replace />} />
        <Route path="/for-artisans/details" element={<Navigate to={link('forArtisans')} replace />} />
        <Route path="/artisan-app" element={<Navigate to={link('artisanApp')} replace />} />

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </>
  );
}
