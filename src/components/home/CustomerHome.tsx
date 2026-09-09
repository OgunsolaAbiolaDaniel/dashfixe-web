import { useState } from 'react';
import {
  ArrowRightShort,
  Bolt,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Close,
  HomeSolid,
  MapPin,
  Plus,
  Saw,
  Spray,
  Wrench,
} from '../icons';

const REBOOK = [
  { initials: 'TF', name: 'Tiago Ferreira', trade: 'Plumbing', available: true },
  { initials: 'CP', name: 'Carla Pinto', trade: 'Cleaning · free from 17:00', available: false },
];

const RECENT = [
  { title: 'Bathroom light replaced', meta: '2 Sep · Rita Almeida · paid in app', amount: '€48.00', done: true },
  { title: 'Deep clean, two bedrooms', meta: '18 Aug · Carla Pinto · paid in app', amount: '€95.00', done: true },
  { title: 'Wardrobe door adjustment', meta: '11 Aug · cancelled before travel', amount: null, done: false },
];

const PLACES = [
  { Icon: HomeSolid, name: 'Home', address: 'Rua da Cooperativa 14, Amora', primary: true },
  { Icon: Briefcase, name: 'Office', address: 'Praça 1º de Maio 3, Seixal', primary: false },
];

const QUICK = [
  { Icon: Wrench, name: 'Plumbing' },
  { Icon: Bolt, name: 'Electrical' },
  { Icon: Spray, name: 'Cleaning' },
  { Icon: Saw, name: 'Carpentry' },
];

const CARD = 'rounded-card border border-line-soft bg-panel';
const CHIP =
  'flex h-ctl items-center gap-[9px] rounded-well border border-line bg-panel px-4 text-sm font-bold text-ink transition hover:bg-page';

export default function CustomerHome() {
  const [when, setWhen] = useState<'now' | 'later'>('now');

  return (
    <div id="top" className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(28px,4vw,44px)]">
      <div className="mb-[26px]">
        <h1 className="mb-2.5 text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.06] tracking-[-.035em] text-ink">
          Good morning, Alex.
        </h1>
        <button type="button" className="flex items-center gap-2 text-[14.5px] font-semibold text-ink-60 transition hover:text-ink">
          <MapPin size={16} className="flex-none text-brand" />
          Rua da Cooperativa 14, Amora
          <ChevronDown size={14} className="flex-none text-ink-40" />
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-[22px]">
        {/* ── Main column ── */}
        <div className="flex flex-col gap-[22px]">
          <section className={`${CARD} p-[clamp(20px,2.4vw,26px)]`}>
            <div className="mb-4 text-label text-ink-40">New request</div>
            <div className="mb-3.5 flex gap-1.5 rounded-well bg-well p-1">
              {(['now', 'later'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWhen(v)}
                  className={
                    'flex-1 rounded-[10px] p-[11px] text-sm transition ' +
                    (when === v
                      ? 'bg-panel font-bold text-ink shadow-card'
                      : 'font-semibold text-ink-40 hover:text-ink-60')
                  }
                >
                  {v === 'now' ? 'Now' : 'Book for later'}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              aria-label="What needs fixing"
              placeholder="What needs fixing? The kitchen tap has been dripping since Tuesday…"
              className="w-full resize-y rounded-input border border-line bg-page px-[15px] py-3.5 text-[14.5px] font-semibold leading-[1.5] text-ink placeholder:text-ink-30"
            />
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" className={CHIP}>
                <Camera size={17} className="text-brand" />
                Add a photo
              </button>
              <button type="button" className={CHIP}>
                <MapPin size={17} className="text-brand" />
                Home
              </button>
            </div>
            <button
              type="button"
              className="mt-4 flex h-ctl-lg w-full items-center justify-center gap-[9px] rounded-[15px] bg-brand text-[15px] font-bold text-white transition hover:bg-brand-hover"
            >
              Find an artisan
              <ArrowRightShort size={17} />
            </button>
          </section>

          <section>
            <div className="mb-3.5 flex items-baseline gap-3.5">
              <h2 className="mr-auto text-section text-ink">Book someone again</h2>
              <a href="#requests" className="text-[13.5px] font-bold text-brand">See all</a>
            </div>
            <div className={`${CARD} overflow-hidden`}>
              {REBOOK.map((r, i) => (
                <div
                  key={r.initials}
                  className={'flex items-center gap-3.5 px-5 py-[18px]' + (i === 0 ? ' border-b border-line-rule' : '')}
                >
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-input bg-avatar text-sm font-extrabold text-brand">
                    {r.initials}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className="block text-row text-ink">{r.name}</span>
                    {r.available ? (
                      <span className="mt-0.5 flex items-center gap-[7px] text-meta text-ink-40">
                        Plumbing ·
                        <span className="flex items-center gap-1 font-bold text-success">
                          <span className="block h-1.5 w-1.5 rounded-full bg-success" />
                          Available
                        </span>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-meta text-ink-40">{r.trade}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="h-ctl-sm flex-none rounded-[13px] bg-brand-tint px-4 text-sm font-bold text-brand-hover transition hover:bg-brand-tint-hover"
                  >
                    Rebook
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="requests" className="scroll-mt-[88px]">
            <div className="mb-3.5 flex items-baseline gap-3.5">
              <h2 className="mr-auto text-section text-ink">Recent requests</h2>
              <a href="#requests" className="text-[13.5px] font-bold text-brand">History</a>
            </div>
            <div className={`${CARD} overflow-hidden`}>
              {RECENT.map((r, i) => (
                <div
                  key={r.title}
                  className={'flex items-center gap-4 px-5 py-[18px]' + (i < RECENT.length - 1 ? ' border-b border-line-rule' : '')}
                >
                  <span
                    className={
                      'grid h-12 w-12 flex-none place-items-center rounded-input ' +
                      (r.done ? 'bg-success-tint' : 'bg-well')
                    }
                  >
                    {r.done ? (
                      <Check size={20} className="text-success" />
                    ) : (
                      <Close size={20} className="text-ink-40" />
                    )}
                  </span>
                  <span className="mr-auto min-w-0">
                    <span className={'block text-row ' + (r.done ? 'text-ink' : 'text-ink-60')}>{r.title}</span>
                    <span className="mt-0.5 block text-meta text-ink-40">{r.meta}</span>
                  </span>
                  {r.amount ? (
                    <span className="flex-none text-[16.5px] font-extrabold tracking-[-.02em] text-ink">
                      {r.amount}
                    </span>
                  ) : (
                    <span className="flex-none rounded-full bg-well px-[13px] py-2 text-[13.5px] font-bold text-ink-60">
                      No charge
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Working rail ── */}
        <div className="flex flex-col gap-[22px]">
          <section className="relative overflow-hidden rounded-hero bg-ink p-6 shadow-hero">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-[90px] -top-[140px] block h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.85)_0%,rgba(37,99,235,0)_68%)] blur-[28px]"
            />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-success-bright/40 bg-success-bright/[.16] px-[13px] py-1.5">
                  <span className="pulse-dot block h-[7px] w-[7px] flex-none rounded-full bg-success-bright text-success-bright" />
                  <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#a7f3cf]">
                    On the way
                  </span>
                </span>
                <span className="ml-auto text-[13px] font-bold text-onink">Arrives 14:35</span>
              </div>
              <div className="mb-[5px] text-[13px] font-bold text-brand-on-dark">
                Plumbing · leaking mixer tap
              </div>
              <h3 className="mb-[18px] text-2xl font-extrabold leading-[1.12] tracking-[-.03em] text-white">
                Tiago is heading over
              </h3>
              <div className="mb-[18px] flex items-center gap-3 border-y border-white/[.12] py-3.5">
                <span className="mr-auto text-meta text-onink">Approved estimate</span>
                <span className="flex-none text-xl font-extrabold tracking-[-.025em] text-white">
                  €63.00
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  className="h-12 flex-[1_1_130px] rounded-[15px] bg-brand text-[14.5px] font-bold text-white shadow-brand transition hover:bg-brand-hover"
                >
                  Open chat
                </button>
                <button
                  type="button"
                  className="h-12 flex-none rounded-[15px] border border-white/[.18] bg-white/10 px-[18px] text-[14.5px] font-bold text-onink-strong transition hover:bg-white/[.16]"
                >
                  Track
                </button>
              </div>
            </div>
          </section>

          <section id="places" className={`${CARD} scroll-mt-[88px] overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-line-rule px-5 py-[18px]">
              <span className="mr-auto text-label text-ink-40">Your places</span>
              <button
                type="button"
                className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
              >
                <Plus size={14} strokeWidth={2.4} />
                Add
              </button>
            </div>
            {PLACES.map((p, i) => (
              <div
                key={p.name}
                className={'flex items-center gap-3.5 px-5 py-4' + (i === 0 ? ' border-b border-line-rule' : '')}
              >
                <span
                  className={
                    'grid h-10 w-10 flex-none place-items-center rounded-well ' +
                    (p.primary ? 'bg-brand-tint' : 'bg-well')
                  }
                >
                  <p.Icon size={18} className={p.primary ? 'text-brand' : 'text-ink-60'} />
                </span>
                <span className="mr-auto min-w-0">
                  <span className="block text-[15px] font-bold text-ink">{p.name}</span>
                  <span className="mt-px block text-[13px] font-semibold text-ink-40">{p.address}</span>
                </span>
              </div>
            ))}
          </section>

          <section className={`${CARD} p-[22px]`}>
            <div className="mb-4 text-label text-ink-40">Quick request</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-2.5">
              {QUICK.map(({ Icon, name }) => (
                <button
                  key={name}
                  type="button"
                  className="flex flex-col gap-2.5 rounded-input border border-line-soft bg-panel p-3.5 text-left transition hover:bg-page"
                >
                  <Icon size={19} className="text-brand" />
                  <span className="text-sm font-bold text-ink">{name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
