import { Crosshair, HomeSolid } from '../icons';
import { AVAILABLE, MAP_ONLY, ON_JOB } from './artisans';

type Props = { variant?: 'explore'; selectedId: string; onSelect: (id: string) => void } | { variant: 'peek' };

const at = (p: { left: number; top: number }) => ({
  left: `${p.left}%`,
  top: `${p.top}%`,
  transform: 'translate(-50%,-50%)',
});

/**
 * The drawn-city fallback for LiveMap — designs/Dashfixe Web.dc.html.
 *
 * Shown only when the vector tiles cannot load (offline, blocked network, no WebGL).
 * Same markers, same key, same controls, so the page keeps its shape. `variant="peek"`
 * mirrors LiveMap's non-interactive hero backdrop: no key, no controls, inert markers.
 */
export default function MapCanvas(props: Props) {
  const isPeek = props.variant === 'peek';
  const selectedId = isPeek ? undefined : props.selectedId;
  const onSelect = isPeek ? undefined : props.onSelect;
  const selected = AVAILABLE.find((a) => a.id === selectedId);

  return (
    // Fills the positioned cell in ExplorePage. Every child is absolute, so this
    // must not size itself from content or the map collapses to zero height.
    <div className={`absolute inset-0 overflow-hidden bg-[#e8edf6]${isPeek ? ' pointer-events-none' : ''}`}>
      <svg
        viewBox="0 0 900 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="900" height="900" fill="#e9eef7" />
        <path d="M0 620 L200 656 L430 632 L660 668 L900 640 L900 900 L0 900 Z" fill="#cfe0ef" />
        <g fill="#dde4f0">
          <rect x="40" y="60" width="150" height="110" rx="6" />
          <rect x="220" y="40" width="120" height="86" rx="6" />
          <rect x="380" y="66" width="104" height="104" rx="6" />
          <rect x="520" y="34" width="168" height="96" rx="6" />
          <rect x="720" y="62" width="140" height="108" rx="6" />
          <rect x="46" y="216" width="128" height="130" rx="6" />
          <rect x="206" y="188" width="142" height="94" rx="6" />
          <rect x="382" y="212" width="118" height="126" rx="6" />
          <rect x="536" y="176" width="150" height="112" rx="6" />
          <rect x="726" y="206" width="134" height="126" rx="6" />
          <rect x="52" y="396" width="116" height="86" rx="6" />
          <rect x="204" y="330" width="136" height="128" rx="6" />
          <rect x="392" y="392" width="104" height="90" rx="6" />
          <rect x="540" y="342" width="144" height="120" rx="6" />
          <rect x="722" y="386" width="138" height="96" rx="6" />
          <rect x="44" y="524" width="140" height="76" rx="6" />
          <rect x="216" y="510" width="118" height="90" rx="6" />
          <rect x="390" y="520" width="130" height="82" rx="6" />
          <rect x="562" y="506" width="122" height="94" rx="6" />
          <rect x="716" y="522" width="146" height="78" rx="6" />
        </g>
        <g stroke="#f6f8fc" fill="none" strokeLinecap="round">
          <path d="M0 192 H900" strokeWidth="22" />
          <path d="M0 366 H900" strokeWidth="17" />
          <path d="M0 496 H900" strokeWidth="13" />
          <path d="M192 0 V900" strokeWidth="20" />
          <path d="M512 0 V900" strokeWidth="16" />
          <path d="M706 0 V900" strokeWidth="12" />
          <path d="M0 618 H900" strokeWidth="12" />
          <path d="M352 130 V620" strokeWidth="10" />
        </g>
        <circle cx="512" cy="366" r="230" fill="#2563eb" opacity=".05" />
        <circle
          cx="512"
          cy="366"
          r="230"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeDasharray="7 7"
          opacity=".45"
        />
      </svg>

      {!isPeek && (
        <>
          {/* Key — frosted, allowed here because it sits over the map */}
          <div className="absolute left-6 top-6 rounded-[18px] border border-white/90 bg-white/[.86] px-[17px] py-[15px] shadow-map backdrop-blur-[14px]">
            <div className="mb-[11px] text-label text-ink-40">Map key</div>
            <div className="mb-[7px] flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-md bg-brand" />
              Available now
            </div>
            <div className="mb-[7px] flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-md border-[1.5px] border-dashed border-ink-30 bg-panel" />
              On a job
            </div>
            <div className="flex items-center gap-[9px] text-[13px] font-semibold">
              <i className="block h-[15px] w-[15px] flex-none rounded-full bg-ink" />
              Your address
            </div>
          </div>

          <div className="absolute right-6 top-6 flex flex-col gap-[9px]">
            <button
              type="button"
              aria-label="Centre on my location"
              className="grid h-[42px] w-[42px] place-items-center rounded-well bg-panel shadow-[0_6px_18px_-6px_rgba(15,27,61,.3)]"
            >
              <Crosshair size={18} className="text-brand" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              className="grid h-[42px] w-[42px] place-items-center rounded-well bg-panel text-lg font-extrabold text-ink-60 shadow-[0_6px_18px_-6px_rgba(15,27,61,.3)]"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className="grid h-[42px] w-[42px] place-items-center rounded-well bg-panel text-lg font-extrabold text-ink-60 shadow-[0_6px_18px_-6px_rgba(15,27,61,.3)]"
            >
              −
            </button>
          </div>
        </>
      )}

      {/* On a job — dashed, not selectable */}
      {ON_JOB.map((m) => (
        <div
          key={m.id}
          style={at(m.at)}
          className="absolute grid h-9 w-9 place-items-center rounded-xl border-[1.5px] border-dashed border-ink-30 bg-panel text-[11px] font-bold text-ink-30"
        >
          {m.initials}
        </div>
      ))}

      {/* Available but unselected — solid outline */}
      {[...AVAILABLE, ...MAP_ONLY]
        .filter((m) => m.id !== selectedId)
        .map((m) => (
          <button
            key={m.id}
            type="button"
            tabIndex={isPeek ? -1 : 0}
            onClick={() => onSelect?.(m.id)}
            style={at(m.at)}
            aria-label={m.initials}
            className="absolute grid h-10 w-10 place-items-center rounded-[13px] border-2 border-brand bg-panel text-xs font-extrabold text-brand shadow-marker transition hover:bg-brand-tint"
          >
            {m.initials}
          </button>
        ))}

      {/* Selected — expands into a pill carrying price and ETA */}
      {selected && (
        <div style={at(selected.at)} className="absolute z-[3]">
          <span className="pulse-dot absolute -inset-4 block rounded-full bg-brand/[.16] text-brand/[.16]" />
          <span className="relative flex items-center gap-[9px] rounded-full border-[3px] border-white bg-brand py-1.5 pl-1.5 pr-[15px] shadow-[0_12px_26px_-6px_rgba(37,99,235,.6)]">
            <i className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-white/[.24] text-[11px] font-extrabold not-italic text-white">
              {selected.initials}
            </i>
            <b className="whitespace-nowrap text-[13.5px] font-bold text-white">
              {selected.price} · {selected.eta} min
            </b>
          </span>
        </div>
      )}

      {/* Your address */}
      <div
        style={{ left: '53%', top: '52%', transform: 'translate(-50%,-100%)' }}
        className="absolute z-[2] flex flex-col items-center"
      >
        <span className="grid h-[38px] w-[38px] place-items-center rounded-full border-[3px] border-white bg-ink shadow-[0_8px_20px_-6px_rgba(15,27,61,.5)]">
          <HomeSolid size={17} strokeWidth={2} className="text-white" />
        </span>
        <span className="block h-[9px] w-0.5 bg-ink" />
      </div>
    </div>
  );
}
