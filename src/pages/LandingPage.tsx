import { useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingQuote from '../components/landing/LandingQuote';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import ServiceCategories from '../components/landing/ServiceCategories';
import DualAudience from '../components/landing/DualAudience';
import FounderStory from '../components/landing/FounderStory';
import FinalCta from '../components/landing/FinalCta';
import LandingFooter from '../components/landing/LandingFooter';
import ArtisanModal from '../components/ArtisanModal';

export default function LandingPage() {
  const [artisanModalOpen, setArtisanModalOpen] = useState(false);

  return (
    <div className="min-h-screen font-manrope antialiased">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingQuote />
        <LandingHowItWorks />
        <ServiceCategories />
        <DualAudience onOpenArtisanModal={() => setArtisanModalOpen(true)} />
        <FounderStory />
        <FinalCta />
      </main>
      <LandingFooter />
      {artisanModalOpen && <ArtisanModal onClose={() => setArtisanModalOpen(false)} />}
    </div>
  );
}
