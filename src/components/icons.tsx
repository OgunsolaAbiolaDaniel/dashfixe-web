/**
 * Line icons from designs/Dashfixe waitlist.dc.html.
 * Lucide style: stroke 1.9, round caps and joins, currentColor.
 */
type IconProps = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 20,
  className,
  strokeWidth = 1.9,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);

export const Sparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
    <path d="m18.5 15 .8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" />
  </Svg>
);

export const Chat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
  </Svg>
);

export const Card = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </Svg>
);

export const CardPlain = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
  </Svg>
);

export const Shield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const Euro = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 5.5A7 7 0 0 0 7.5 12 7 7 0 0 0 18 18.5" />
    <path d="M4 10h8M4 14h8" />
  </Svg>
);

export const Globe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </Svg>
);

export const Wrench = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.5 3.5a5 5 0 0 0-6.6 6.2L3 15.6V21h5.4l5.9-5.9a5 5 0 0 0 6.2-6.6l-3.2 3.2-2.8-.6-.6-2.8 3.2-3.2Z" />
  </Svg>
);

export const Bolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="m13 2-8 11h6l-1 9 8-11h-6l1-9Z" />
  </Svg>
);

export const Roller = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="6" rx="2" />
    <path d="M19 9v3a2 2 0 0 1-2 2h-6" />
    <rect x="9" y="14" width="4" height="7" rx="1.5" />
  </Svg>
);

export const Saw = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14 4 6 6-9 9H5v-6l9-9Z" />
    <path d="m11.5 6.5 6 6" />
  </Svg>
);

export const Spray = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3h5l1 7H7l1-7Z" />
    <path d="M10.5 10v4" />
    <rect x="6" y="14" width="9" height="7" rx="2" />
  </Svg>
);

export const Home = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M9 21v-7h6v7" />
  </Svg>
);

export const IdCard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="2.2" />
    <path d="M5.6 16.6a4 4 0 0 1 6.8 0M15 9h4M15 13h4" />
  </Svg>
);

export const Diagnose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
    <path d="M7 12h10" />
  </Svg>
);

export const Basket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 8H3l1.4 10.2A2 2 0 0 0 6.4 20h11.2a2 2 0 0 0 2-1.8L21 8Z" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
  </Svg>
);

export const Reroute = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 2.1 21 6l-4 3.9" />
    <path d="M21 6H8a5 5 0 0 0-5 5" />
    <path d="M7 21.9 3 18l4-3.9" />
    <path d="M3 18h13a5 5 0 0 0 5-5" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="m20 6-11 11-5-5" />
  </Svg>
);

export const Close = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const MapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const Clock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </Svg>
);

export const ChevronDown = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const Calendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const CalendarCheck = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="m10 15 1.6 1.6L15 13" />
  </Svg>
);

export const Receipt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
    <path d="M9.5 8h5M9.5 12h5" />
  </Svg>
);

export const ReceiptSlim = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
    <path d="M9.5 9h5" />
  </Svg>
);

export const Crosshair = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="5" />
  </Svg>
);

export const Plus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Bell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const ArrowRight = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

export const ArrowRightShort = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M5 12h13M12 6l6 6-6 6" />
  </Svg>
);

export const Phone = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18.5h2" />
  </Svg>
);

export const Mail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const HomeSolid = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </Svg>
);

export const Briefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </Svg>
);

export const Apple = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.2 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.7-2.2.9-1.2 1.2-2.4 1.2-2.5 0 0-2.3-.9-2.3-3.6ZM14 5.3c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.7-1.3Z" />
  </svg>
);

