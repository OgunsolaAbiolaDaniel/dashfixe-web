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
import { api } from '../lib/api';
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

  const ERR = 'Something went wrong — check the details and try again.';
  const [heroBusy, setHeroBusy] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [ctaBusy, setCtaBusy] = useState(false);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const [artisanBusy, setArtisanBusy] = useState(false);
  const [artisanError, setArtisanError] = useState<string | null>(null);

  const submitWaitlist = async (
    email: string,
    markDone: (v: boolean) => void,
    setBusy: (v: boolean) => void,
    setError: (v: string | null) => void,
  ) => {
    setBusy(true);
    setError(null);
    const r = await api('/api/waitlist', { email, userType: 'HOMEOWNER' });
    setBusy(false);
    if (r.ok) markDone(true);
    else setError(ERR);
  };

  const submitArtisan = async (application: ArtisanApplication) => {
    setArtisanBusy(true);
    setArtisanError(null);
    const r = await api('/api/artisans/apply', application);
    setArtisanBusy(false);
    if (r.ok) setArtisanDone(true);
    else setArtisanError(ERR);
  };

  return (
    <div className="min-h-screen bg-panel">
      <Navbar lang={lang} onLang={setLang} />
      <main>
        <Hero
          done={heroDone}
          busy={heroBusy}
          error={heroError}
          onSubmit={(email) => void submitWaitlist(email, setHeroDone, setHeroBusy, setHeroError)}
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
          busy={ctaBusy}
          error={ctaError}
          onSubmit={(email) => void submitWaitlist(email, setCtaDone, setCtaBusy, setCtaError)}
          onOpenArtisan={openArtisan}
        />
      </main>
      <Footer />

      {artisanOpen && (
        <ArtisanModal
          done={artisanDone}
          busy={artisanBusy}
          error={artisanError}
          onClose={() => setArtisanOpen(false)}
          onSubmit={(a) => void submitArtisan(a)}
        />
      )}
    </div>
  );
}
