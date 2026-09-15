import { matchPath } from 'react-router-dom';
import { lazyPage } from './lib/lazyPage';
import { ROUTES } from './routes';

/**
 * The lazy pages (lib/lazyPage.tsx), one chunk each, and which route renders which —
 * so main.tsx can fetch the first page's chunk BEFORE the first render. Rendering
 * into a Suspense fallback instead costs a blank frame plus React's reveal throttle
 * (~300 ms): measured, it made every page but the home paint later than the
 * single-bundle build did. The route tree itself stays in AppRoutes.tsx.
 */
export const WaitlistPage = lazyPage(() => import('./pages/WaitlistPage'));
export const ExplorePage = lazyPage(() => import('./pages/ExplorePage'));
export const ActivityPage = lazyPage(() => import('./pages/ActivityPage'));
export const AccountPage = lazyPage(() => import('./pages/AccountPage'));
export const ArtisanProfilePage = lazyPage(() => import('./pages/ArtisanProfilePage'));
export const JobPage = lazyPage(() => import('./pages/JobPage'));
export const ProLandingPage = lazyPage(() => import('./pages/ProLandingPage'));
export const ProAppPage = lazyPage(() => import('./pages/ProAppPage'));
export const ProApplyPage = lazyPage(() => import('./pages/ProApplyPage'));
export const ProApplicationPage = lazyPage(() => import('./pages/ProApplicationPage'));
export const ProDashboardPage = lazyPage(() => import('./pages/ProDashboardPage'));
export const ProHelpPage = lazyPage(() => import('./pages/ProHelpPage'));
export const AboutPage = lazyPage(() => import('./pages/AboutPage'));
export const HelpPage = lazyPage(() => import('./pages/HelpPage'));
export const LegalPage = lazyPage(() => import('./pages/LegalPage'));
export const LoginPage = lazyPage(() => import('./pages/LoginPage'));
export const TradePage = lazyPage(() => import('./pages/TradePage'));
export const HowItWorksPage = lazyPage(() => import('./pages/HowItWorksPage'));
export const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage'));
export const OpsPage = lazyPage(() => import('./pages/OpsPage'));
/** The whole admin console is one chunk; the customer site never downloads it. */
export const AdminApp = lazyPage(() => import('./pages/admin/AdminApp'));

const BY_ROUTE: Array<[string, { preload: () => Promise<unknown> }]> = [
  [ROUTES.explore, ExplorePage],
  [ROUTES.activity, ActivityPage],
  [ROUTES.account, AccountPage],
  [ROUTES.artisan, ArtisanProfilePage],
  [ROUTES.job, JobPage],
  [ROUTES.login, LoginPage],
  [ROUTES.waitlist, WaitlistPage],
  [ROUTES.trade, TradePage],
  [ROUTES.howItWorks, HowItWorksPage],
  [ROUTES.pro, ProLandingPage],
  [ROUTES.proApp, ProAppPage],
  [ROUTES.proApply, ProApplyPage],
  [ROUTES.proApplication, ProApplicationPage],
  [ROUTES.proLogin, LoginPage],
  [ROUTES.proDashboard, ProDashboardPage],
  [ROUTES.proHelp, ProHelpPage],
  [ROUTES.about, AboutPage],
  [ROUTES.help, HelpPage],
  [ROUTES.privacy, LegalPage],
  [ROUTES.terms, LegalPage],
  [ROUTES.cookies, LegalPage],
  [ROUTES.ops, OpsPage],
  [`${ROUTES.admin}/*`, AdminApp],
];

/** Fetch the chunk of the page `pathname` renders (nothing for the home, which is in the entry). */
export function preloadRoute(pathname: string): Promise<unknown> {
  if (pathname === ROUTES.home) return Promise.resolve();
  const hit = BY_ROUTE.find(([pattern]) => matchPath(pattern, pathname));
  return (hit ? hit[1] : NotFoundPage).preload();
}
