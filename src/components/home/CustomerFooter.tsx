import { Link } from 'react-router-dom';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { link } from '../../routes';

const LINK = 'text-[13.5px] font-semibold text-ink-60 transition hover:text-ink';

export default function CustomerFooter() {
  return (
    <footer className="border-t border-line-soft bg-panel">
      <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)] py-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3.5">
          <span className="flex flex-none items-center gap-2.5">
            <img src={wordmark} alt="Dashfixe" className="block h-4 w-auto opacity-55" />
            <span className="text-[13.5px] font-semibold text-ink-40">© 2026 Dashfixe</span>
          </span>
          <div className="flex flex-wrap gap-[22px]">
            <a href={link('help')} className={LINK}>Help</a>
            <Link to={link('forArtisans')} className={LINK}>For artisans</Link>
            <a href={link('privacy')} className={LINK}>Privacy</a>
            <a href={link('terms')} className={LINK}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
