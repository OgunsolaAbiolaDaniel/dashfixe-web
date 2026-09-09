import PublicNav from '../components/home/PublicNav';
import PublicHero from '../components/home/PublicHero';
import Explore from '../components/home/Explore';
import AccountSplit from '../components/home/AccountSplit';
import BookAhead from '../components/home/BookAhead';
import Trades from '../components/home/Trades';
import Nearby from '../components/home/Nearby';
import ArtisanBlock from '../components/home/ArtisanBlock';
import Apps from '../components/home/Apps';
import PublicFooter from '../components/home/PublicFooter';
import CustomerNav from '../components/home/CustomerNav';
import CustomerHome from '../components/home/CustomerHome';
import CustomerFooter from '../components/home/CustomerFooter';
import { useAuth } from '../auth';

/**
 * The Dashfixe home — designs/Dashfixe Home v2(real).dc.html.
 *
 * Two screens behind one route: the public home for signed-out visitors and the
 * customer home once signed in. Session state lives in AuthProvider so it survives
 * navigation to /explore and back.
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
      <PublicNav onAuth={openAuth} />
      <main>
        <PublicHero />
        <Explore onAuth={openAuth} />
        <AccountSplit onAuth={openAuth} />
        <BookAhead onAuth={openAuth} />
        <Trades />
        <Nearby />
        <ArtisanBlock />
        <Apps onAuth={openAuth} />
      </main>
      <PublicFooter />
    </div>
  );
}
