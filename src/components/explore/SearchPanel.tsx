import { useState } from 'react';
import { Camera, ChevronDown, ClockSmall, MapPin, Star, Verified } from '../icons';
import { AVAILABLE, AVAILABLE_COUNT, TOTAL_ONLINE, type Artisan } from './artisans';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  onChat: (id: string) => void;
};

function ArtisanCard({
  a,
  selected,
  onSelect,
  onChat,
}: {
  a: Artisan;
  selected: boolean;
  onSelect: () => void;
  onChat: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={
        'cursor-pointer rounded-card bg-panel p-4 transition ' +
        (selected
          ? 'border-[1.5px] border-brand shadow-selected'
          : 'border border-line-soft hover:border-line')
      }
    >
      <div className="flex items-start gap-[13px]">
        <span className="grid h-[50px] w-[50px] flex-none place-items-center rounded-[17px] bg-avatar text-sm font-extrabold text-brand">
          {a.initials}
        </span>
        <span className="mr-auto min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[17.5px] font-bold tracking-[-.01em] text-ink">{a.name}</span>
            {a.verified && <Verified size={15} className="flex-none text-brand" />}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-60">
            <Star size={12} className="flex-none text-star" />
            {a.rating} · {a.jobs} jobs · {a.km} km
          </span>
        </span>
        <span className="flex-none text-right">
          <span className="block text-[19px] font-extrabold tracking-[-.02em] text-ink">{a.price}</span>
          <span className="mt-px block text-[11.5px] text-ink-40">estimated</span>
        </span>
      </div>

      {a.badges && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.badges.map((b) => (
            <span
              key={b}
              className="rounded-full bg-brand-tint px-[11px] py-1.5 text-xs font-semibold text-brand-hover"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-[11px] border-t border-line-rule pt-[13px]">
        <span
          className={
            'mr-auto flex items-center gap-1.5 text-[13.5px] font-bold ' +
            (selected ? 'text-brand' : 'text-ink-60')
          }
        >
          <ClockSmall size={14} />
          {a.eta} min away
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
          className={
            'rounded-[13px] px-5 py-[11px] text-[14.5px] font-bold transition ' +
            (selected
              ? 'bg-brand text-white hover:bg-brand-hover'
              : 'bg-brand-tint text-brand-hover hover:bg-brand-tint-hover')
          }
        >
          {selected ? `Chat with ${a.name.split(' ')[0]}` : 'Chat'}
        </button>
      </div>
    </article>
  );
}

export default function SearchPanel({ selectedId, onSelect, onChat }: Props) {
  const [when, setWhen] = useState<'now' | 'later'>('now');

  return (
    <div className="flex min-w-0 flex-col gap-5 overflow-y-auto border-r border-line-soft bg-page p-[26px]">
      <div>
        <div className="mb-3.5 flex w-fit items-center gap-2 rounded-full bg-brand-tint px-3.5 py-2">
          <span className="pulse-dot block h-[7px] w-[7px] rounded-full bg-brand text-brand" />
          <span className="text-[12.5px] font-bold text-brand-hover">Amora &amp; Seixal · live</span>
        </div>
        <h1 className="mb-2 text-4xl font-extrabold leading-[1.04] tracking-[-.035em] text-ink">
          Who is free
          <br />
          right now
        </h1>
        <p className="text-[15.5px] leading-[1.5] text-ink-60">
          Nine vetted artisans are online within 5 km. Pick one, agree the price in chat, and they
          travel once.
        </p>
      </div>

      <div className="flex gap-px overflow-hidden rounded-[20px] border border-[#e6ebf3] bg-[#e6ebf3]">
        {[
          { v: String(TOTAL_ONLINE), unit: '', label: 'Online' },
          { v: '21', unit: ' min', label: 'Median arrival' },
          { v: '4.8', unit: '', label: 'Cohort rating' },
        ].map((s) => (
          <span key={s.label} className="flex-1 bg-panel px-3 py-3.5 text-center">
            <span className="block text-[21px] font-extrabold tracking-[-.02em] text-ink">
              {s.v}
              {s.unit && <span className="text-[13px]">{s.unit}</span>}
            </span>
            <span className="mt-0.5 block text-[11.5px] font-semibold text-ink-40">{s.label}</span>
          </span>
        ))}
      </div>

      <div className="rounded-card border border-line-soft bg-panel p-[18px]">
        <div className="mb-[11px] text-label text-ink-40">What do you need?</div>
        <button
          type="button"
          className="mb-2.5 flex w-full items-center gap-3 rounded-input border border-line bg-page px-[15px] py-3.5 text-left"
        >
          <Camera size={18} className="flex-none text-brand" />
          <span className="mr-auto text-[15px] font-bold text-ink">Plumbing</span>
          <ChevronDown size={16} className="text-ink-40" />
        </button>
        <button
          type="button"
          className="mb-3 flex w-full items-center gap-3 rounded-input border border-line bg-page px-[15px] py-3.5 text-left"
        >
          <MapPin size={18} className="flex-none text-brand" />
          <span className="mr-auto truncate text-[15px] font-semibold text-ink-80">
            Rua da Cooperativa 14, Amora
          </span>
        </button>
        <div className="flex gap-2 rounded-well bg-well p-1">
          {(['now', 'later'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setWhen(v)}
              className={
                'flex-1 rounded-[10px] p-2.5 text-center text-sm transition ' +
                (when === v
                  ? 'bg-panel font-bold text-ink shadow-card'
                  : 'font-semibold text-ink-40 hover:text-ink-60')
              }
            >
              {v === 'now' ? 'Now' : 'Book for later'}
            </button>
          ))}
        </div>
      </div>

      <div className="-mb-2 flex items-baseline">
        <span className="mr-auto text-label text-ink-40">
          Available · {AVAILABLE_COUNT} of {TOTAL_ONLINE}
        </span>
        <button type="button" className="text-[13px] font-bold text-brand">
          Sort: arrival
        </button>
      </div>

      <div className="flex flex-col gap-[11px]">
        {AVAILABLE.map((a) => (
          <ArtisanCard
            key={a.id}
            a={a}
            selected={a.id === selectedId}
            onSelect={() => onSelect(a.id)}
            onChat={() => onChat(a.id)}
          />
        ))}
      </div>

      <p className="text-[12.5px] leading-[1.5] text-ink-40">
        Estimates are a range until they have seen the photo and talked to you. The exact itemised
        total is approved in chat, before anyone travels.
      </p>
    </div>
  );
}
