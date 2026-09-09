import WaitlistForm from './WaitlistForm';

type Props = {
  done: boolean;
  onSubmit: (email: string) => void;
  onOpenArtisan: () => void;
};

/** The one dark section on the page, per the design system's "one dark thing per view". */
export default function FinalCta({ done, onSubmit, onOpenArtisan }: Props) {
  return (
    <section className="relative overflow-hidden bg-ink">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-80 block h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.6)_0%,rgba(37,99,235,0)_68%)] blur-[40px]"
      />
      <div className="relative mx-auto max-w-[760px] px-[clamp(18px,4vw,32px)] py-[clamp(56px,7vw,96px)] text-center">
        <h2 className="mb-4 text-[clamp(28px,3.6vw,44px)] font-extrabold leading-[1.08] tracking-[-.035em] text-white [text-wrap:balance]">
          Be first in line when we launch in Portugal.
        </h2>
        <p className="mx-auto mb-8 max-w-[480px] text-[clamp(15px,1.3vw,17px)] font-medium leading-[1.6] text-onink">
          Join the waitlist and we'll email you when the pilot opens in your area.
        </p>

        <WaitlistForm
          variant="dark"
          submitLabel="Get early access"
          done={done}
          onSubmit={onSubmit}
        />

        <div className="mt-[22px] text-[13.5px] font-semibold text-onink">
          Are you a tradesperson?{' '}
          <button
            type="button"
            onClick={onOpenArtisan}
            className="text-[13.5px] font-bold text-brand-on-dark transition hover:text-white"
          >
            Apply to the pilot →
          </button>
        </div>
      </div>
    </section>
  );
}
