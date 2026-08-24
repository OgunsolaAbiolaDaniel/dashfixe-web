// src/components/ArtisanModal.tsx
import React, { useEffect, useState } from 'react';

const TRADES = [
  'Plumbing',
  'Electrical (DGEG Certified)',
  'Painting',
  'Carpentry',
  'Cleaning',
  'Other',
] as const;

interface ArtisanModalProps {
  onClose: () => void;
}

export interface ArtisanApplicationDTO {
  fullName: string;
  phone: string;
  email: string;
  trade: string;
}

const inputBaseClass =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-brand-navy placeholder:text-slate-400 outline-none transition-colors duration-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20';

export default function ArtisanModal({ onClose }: ArtisanModalProps) {
  const [formData, setFormData] = useState<ArtisanApplicationDTO>({
    fullName: '',
    phone: '',
    email: '',
    trade: '',
  });
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Artisan Application DTO Submitted:', formData);
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="artisan-modal-title"
        className="relative flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {!submitted ? (
          <>
            <div className="flex-shrink-0 px-6 pt-8 pb-4 md:px-8 md:pt-10">
              <h2 id="artisan-modal-title" className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-navy">
                Apply to the Dashfixe Pilot
              </h2>
              <p className="mt-2 text-sm text-brand-slate leading-relaxed">
                We are hand-selecting a limited cohort of skilled pros in Portugal.
              </p>
            </div>

            <div className="flex-grow overflow-y-auto px-6 pb-8 md:px-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-brand-navy mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputBaseClass}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-brand-navy mb-2">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+351 ..."
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputBaseClass}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-navy mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputBaseClass}
                  />
                </div>

                <div>
                  <label htmlFor="trade" className="block text-sm font-medium text-brand-navy mb-2">
                    Primary Trade
                  </label>
                  <div className="relative">
                    <select
                      id="trade"
                      name="trade"
                      required
                      value={formData.trade}
                      onChange={handleChange}
                      className={`${inputBaseClass} appearance-none pr-10`}
                    >
                      <option value="" disabled hidden>Select your primary trade</option>
                      {TRADES.map((trade) => (
                        <option key={trade} value={trade}>{trade}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-slate">
                      ▾
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-brand-blue px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover cursor-pointer"
                  >
                    Submit Application
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                  We'll contact you on WhatsApp within 48 hours.
                </p>
              </form>
            </div>
          </>
        ) : (
          <div className="px-6 py-10 md:px-8 text-center space-y-3">
            <div className="text-3xl">🛠️</div>
            <h3 className="text-xl font-bold text-brand-navy">Application received</h3>
            <p className="max-w-xs mx-auto text-sm text-brand-slate">
              Thanks for applying to the Dashfixe pilot. We'll reach out via WhatsApp within 48 hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-brand-navy hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
