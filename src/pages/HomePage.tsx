import { useState } from 'react';
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
import AuthSheet from '../components/home/AuthSheet';

/**
 * The Dashfixe home — designs/Dashfixe Home v2(real).dc.html.
 *
 * Two screens behind one route: the public home for signed-out visitors and
 * the customer home once signed in.
 *
 * NOTE: there is no auth backend. `signedIn` is local state, so the customer
 * home is a walkthrough of the planned product, populated with sample data.
 * Wire this to a real session before launch.
 */
export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const openAuth = () => setAuthOpen(true);

  const goSignedIn = () => {
    setSignedIn(true);
    setAuthOpen(false);
    window.scrollTo(0, 0);
  };

  const goSignedOut = () => {
    setSignedIn(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {signedIn ? (
        <div className="min-h-screen bg-page">
          <CustomerNav onSignOut={goSignedOut} />
          <main>
            <CustomerHome />
          </main>
          <CustomerFooter />
        </div>
      ) : (
        <div className="min-h-screen bg-panel">
          <PublicNav onAuth={openAuth} />
          <main>
            <PublicHero onAuth={openAuth} />
            <Explore onAuth={openAuth} />
            <AccountSplit onAuth={openAuth} />
            <BookAhead onAuth={openAuth} />
            <Trades onAuth={openAuth} />
            <Nearby onAuth={openAuth} />
            <ArtisanBlock />
            <Apps onAuth={openAuth} />
          </main>
          <PublicFooter />
        </div>
      )}

      {authOpen && <AuthSheet onClose={() => setAuthOpen(false)} onContinue={goSignedIn} />}
    </>
  );
}
