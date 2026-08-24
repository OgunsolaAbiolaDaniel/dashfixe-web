// src/App.tsx
import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Process from './components/Process';
import DualAudience from './components/DualAudience';
import FounderStory from './components/FounderStory';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import ArtisanModal from './components/ArtisanModal';

export default function App() {
  const [isArtisanModalOpen, setIsArtisanModalOpen] = useState<boolean>(false);

  const openModal = () => setIsArtisanModalOpen(true);
  const closeModal = () => setIsArtisanModalOpen(false);

  return (
    <div className="min-h-screen bg-white text-brand-navy font-sans antialiased">
      <Navbar onOpenArtisanModal={openModal} />
      <main>
        <Hero onOpenArtisanModal={openModal} />
        <Philosophy />
        <Process />
        <DualAudience onOpenArtisanModal={openModal} />
        <FounderStory />
        <FinalCta />
      </main>
      <Footer />

      {isArtisanModalOpen && (
        <ArtisanModal onClose={closeModal} />
      )}
    </div>
  );
}