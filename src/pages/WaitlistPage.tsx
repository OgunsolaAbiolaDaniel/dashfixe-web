import { useState } from 'react';
import Navbar from '../components/waitlist/Navbar';
import Hero from '../components/waitlist/Hero';
import TradesStrip from '../components/waitlist/TradesStrip';
import Philosophy from '../components/waitlist/Philosophy';
import HowItWorks from '../components/waitlist/HowItWorks';
import DualAudience from '../components/waitlist/DualAudience';
import Vetting from '../components/waitlist/Vetting';
import About from '../components/waitlist/About';
import FinalCta from '../components/waitlist/FinalCta';
import Footer from '../components/waitlist/Footer';
import ArtisanModal, { type ArtisanApplication } from '../components/waitlist/ArtisanModal';
import type { Lang } from '../types';

/**
 * The Dashfixe waitlist page — designs/Dashfixe waitlist.dc.html.
 *
 * Pre-launch: nothing on this page claims a live app or a live booking.
 * Submissions are held in local state; no backend exists yet.
 */
export default function WaitlistPage() {
  const [lang, setLang] = useState<Lang>('EN');
  const [heroDone, setHeroDone] = useState(false);
  const [ctaDone, setCtaDone] = useState(false);
  const [artisanOpen, setArtisanOpen] = useState(false);
  const [artisanDone, setArtisanDone] = useState(false);

  const openArtisan = () => {
    setArtisanDone(false);
    setArtisanOpen(true);
  };

  // TODO: POST to /api/waitlist and /api/artisans/apply once the backend exists.
  const submitWaitlist = (_email: string, markDone: (v: boolean) => void) => markDone(true);
  const submitArtisan = (application: ArtisanApplication) => {
    void application; // held until POST /api/artisans/apply exists
    setArtisanDone(true);
  };

  return (
    <div className="min-h-screen bg-panel">
      <Navbar lang={lang} onLang={setLang} />
      <main>
        <Hero
          done={heroDone}
          onSubmit={(email) => submitWaitlist(email, setHeroDone)}
          onOpenArtisan={openArtisan}
        />
        <TradesStrip />
        <Philosophy />
        <HowItWorks />
        <DualAudience onOpenArtisan={openArtisan} />
        <Vetting />
        <About />
        <FinalCta
          done={ctaDone}
          onSubmit={(email) => submitWaitlist(email, setCtaDone)}
          onOpenArtisan={openArtisan}
        />
      </main>
      <Footer />

      {artisanOpen && (
        <ArtisanModal
          done={artisanDone}
          onClose={() => setArtisanOpen(false)}
          onSubmit={submitArtisan}
        />
      )}
    </div>
  );
}
