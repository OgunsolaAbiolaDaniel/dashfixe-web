import { Calendar, ChevronDown, Clock, Close, ReceiptSlim } from '../icons';
import { link } from '../../routes';

const BENEFITS = [
  { Icon: Calendar, text: 'Choose a two-hour window up to 30 days ahead.' },
  { Icon: ReceiptSlim, text: 'The estimate is agreed in advance, not on the doorstep.' },
  { Icon: Close, text: 'Cancel free any time before the artisan sets off.' },
];

export default function BookAhead({ onAuth }: { onAuth: () => void }) {
  return (
    <section id="later" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(56px,7vw,96px)]">
        <h2 className="mb-[30px] text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.06] tracking-[-.04em] text-ink">
          Plan it for later
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-stretch gap-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center overflow-hidden rounded-card bg-brand-tint-strong">
            <div className="p-[clamp(26px,3vw,40px)]">
              <h3 className="mb-[26px] text-[clamp(26px,3vw,38px)] font-extrabold leading-[1.08] tracking-[-.035em] text-ink [text-wrap:balance]">
                Hold a slot that suits you
              </h3>
              <div className="mb-3 text-label text-ink-80">Choose date and time</div>
              <div className="mb-5 flex flex-wrap gap-3">
                <div className="flex h-[54px] min-w-0 flex-[1_1_150px] items-center gap-[11px] rounded-well bg-panel px-[15px]">
                  <Calendar size={18} className="flex-none text-ink-60" />
                  <input
                    type="text"
                    placeholder="Date"
                    aria-label="Date"
                    className="min-w-0 flex-1 border-0 bg-transparent text-[15.5px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30"
                  />
                </div>
                <div className="flex h-[54px] min-w-0 flex-[1_1_150px] items-center gap-[11px] rounded-well bg-panel px-[15px]">
                  <Clock size={18} className="flex-none text-ink-60" />
                  <input
                    type="text"
                    placeholder="Time"
                    aria-label="Time"
                    className="min-w-0 flex-1 border-0 bg-transparent text-[15.5px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30"
                  />
                  <ChevronDown size={15} className="flex-none text-ink-40" />
                </div>
              </div>
              <button
                type="button"
                onClick={onAuth}
                className="h-14 w-full max-w-[340px] rounded-btn bg-ink text-base font-bold text-white transition hover:bg-ink-80"
              >
                Next
              </button>
            </div>
            <div className="min-h-[220px] self-stretch bg-[#c7d7f2]">
              <img
                src="https://images.pexels.com/photos/5484718/pexels-photo-5484718.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt=""
                loading="lazy"
                className="block h-full min-h-[220px] w-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-card bg-well p-[clamp(24px,2.6vw,32px)]">
            <h3 className="mb-[22px] text-2xl font-extrabold tracking-[-.03em] text-ink">Benefits</h3>
            {BENEFITS.map(({ Icon, text }, i) => (
              <div
                key={text}
                className={
                  'flex gap-[15px] ' +
                  (i === 0
                    ? 'border-b border-[#dbe0ea] pb-5'
                    : i === 1
                      ? 'border-b border-[#dbe0ea] py-5'
                      : 'pt-5')
                }
              >
                <Icon size={21} strokeWidth={1.6} className="mt-0.5 flex-none text-ink" />
                <span className="text-base font-semibold leading-[1.5] text-ink-80">{text}</span>
              </div>
            ))}
            <a
              href={link('help')}
              className="mt-6 inline-block border-b border-[#c8d1e0] pb-[3px] text-[15px] font-bold text-ink transition hover:border-ink hover:text-ink"
            >
              See terms
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
