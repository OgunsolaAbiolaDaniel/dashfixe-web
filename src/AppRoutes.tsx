import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { AssistantProvider } from './components/assistant/AssistantProvider';
import LocationPrompt from './components/shared/LocationPrompt';
import { preloadPagesWhenIdle } from './lib/lazyPage';
import {
  AboutPage,
  AccountPage,
  AdminApp,
  ActivityPage,
  ArtisanProfilePage,
  ExplorePage,
  HelpPage,
  HowItWorksPage,
  JobPage,
  LegalPage,
  LoginPage,
  NotFoundPage,
  ProAppPage,
  ProApplicationPage,
  ProApplyPage,
  ProDashboardPage,
  ProHelpPage,
  ProLandingPage,
  TradePage,
  WaitlistPage,
} from './routePages';
import { ROUTES, link } from './routes';
import { launched } from './config';
import { applyMeta, pageMeta } from './seo';
import { useLang } from './i18n';

/**
 * The route tree — docs/ARCHITECTURE.md §4. Kept apart from the BrowserRouter and
 * providers in App.tsx so tests can mount it inside a MemoryRouter and assert on
 * real navigation, including the redirects.
 *
 * The home ships in the entry chunk; every other page is its own chunk
 * (routePages.ts): the first page's is fetched before the first render (main.tsx),
 * the rest on first visit or once the first page is idle.
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

/** A moved page keeps the section a link pointed at: /for-artisans#apply → /pro#apply. */
function Moved({ to }: { to: string }) {
  const { hash } = useLocation();
  return <Navigate to={`${to}${hash}`} replace />;
}

/** Title, description, canonical and robots follow the route and the language (seo.ts). */
function RouteMeta() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  useEffect(() => {
    applyMeta(pageMeta(pathname, lang), window.location.origin);
  }, [pathname, lang]);
  return null;
}

export default function AppRoutes() {
  const { pathname } = useLocation();
  useEffect(() => preloadPagesWhenIdle(), []);
  return (
    <>
      <HashScroll />
      <RouteMeta />
      {/* A crash on one page shows a reload screen; navigating away clears it. */}
      <ErrorBoundary resetKey={pathname}>
      {/* One Dashfixe assistant, openable from anywhere below. */}
      <AssistantProvider>
      {/* On map pages: ask once for the customer's position (lib/place). */}
      <LocationPrompt />
      {/* A page's first visit waits for its chunk; a blank screen-height keeps the footer from flashing up. */}
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <Routes>
        {/* Product surface (ARCHITECTURE.md §2) */}
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.explore} element={<ExplorePage />} />
        <Route path={ROUTES.activity} element={<ActivityPage />} />
        <Route path={ROUTES.account} element={<AccountPage />} />
        <Route path={ROUTES.artisan} element={<ArtisanProfilePage />} />
        <Route path={ROUTES.job} element={<JobPage />} />

        {/* Auth — its own minimal chrome */}
        <Route path={ROUTES.login} element={<LoginPage />} />

        {/* Marketing surface. The launch switch (config.ts) retires the waitlist. */}
        <Route path={ROUTES.waitlist} element={launched() ? <Navigate to={ROUTES.home} replace /> : <WaitlistPage />} />
        <Route path={ROUTES.trade} element={<TradePage />} />
        <Route path={ROUTES.howItWorks} element={<HowItWorksPage />} />
        {/* Dashfixe Pro — the artisan world (rev 2.2). */}
        <Route path={ROUTES.pro} element={<ProLandingPage />} />
        <Route path={ROUTES.proApp} element={<ProAppPage />} />
        <Route path={ROUTES.proApply} element={<ProApplyPage />} />
        <Route path={ROUTES.proApplication} element={<ProApplicationPage />} />
        <Route path={ROUTES.proLogin} element={<LoginPage surface="pro" />} />
        <Route path={ROUTES.proDashboard} element={<ProDashboardPage />} />
        <Route path={ROUTES.proHelp} element={<ProHelpPage />} />
        <Route path={ROUTES.forArtisans} element={<Moved to={ROUTES.pro} />} />
        {/* The founders' review of Pro applications (rev 2.8): its own minimal chrome, linked from nowhere. */}
        {/* /ops moved into the admin console (rev 2.13). */}
        <Route path={ROUTES.ops} element={<Navigate to={ROUTES.admin} replace />} />
        {/* The admin console (rev 2.12): its own sign-in, roles and frame (pages/admin). */}
        <Route path={`${ROUTES.admin}/*`} element={<AdminApp />} />
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

        {/* Anything else is an honest 404 (noindex), not a silent trip home. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      </AssistantProvider>
      </ErrorBoundary>
    </>
  );
}
