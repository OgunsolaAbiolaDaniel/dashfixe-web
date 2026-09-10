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
import CustomerNav from '../components/home/CustomerNav';
import CustomerHome from '../components/home/CustomerHome';
import CustomerFooter from '../components/home/CustomerFooter';
import { useAuth } from '../auth';

/**
 * Two worlds behind one route — ARCHITECTURE.md §2. The marketing home for a
 * visitor; the app home once signed in (Uber's m.uber.com move). Session state
 * lives in AuthProvider so it survives navigation to /explore and back.
 */
export default function HomePage() {
  const { signedIn, requireAuth, signOut } = useAuth();

  if (signedIn) {
    return (
      <div className="min-h-screen bg-page">
        <CustomerNav onSignOut={signOut} />
        <main>
          <CustomerHome />
        </main>
        <CustomerFooter />
      </div>
    );
  }

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
        <Apps onAuth={openAuth} />
      </main>
      <SiteFooter />
    </div>
  );
}
