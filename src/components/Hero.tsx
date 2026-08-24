// src/components/Hero.tsx
import React, { useState } from 'react';
import WaitlistSuccessModal from './WaitlistSuccessModal';

interface HeroProps {
  onOpenArtisanModal: () => void;
}

export default function Hero({ onOpenArtisanModal }: HeroProps) {
  const [email, setEmail] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      console.log('Homeowner Waitlist Email:', email);
      setIsSuccessModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsSuccessModalOpen(false);
    setEmail('');
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Form */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-navy tracking-tight leading-[1.15]">
              When your usual person can't.
            </h1>

            <p className="text-lg sm:text-xl text-brand-slate max-w-2xl leading-relaxed">
              Snap a photo of the problem. Get matched with a vetted local artisan. AI diagnosis, upfront pricing, multilingual chat. Launching soon in Portugal.
            </p>

            {/* Waitlist Input Form */}
            <div id="waitlist" className="pt-2 max-w-md">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-brand-blue hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-sm whitespace-nowrap cursor-pointer"
                >
                  Join Waitlist →
                </button>
              </form>

              {/* Secondary Artisan Link */}
              <div className="mt-3 flex items-center justify-end text-xs text-brand-slate">
                <button
                  type="button"
                  onClick={onOpenArtisanModal}
                  className="text-brand-blue hover:underline font-semibold cursor-pointer"
                >
                  Are you a tradesperson? Apply here →
                </button>
              </div>
            </div>

            {/* Trust Pill Row */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Vetted Pros
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Upfront Estimates
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> In-App Payments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> PT / EN Support
              </span>
            </div>

          </div>

          {/* Right Column: AI Diagnosis Concept Card Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm bg-white rounded-2xl p-4 shadow-xl border border-slate-200 space-y-4">
              
              {/* Concept Tag */}
              <div className="flex items-center justify-between text-xs font-bold text-brand-blue bg-blue-50/80 px-3 py-1.5 rounded-lg">
                <span>✨ AI DIAGNOSIS PREVIEW</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
                  Concept
                </span>
              </div>

              {/* Image Preview Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-4/3 flex items-center justify-center border border-slate-200">
                <div className="text-center p-6 space-y-2">
                  <div className="text-4xl">🚰</div>
                  <div className="inline-block px-2.5 py-1 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-semibold rounded-md shadow-sm">
                    Scan Box: Leaking Valve Seal
                  </div>
                </div>
              </div>

              {/* AI Output Badges */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Issue Detected</span>
                  <span className="font-semibold text-slate-900">Leaking Valve Seal</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Trade Required</span>
                  <span className="font-semibold text-brand-blue">Certified Plumber</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Upfront Materials Est.</span>
                  <span className="font-semibold text-slate-900">~€15 - €25</span>
                </div>
              </div>

              {/* Status Footer Pill */}
              <div className="w-full py-2.5 bg-slate-900 text-white text-xs font-medium text-center rounded-xl shadow-xs">
                Automatic Matching & Backup Routing
              </div>

            </div>
          </div>

        </div>
      </div>

      {isSuccessModalOpen && (
        <WaitlistSuccessModal email={email} onClose={handleModalClose} />
      )}
    </section>
  );
}