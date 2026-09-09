import { Check, Home, Wrench } from '../icons';

const CLIENT_POINTS = [
  ['Your backup plan', "When your usual pro is busy or on holiday, we're here."],
  ['Clear, upfront pricing', 'No surprises. Know the cost before you commit.'],
  ['No endless calling', 'Stop leaving voicemails. Get connected instantly.'],
];

const PRO_POINTS = [
  ['Set your own rates', 'You control what you earn for every job.'],
  ['No lead fees', 'Keep more of what you make. We only take a cut when you get paid.'],
  ['Work on your schedule', 'Toggle availability on and off with a single tap.'],
];

function Points({ items }: { items: string[][] }) {
  return (
    <div className="mb-[30px] flex flex-col gap-[18px]">
      {items.map(([title, body]) => (
        <div key={title} className="flex gap-[13px]">
          <span className="mt-px grid h-6 w-6 flex-none place-items-center rounded-lg bg-brand-tint">
            <Check size={14} strokeWidth={2.6} className="text-brand" />
          </span>
          <span className="min-w-0">
            <span className="mb-[3px] block text-row text-ink">{title}</span>
            <span className="block text-[14.5px] font-medium leading-[1.55] text-ink-60">
              {body}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Both cards carry equal visual weight — a locked rule in the project docs. */
export default function DualAudience({ onOpenArtisan }: { onOpenArtisan: () => void }) {
  return (
    <section className="border-t border-line-soft bg-page">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[clamp(56px,7vw,96px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-[22px]">
          <article
            id="clients"
            className="flex scroll-mt-24 flex-col rounded-card border border-line-soft bg-panel p-[clamp(24px,3vw,34px)]"
          >
            <div className="mb-5 flex items-center gap-[11px]">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-well bg-brand-tint">
                <Home size={20} className="text-brand" />
              </span>
              <span className="text-label text-ink-40">For homeowners</span>
            </div>
            <h3 className="mb-6 text-[clamp(24px,2.4vw,30px)] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">
              A fallback that always answers.
            </h3>
            <Points items={CLIENT_POINTS} />
            <a
              href="#join"
              className="mt-auto flex h-ctl-lg items-center justify-center rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
            >
              Join the waitlist
            </a>
          </article>

          <article
            id="artisans"
            className="flex scroll-mt-24 flex-col rounded-card border border-line-soft bg-panel p-[clamp(24px,3vw,34px)]"
          >
            <div className="mb-5 flex items-center gap-[11px]">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-well bg-brand-tint">
                <Wrench size={20} className="text-brand" />
              </span>
              <span className="text-label text-ink-40">For pros</span>
            </div>
            <h3 className="mb-6 text-[clamp(24px,2.4vw,30px)] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">
              Work comes to you. You keep the job.
            </h3>
            <Points items={PRO_POINTS} />
            <button
              type="button"
              onClick={onOpenArtisan}
              className="mt-auto flex h-ctl-lg items-center justify-center rounded-btn bg-ink text-[14.5px] font-bold text-white transition hover:bg-ink-80"
            >
              Apply as a pro
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
