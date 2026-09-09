import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Bell } from '../icons';
import { link } from '../../routes';

const LINK = 'text-[14.5px] font-semibold text-ink-60 transition hover:text-ink';

export default function CustomerNav({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-[60] border-b border-line-soft bg-panel">
      <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)]">
        <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-x-7 gap-y-3 py-2.5">
          <a href="#top" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-7 w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[18px] w-auto" />
          </a>

          <nav className="flex flex-wrap items-center gap-[26px]">
            <a href="#top" className="text-[14.5px] font-bold text-brand">Home</a>
            <a href="#requests" className={LINK}>My requests</a>
            <a href="#places" className={LINK}>Places</a>
            <a href={link('help')} className={LINK}>Help</a>
          </nav>

          <div className="flex flex-none items-center gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-ctl w-ctl place-items-center rounded-well bg-well transition hover:bg-line"
            >
              <Bell size={19} className="text-ink-60" />
              <span className="absolute right-[11px] top-2.5 block h-2 w-2 rounded-full border-2 border-well bg-brand" />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-ctl items-center gap-2.5 rounded-well border border-line bg-panel px-1.5 transition hover:bg-page"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-avatar text-xs font-extrabold text-brand">
                AM
              </span>
              <span className="pr-1.5 text-sm font-bold text-ink">Alex</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
