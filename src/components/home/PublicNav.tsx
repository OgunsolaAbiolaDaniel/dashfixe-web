import { Link } from 'react-router-dom';
import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Globe } from '../icons';
import { link } from '../../routes';

const NAV = 'rounded-xl px-[15px] py-2.5 text-nav text-ink transition hover:bg-well hover:text-ink';

export default function PublicNav({ onAuth }: { onAuth: () => void }) {
  return (
    <header className="sticky top-0 z-[60] border-b border-line-rule bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)]">
        <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-x-7 gap-y-3 py-3">
          <a href="#top" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-[30px] w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[19px] w-auto" />
          </a>

          <nav className="flex flex-wrap items-center gap-0.5">
            <a href="#explore" className={NAV}>Fix</a>
            <a href="#later" className={NAV}>Book ahead</a>
            <Link to={link('forArtisans')} className={NAV}>Earn</Link>
            <a href="#trades" className={NAV}>Trades</a>
          </nav>

          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              className="flex h-ctl items-center gap-2 rounded-xl px-[13px] text-nav text-ink transition hover:bg-well"
            >
              <Globe size={17} className="text-ink-60" />
              EN
            </button>
            <a href={link('help')} className="flex h-ctl items-center rounded-xl px-[13px] text-nav text-ink transition hover:bg-well hover:text-ink">
              Help
            </a>
            <button
              type="button"
              onClick={onAuth}
              className="h-ctl rounded-xl px-[13px] text-nav text-ink transition hover:bg-well"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={onAuth}
              className="h-ctl rounded-full bg-ink px-[22px] text-nav text-white transition hover:bg-ink-80"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
