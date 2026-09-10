import { Link } from 'react-router-dom';
import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Globe } from '../icons';
import { link } from '../../routes';
import { useLang } from '../../i18n';
import MobileMenu from '../shared/MobileMenu';

const NAV = 'rounded-xl px-[15px] py-2.5 text-nav text-ink transition hover:bg-well hover:text-ink';
const TEXT_BTN = 'flex h-ctl items-center rounded-xl px-[13px] text-nav text-ink transition hover:bg-well';

export default function PublicNav({ onAuth }: { onAuth: () => void }) {
  const { t, lang, setLang } = useLang();
  const links = [
    { label: t('nav.fix'), to: '#explore' },
    { label: t('nav.bookAhead'), to: '#later' },
    { label: t('nav.earn'), to: link('forArtisans') },
    { label: t('nav.trades'), to: '#trades' },
    { label: t('nav.help'), to: link('help') },
  ];

  return (
    <header className="sticky top-0 z-[60] border-b border-line-rule bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)]">
        <div className="flex min-h-[68px] items-center justify-between gap-x-7 py-2.5 lg:min-h-[76px]">
          <a href="#top" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-[30px] w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[19px] w-auto" />
          </a>

          <nav className="hidden items-center gap-0.5 md:flex">
            <a href="#explore" className={NAV}>{t('nav.fix')}</a>
            <a href="#later" className={NAV}>{t('nav.bookAhead')}</a>
            <Link to={link('forArtisans')} className={NAV}>{t('nav.earn')}</Link>
            <a href="#trades" className={NAV}>{t('nav.trades')}</a>
          </nav>

          <div className="hidden flex-none items-center gap-1.5 md:flex">
            <button
              type="button"
              onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')}
              aria-label={t('nav.language')}
              className="flex h-ctl items-center gap-2 rounded-xl px-[13px] text-nav text-ink transition hover:bg-well"
            >
              <Globe size={17} className="text-ink-60" />
              {lang}
            </button>
            <a href={link('help')} className={TEXT_BTN}>{t('nav.help')}</a>
            <button type="button" onClick={onAuth} className={TEXT_BTN}>{t('nav.login')}</button>
            <button
              type="button"
              onClick={onAuth}
              className="h-ctl rounded-full bg-ink px-[22px] text-nav text-white transition hover:bg-ink-80"
            >
              {t('nav.signup')}
            </button>
          </div>

          <MobileMenu
            links={links}
            actions={
              <>
                <button type="button" onClick={onAuth} className="h-ctl-lg rounded-btn bg-ink text-[15px] font-bold text-white">
                  {t('nav.signup')}
                </button>
                <button type="button" onClick={onAuth} className="h-ctl-lg rounded-btn border border-line bg-panel text-[15px] font-bold text-ink">
                  {t('nav.login')}
                </button>
              </>
            }
          />
        </div>
      </div>
    </header>
  );
}
