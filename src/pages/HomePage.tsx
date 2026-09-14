import { useState } from 'react';
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
import type { TradeSlug } from '../routes';

/**
 * Two worlds behind one route — ARCHITECTURE.md §2. The marketing home for a
 * visitor; the map-first app home once signed in (Uber's m.uber.com move: the
 * signed-in home IS the map and the composer, not a dashboard — the lists live
 * on /activity). Session state survives navigation via AuthProvider.
 *
 * The visitor's need and its trade live here, not in the hero, so "Plan it for
 * later" (BookAhead) can carry them into a booking: "Book for later" in the hero
 * scrolls down to it rather than starting over.
 */
export default function HomePage() {
  const { signedIn, requireAuth } = useAuth();
  const [need, setNeed] = useState('');
  const [trade, setTrade] = useState<TradeSlug | ''>('');

  if (signedIn) return <AppHome />;

  const openAuth = () => requireAuth();

  return (
    <div className="min-h-screen bg-panel">
      <SiteNav />
      <main>
        <PublicHero need={need} trade={trade} onNeed={setNeed} onTrade={setTrade} />
        <Explore />
        <AccountSplit onAuth={openAuth} />
        <BookAhead need={need} trade={trade} />
        <Trades />
        <Nearby />
        <ArtisanBlock />
        <Apps />
      </main>
      <SiteFooter />
    </div>
  );
}
