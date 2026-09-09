import { useEffect, useId, useRef } from 'react';
import { Apple, Close, Mail } from '../icons';

type Props = { onClose: () => void; onContinue: () => void };

const SOCIAL =
  'flex h-12 w-full items-center justify-center gap-2.5 rounded-btn border border-line bg-panel text-[14.5px] font-bold text-ink transition hover:bg-page';

/**
 * Phone-first auth. There is no auth backend yet — "Continue" moves the
 * page into its signed-in state so the customer home can be reviewed.
 */
export default function AuthSheet({ onClose, onContinue }: Props) {
  const id = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.querySelector<HTMLElement>('input')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-auto bg-ink/60 p-5 backdrop-blur-[4px]"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Log in or sign up"
        onClick={(e) => e.stopPropagation()}
        className="m-auto w-full max-w-[420px] rounded-card bg-panel p-[clamp(22px,4vw,28px)] shadow-panel"
      >
        <div className="mb-[22px] flex items-start gap-3.5">
          <div className="mr-auto">
            <h3 className="mb-[7px] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink">
              Log in or sign up
            </h3>
            <p className="text-[14.5px] font-medium leading-[1.5] text-ink-60">
              We'll text a code to confirm it's you. No password to remember.
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

        <label htmlFor={id} className="mb-[7px] block text-label text-ink-40">
          Phone number
        </label>
        <div className="flex h-12 items-center gap-3 rounded-input border border-line bg-page px-[15px]">
          <span className="flex-none text-[14.5px] font-bold text-ink-60">+351</span>
          <span className="block h-5 w-px flex-none bg-line" />
          <input
            id={id}
            type="tel"
            placeholder="912 345 678"
            aria-label="Phone number"
            className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] font-semibold text-ink outline-offset-[6px] placeholder:text-ink-30"
          />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-[18px] h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
        >
          Continue
        </button>

        <div className="my-5 flex items-center gap-3.5">
          <span className="block h-px flex-1 bg-line-soft" />
          <span className="text-xs font-bold text-ink-30">or</span>
          <span className="block h-px flex-1 bg-line-soft" />
        </div>

        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={onContinue} className={SOCIAL}>
            <Mail size={18} className="text-ink-60" />
            Continue with email
          </button>
          <button type="button" onClick={onContinue} className={SOCIAL}>
            <Apple size={18} />
            Continue with Apple
          </button>
        </div>

        <p className="mt-5 text-center text-[12.5px] font-semibold leading-[1.5] text-ink-40">
          By continuing you agree to our <a href="#terms">Terms</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
