import { useEffect, useId, useRef, useState } from 'react';
import { Close, Wrench } from '../icons';

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical (DGEG certified)' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

export type ArtisanApplication = {
  fullName: string;
  phone: string;
  email: string;
  trade: string;
};

type Props = {
  done: boolean;
  onClose: () => void;
  onSubmit: (application: ArtisanApplication) => void;
};

const FIELD =
  'h-[46px] w-full rounded-input border border-line bg-page px-[15px] text-[14.5px] font-semibold text-ink placeholder:text-ink-30';
const LABEL = 'mb-[7px] block text-label text-ink-40';

export default function ArtisanModal({ done, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ArtisanApplication>({
    fullName: '',
    phone: '',
    email: '',
    trade: '',
  });
  const ids = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  // Escape closes, and the background must not scroll behind the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const set = (k: keyof ArtisanApplication) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto bg-ink/60 p-5 backdrop-blur-[4px]"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Apply to the Dashfixe pilot"
        onClick={(e) => e.stopPropagation()}
        className="m-auto w-full max-w-[448px] rounded-card bg-panel p-[clamp(22px,4vw,28px)] shadow-panel"
      >
        {done ? (
          <div className="px-1 pb-1 pt-3 text-center">
            <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-card bg-brand-tint">
              <Wrench size={28} className="text-brand" />
            </span>
            <h3 className="mb-2.5 text-[22px] font-extrabold tracking-[-.025em] text-ink">
              Application received
            </h3>
            <p className="mx-auto mb-[26px] max-w-[320px] text-[14.5px] font-medium leading-[1.6] text-ink-60">
              Thanks for applying to the Dashfixe pilot. We'll reach out via WhatsApp within 48
              hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-ctl-lg w-full rounded-btn border border-line bg-panel text-[14.5px] font-bold text-ink transition hover:bg-page"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-[22px] flex items-start gap-3.5">
              <div className="mr-auto">
                <h3 className="mb-[7px] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink">
                  Apply to the Dashfixe pilot
                </h3>
                <p className="text-[14.5px] font-medium leading-[1.5] text-ink-60">
                  We are hand-selecting a limited cohort of skilled pros in Portugal.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-well transition hover:bg-line"
              >
                <Close size={16} className="text-ink-60" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
              }}
            >
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor={`${ids}-name`} className={LABEL}>
                    Full name
                  </label>
                  <input
                    id={`${ids}-name`}
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => set('fullName')(e.target.value)}
                    placeholder="Enter your full name"
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`${ids}-phone`} className={LABEL}>
                    WhatsApp / phone number
                  </label>
                  <input
                    id={`${ids}-phone`}
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => set('phone')(e.target.value)}
                    placeholder="+351 ..."
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`${ids}-email`} className={LABEL}>
                    Email address
                  </label>
                  <input
                    id={`${ids}-email`}
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email')(e.target.value)}
                    placeholder="name@example.com"
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor={`${ids}-trade`} className={LABEL}>
                    Primary trade
                  </label>
                  <select
                    id={`${ids}-trade`}
                    required
                    value={form.trade}
                    onChange={(e) => set('trade')(e.target.value)}
                    className={`${FIELD} appearance-none`}
                  >
                    <option value="">Select your trade</option>
                    {TRADES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
              >
                Submit application
              </button>
              <p className="mt-3 text-center text-[13px] font-semibold text-ink-40">
                We'll contact you on WhatsApp within 48 hours.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
