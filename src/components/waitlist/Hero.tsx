import { Basket, CardPlain, Diagnose, Euro, Globe, Reroute, Shield, Sparkle, Wrench } from '../icons';
import WaitlistForm from './WaitlistForm';

const TRUST = [
  { Icon: Shield, label: 'Vetted pros' },
  { Icon: Euro, label: 'Upfront pricing' },
  { Icon: CardPlain, label: 'In-app payments' },
  { Icon: Globe, label: 'PT / EN' },
];

const DIAGNOSIS = [
  { Icon: Diagnose, label: 'Problem detected', value: 'Leaking valve seal', money: false },
  { Icon: Wrench, label: 'Trade required', value: 'Plumbing', money: false },
  { Icon: Basket, label: 'Est. materials', value: '€15 – €25', money: true },
];

const ESTIMATE = [
  { label: 'Valve seal kit', value: '€18.00' },
  { label: 'Labour · 1h', value: '€45.00' },
];

type Props = {
  done: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
  onOpenArtisan: () => void;
};

export default function Hero({ done, busy, error, onSubmit, onOpenArtisan }: Props) {
  return (
    <section id="top" className="bg-panel">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] pb-[clamp(40px,5vw,64px)] pt-[clamp(48px,7vw,88px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,430px),1fr))] items-center gap-[clamp(40px,5vw,68px)]">
          {/* ── Left: pitch and capture ── */}
          <div>
            <div className="mb-[22px] inline-flex items-center gap-[9px] rounded-full bg-brand-tint px-3.5 py-[7px]">
              <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-brand text-brand" />
              <span className="text-label text-brand-hover">Launching soon in Portugal</span>
            </div>

            <h1 className="mb-5 text-[clamp(40px,5.4vw,66px)] font-extrabold leading-[1.02] tracking-[-.04em] text-ink [text-wrap:balance]">
              When your usual person can't.
            </h1>

            <p className="mb-[30px] max-w-[520px] text-[clamp(16px,1.35vw,18px)] font-medium leading-[1.6] text-ink-60 [text-wrap:pretty]">
              Snap a photo of the problem. Get matched with a vetted local artisan. AI diagnosis,
              upfront pricing, multilingual chat. Launching soon in Portugal.
            </p>

            <div id="join" className="max-w-[520px] scroll-mt-24">
              <WaitlistForm
                variant="light"
                submitLabel="Join the waitlist"
                done={done}
                busy={busy}
                error={error}
                onSubmit={onSubmit}
              />

              <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
                <span className="text-meta text-ink-40">No spam. Early access only.</span>
                <button
                  type="button"
                  onClick={onOpenArtisan}
                  className="text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
                >
                  I'm a tradesperson →
                </button>
              </div>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-[22px] gap-y-2.5 border-t border-line-rule pt-[26px]">
              {TRUST.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-60">
                  <Icon size={16} className="flex-none text-brand" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: concept preview. Not a live booking widget. ── */}
          <div>
            <div className="overflow-hidden rounded-hero border border-line-soft bg-panel shadow-[0_28px_60px_-28px_rgba(15,27,61,.42)]">
              <div className="flex items-center gap-[11px] border-b border-line-rule px-[18px] py-4">
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-brand-tint">
                  <Sparkle size={17} className="text-brand" />
                </span>
                <span className="mr-auto text-label text-ink-40">AI diagnosis · preview</span>
                <span className="flex-none rounded-full bg-well px-[11px] py-1.5 text-xs font-bold text-ink-60">
                  Concept
                </span>
              </div>

              <div className="px-[18px] pt-[18px]">
                <div className="relative overflow-hidden rounded-[18px] bg-canvas">
                  <img
                    src="https://images.pexels.com/photos/1249610/pexels-photo-1249610.jpeg?auto=compress&cs=tinysrgb&w=1600"
                    alt="A dripping tap, the kind of problem Dashfixe diagnoses from a photo"
                    loading="lazy"
                    className="block h-[216px] w-full object-cover"
                  />
                  <div className="pointer-events-none absolute left-[22%] top-[24%] h-[46%] w-[44%] rounded-lg border-[1.5px] border-brand bg-brand/10" />
                  <div className="pointer-events-none absolute left-[22%] top-[24%] -translate-y-full rounded-[7px_7px_7px_0] bg-brand px-[9px] py-[5px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white">
                    Leak
                  </div>
                </div>
              </div>

              <div className="p-[18px]">
                <div className="overflow-hidden rounded-[18px] border border-line-soft">
                  {DIAGNOSIS.map(({ Icon, label, value, money }, i) => (
                    <div
                      key={label}
                      className={
                        'flex items-center gap-3.5 px-4 py-3.5' +
                        (i < DIAGNOSIS.length - 1 ? ' border-b border-line-rule' : '')
                      }
                    >
                      <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-brand-tint">
                        <Icon size={17} className="text-brand" />
                      </span>
                      <span className="mr-auto text-meta text-ink-40">{label}</span>
                      <span
                        className={
                          'flex-none text-ink ' +
                          (money
                            ? 'text-[17px] font-extrabold tracking-[-.02em]'
                            : 'text-[14.5px] font-bold')
                        }
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-[11px] border-t border-line-rule bg-page px-[18px] py-[15px]">
                <Reroute size={17} className="flex-none text-brand" />
                <span className="text-[13.5px] font-bold text-ink-80">
                  Automatic matching &amp; backup routing
                </span>
              </div>
            </div>

            {/* Overlapping estimate card */}
            <div className="relative z-[2] -mt-3 ml-[clamp(16px,8vw,72px)] max-w-[330px] rounded-card border border-line-soft bg-panel px-[18px] py-4 shadow-[0_24px_50px_-22px_rgba(15,27,61,.4)]">
              <div className="mb-3 flex items-center gap-[9px]">
                <span className="mr-auto text-label text-ink-40">Before they travel</span>
                <span className="flex-none rounded-full bg-success-tint px-2.5 py-[5px] text-xs font-bold text-[#15803d]">
                  Approved
                </span>
              </div>
              {ESTIMATE.map((row, i) => (
                <div
                  key={row.label}
                  className={
                    'flex items-center gap-3 ' +
                    (i === 0 ? 'border-b border-line-rule pb-2.5' : 'py-2.5')
                  }
                >
                  <span className="mr-auto text-meta text-ink-60">{row.label}</span>
                  <span className="flex-none text-[13.5px] font-extrabold text-ink">{row.value}</span>
                </div>
              ))}
              <div className="flex items-baseline gap-3 border-t border-line-rule pt-[11px]">
                <span className="mr-auto text-[14.5px] font-bold text-ink">Total</span>
                <span className="flex-none text-xl font-extrabold tracking-[-.025em] text-ink">
                  €63.00
                </span>
              </div>
            </div>

            <p className="mt-[22px] max-w-[420px] text-[13.5px] font-semibold leading-[1.5] text-ink-60">
              An illustration of the planned flow. Dashfixe is pre-launch — nothing here is a live
              booking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
