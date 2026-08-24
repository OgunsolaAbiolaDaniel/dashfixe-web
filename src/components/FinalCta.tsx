// src/components/FinalCta.tsx
import React, { useState } from 'react';
import WaitlistSuccessModal from './WaitlistSuccessModal';

export default function FinalCta() {
  const [email, setEmail] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      console.log('Final CTA Waitlist Email:', email);
      setIsSuccessModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsSuccessModalOpen(false);
    setEmail('');
  };

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="max-w-7xl mx-auto bg-white p-10 md:p-16 rounded-2xl shadow-xl border border-slate-200 text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight">
          Be first in line when we launch in Portugal.
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-3"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
          />
          <button
            type="submit"
            className="px-8 py-3.5 rounded-lg bg-brand-blue hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-sm whitespace-nowrap cursor-pointer"
          >
            Get Early Access
          </button>
        </form>
      </div>

      {isSuccessModalOpen && (
        <WaitlistSuccessModal email={email} onClose={handleModalClose} />
      )}
    </section>
  );
}
