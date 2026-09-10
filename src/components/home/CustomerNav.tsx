import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Bell } from '../icons';
import { link } from '../../routes';
import { useLang } from '../../i18n';
import LangToggle from '../shared/LangToggle';
import MobileMenu from '../shared/MobileMenu';

const LINK = 'text-[14.5px] font-semibold text-ink-60 transition hover:text-ink';

export default function CustomerNav({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useLang();
  const links = [
    { label: t('customer.home'), to: '#top' },
    { label: t('customer.requests'), to: '#requests' },
    { label: t('customer.places'), to: '#places' },
    { label: t('nav.help'), to: link('help') },
  ];

  return (
    <header className="sticky top-0 z-[60] border-b border-line-soft bg-panel">
      <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)]">
        <div className="flex min-h-[68px] items-center justify-between gap-x-7 py-2.5">
          <a href="#top" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-7 w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[18px] w-auto" />
          </a>

          <nav className="hidden items-center gap-[26px] md:flex">
            <a href="#top" className="text-[14.5px] font-bold text-brand">
              {t('customer.home')}
            </a>
            <a href="#requests" className={LINK}>
              {t('customer.requests')}
            </a>
            <a href="#places" className={LINK}>
              {t('customer.places')}
            </a>
            <a href={link('help')} className={LINK}>
              {t('nav.help')}
            </a>
          </nav>

          <div className="flex flex-none items-center gap-2.5">
            <LangToggle className="hidden md:flex" />
            <button
              type="button"
              aria-label={t('customer.notifications')}
              className="relative grid h-ctl w-ctl place-items-center rounded-well bg-well transition hover:bg-line"
            >
              <Bell size={19} className="text-ink-60" />
              <span className="absolute right-[11px] top-2.5 block h-2 w-2 rounded-full border-2 border-well bg-brand" />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
              className="hidden h-ctl items-center gap-2.5 rounded-well border border-line bg-panel px-1.5 transition hover:bg-page sm:flex"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-avatar text-xs font-extrabold text-brand">
                AM
              </span>
              <span className="pr-1.5 text-sm font-bold text-ink">Alex</span>
            </button>
            <MobileMenu
              links={links}
              actions={
                <button
                  type="button"
                  onClick={onSignOut}
                  className="h-ctl-lg rounded-btn border border-line bg-panel text-[15px] font-bold text-ink"
                >
                  {t('nav.signOut')}
                </button>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
