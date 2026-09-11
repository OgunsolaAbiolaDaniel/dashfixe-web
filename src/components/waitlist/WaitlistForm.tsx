import { useId, useState } from 'react';
import { Check } from '../icons';

type Props = {
  variant: 'light' | 'dark';
  submitLabel: string;
  done: boolean;
  busy?: boolean;
  error?: string | null;
  onSubmit: (email: string) => void;
};

/**
 * Email capture. Used twice — hero (light ground) and final CTA (navy ground).
 * Both collapse to a success state in place, per the design.
 */
export default function WaitlistForm({ variant, submitLabel, done, busy = false, error = null, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const id = useId();
  const dark = variant === 'dark';

  if (done) {
    return dark ? (
      <div className="inline-flex items-center gap-3 rounded-full border border-success-bright/40 bg-success-bright/[.14] px-[22px] py-3.5">
        <Check size={19} className="flex-none text-success-bright" />
        <span className="text-[15px] font-bold text-[#a7f3cf]">
          You're on the list. We'll be in touch.
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-[13px] rounded-[18px] border border-line bg-page px-[18px] py-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-success-tint">
          <Check size={20} className="text-success" />
        </span>
        <span className="min-w-0">
          <span className="block text-row text-ink">You're on the list</span>
          <span className="mt-0.5 block text-meta text-ink-40">
            We'll email you before the pilot opens.
          </span>
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email);
      }}
      className={
        'flex flex-wrap gap-2.5' + (dark ? ' mx-auto max-w-[520px] justify-center' : '')
      }
    >
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={
          'h-ctl-lg min-w-0 flex-[1_1_240px] rounded-input px-[17px] text-[14.5px] font-semibold ' +
          (dark
            ? 'border border-white/[.16] bg-white/[.08] text-white placeholder:text-white/50'
            : 'border border-line bg-page text-ink placeholder:text-ink-30')
        }
      />
      <button
        type="submit"
        disabled={busy}
        className={
          'h-ctl-lg flex-none rounded-btn bg-brand px-6 text-[14.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60' +
          (dark ? ' shadow-brand' : '')
        }
      >
        {busy ? 'Sending…' : submitLabel}
      </button>
      {error && (
        <p className={'w-full text-[13px] font-semibold ' + (dark ? 'text-[#fcd34d]' : 'text-warning')}>{error}</p>
      )}
    </form>
  );
}
