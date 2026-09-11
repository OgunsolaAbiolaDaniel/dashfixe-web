import SiteNav from '../components/chrome/SiteNav';
import SiteFooter from '../components/chrome/SiteFooter';
import PublicHero from '../components/home/PublicHero';
import Explore from '../components/home/Explore';
import AccountSplit from '../components/home/AccountSplit';
import BookAhead from '../components/home/BookAhead';
import Trades from '../components/home/Trades';
import Nearby from '../components/home/Nearby';
import ArtisanBlock from '../components/home/ArtisanBlock';
import Apps from '../components/home/Apps';
import AppHome from '../components/home/AppHome';
import { useAuth } from '../auth';

/**
 * Two worlds behind one route — ARCHITECTURE.md §2. The marketing home for a
 * visitor; the map-first app home once signed in (Uber's m.uber.com move: the
 * signed-in home IS the map and the composer, not a dashboard — the lists live
 * on /activity). Session state survives navigation via AuthProvider.
 */
export default function HomePage() {
  const { signedIn, requireAuth } = useAuth();

  if (signedIn) return <AppHome />;

  const openAuth = () => requireAuth();

  return (
    <div className="min-h-screen bg-panel">
      <SiteNav />
      <main>
        <PublicHero />
        <Explore onAuth={openAuth} />
        <AccountSplit onAuth={openAuth} />
        <BookAhead />
        <Trades />
        <Nearby />
        <ArtisanBlock />
        <Apps />
      </main>
      <SiteFooter />
    </div>
  );
}
