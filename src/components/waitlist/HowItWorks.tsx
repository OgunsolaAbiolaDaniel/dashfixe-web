import { Camera, Card, Chat, Sparkle } from '../icons';

const STEPS = [
  {
    Icon: Camera,
    n: '01',
    title: 'Capture',
    body: 'Snap a quick photo of the issue. No long descriptions needed.',
  },
  {
    Icon: Sparkle,
    n: '02',
    title: 'AI match',
    body: 'Our system identifies the trade and finds an available pro nearby.',
  },
  {
    Icon: Chat,
    n: '03',
    title: 'Quote & chat',
    body: 'See the price upfront. Chat seamlessly in your preferred language.',
  },
  {
    Icon: Card,
    n: '04',
    title: 'Fix & pay',
    body: 'Job done right. Pay securely in-app with no hidden fees.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-panel">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[clamp(56px,7vw,96px)]">
        <div className="mb-10 max-w-[560px]">
          <div className="mb-3 text-label text-ink-40">How it works</div>
          <h2 className="mb-3 text-[clamp(30px,3.6vw,44px)] font-extrabold leading-[1.06] tracking-[-.035em] text-ink">
            Repair, reimagined.
          </h2>
          <p className="text-base font-medium leading-[1.55] text-ink-60">
            Four simple steps to a fixed home.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5">
          {STEPS.map(({ Icon, n, title, body }) => (
            <article
              key={n}
              className="rounded-card border border-line-soft bg-panel px-6 py-[26px] transition-shadow hover:shadow-[0_12px_32px_-18px_rgba(15,27,61,.35)]"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-well bg-brand-tint">
                  <Icon size={21} className="text-brand" />
                </span>
                <span className="text-[13px] font-extrabold tracking-[.06em] text-ink-30">{n}</span>
              </div>
              <h3 className="mb-2 text-section text-ink">{title}</h3>
              <p className="text-[14.5px] font-medium leading-[1.55] text-ink-60 [text-wrap:pretty]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
