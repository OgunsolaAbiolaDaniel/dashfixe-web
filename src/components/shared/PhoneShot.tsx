import type { ReactNode } from 'react';

/**
 * A still of an app screen in a phone frame — for showcasing, never for use.
 * The screen is decorative (aria-hidden, inert); the caption says what it shows.
 */
type Props = { caption: string; children: ReactNode; onDark?: boolean; className?: string };

export default function PhoneShot({ caption, children, onDark = false, className = '' }: Props) {
  return (
    <figure className={`w-[236px] flex-none snap-center ${className}`}>
      <div
        aria-hidden="true"
        inert
        className={
          'rounded-[38px] p-[7px] ' +
          (onDark ? 'bg-[#1c2a52] shadow-[0_30px_60px_-24px_rgba(0,0,0,.6)] ring-1 ring-white/10' : 'bg-ink shadow-panel')
        }
      >
        <div className="relative h-[486px] overflow-hidden rounded-[31px] bg-page">
          <span className="absolute left-1/2 top-2 z-10 h-[18px] w-[74px] -translate-x-1/2 rounded-full bg-ink" />
          {children}
        </div>
      </div>
      <figcaption className={'mt-3.5 text-center text-[13.5px] font-bold ' + (onDark ? 'text-onink-strong' : 'text-ink-80')}>{caption}</figcaption>
    </figure>
  );
}
