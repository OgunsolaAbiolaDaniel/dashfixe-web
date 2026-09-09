import { Bolt, Plus, Roller, Saw, Spray, Wrench } from '../icons';

const TRADES = [
  { Icon: Wrench, name: 'Plumbing', hint: 'Leaks, taps, drains' },
  { Icon: Bolt, name: 'Electrical', hint: 'DGEG certified only' },
  { Icon: Roller, name: 'Painting', hint: 'Walls, ceilings, trim' },
  { Icon: Saw, name: 'Carpentry', hint: 'Doors, shelves, repairs' },
  { Icon: Spray, name: 'Cleaning', hint: 'Deep and move-out' },
  { Icon: Plus, name: 'Something else', hint: "Describe it and we'll route it" },
];

export default function Trades({ onAuth }: { onAuth: () => void }) {
  return (
    <section id="trades" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(56px,7vw,96px)]">
        <div className="mb-7 flex flex-wrap items-end gap-5">
          <h2 className="mr-auto text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.06] tracking-[-.04em] text-ink">
            Pick a trade
          </h2>
          <span className="text-[15.5px] font-semibold text-ink-60">
            Five at pilot launch. More as the network grows.
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3.5">
          {TRADES.map(({ Icon, name, hint }) => (
            <button
              key={name}
              type="button"
              onClick={onAuth}
              className="rounded-[18px] bg-well p-[22px] text-left transition hover:bg-line"
            >
              <span className="mb-[18px] grid h-11 w-11 place-items-center rounded-full bg-panel">
                <Icon size={21} strokeWidth={1.6} className="text-brand" />
              </span>
              <span className="block text-[18px] font-bold tracking-[-.015em] text-ink">{name}</span>
              <span className="mt-1 block text-sm font-semibold text-ink-60">{hint}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
