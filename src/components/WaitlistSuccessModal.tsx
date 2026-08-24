// src/components/WaitlistSuccessModal.tsx
import { useEffect } from 'react';

interface WaitlistSuccessModalProps {
  email: string;
  onClose: () => void;
}

export default function WaitlistSuccessModal({ email, onClose }: WaitlistSuccessModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-success-title"
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

        <div className="px-6 py-10 md:px-8 text-center space-y-3">
          <div className="text-3xl">🎉</div>
          <h3 id="waitlist-success-title" className="text-xl font-bold text-brand-navy">
            You're on the list
          </h3>
          <p className="max-w-xs mx-auto text-sm text-brand-slate">
            Thanks for joining the early-access list for our Portugal launch. We'll email updates
            to <span className="font-medium text-brand-navy">{email}</span>.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-brand-navy hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
