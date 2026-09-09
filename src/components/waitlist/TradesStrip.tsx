import { Bolt, Roller, Saw, Spray, Wrench } from '../icons';

const TRADES = [
  { Icon: Wrench, label: 'Plumbing' },
  { Icon: Bolt, label: 'Electrical' },
  { Icon: Roller, label: 'Painting' },
  { Icon: Saw, label: 'Carpentry' },
  { Icon: Spray, label: 'Cleaning' },
];

export default function TradesStrip() {
  return (
    <section className="border-t border-line-rule bg-panel">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[26px]">
        <div className="flex flex-wrap items-center gap-x-[26px] gap-y-3.5">
          <span className="flex-none text-label text-ink-30">Trades at launch</span>
          <ul className="flex flex-wrap gap-[9px]">
            {TRADES.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-full border border-line-soft bg-page px-3.5 py-[9px] text-[13.5px] font-bold text-ink-80"
              >
                <Icon size={15} className="text-brand" />
                {label}
              </li>
            ))}
            <li className="flex items-center px-1 py-[9px] text-[13.5px] font-semibold text-ink-40">
              More after the pilot
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
