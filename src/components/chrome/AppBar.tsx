import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Bell } from '../icons';
import { ROUTES, link } from '../../routes';
import { useAuth } from '../../auth';
import { useLang } from '../../i18n';
import LangToggle from '../shared/LangToggle';
import MobileMenu from '../shared/MobileMenu';

/**
 * Product-surface chrome — ARCHITECTURE.md §5. One slim bar for the app screens
 * (signed-in home, /explore, /activity; /artisan/:id and /job/:id in Phase 4).
 *
 * Auth-aware, like Uber's: a visitor sees the explore links plus log in / sign up;
 * a signed-in customer sees Home / Activity / Help with the bell and account chip.
 */
export default function AppBar() {
  const { signedIn, requireAuth, signOut } = useAuth();
  const { t } = useLang();
  const { pathname } = useLocation();

  const links = signedIn
    ? [
        { label: t('customer.home'), to: ROUTES.home },
        { label: t('nav.activity'), to: ROUTES.activity },
        { label: t('nav.help'), to: link('help') },
      ]
    : [
        { label: t('nav.findArtisan'), to: ROUTES.explore },
        { label: t('nav.howItWorks'), to: '/#explore' },
        { label: t('nav.becomeArtisan'), to: link('forArtisans') },
      ];

  const isCurrent = (to: string) => !to.includes('#') && (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="flex min-h-[69px] items-center gap-4 border-b border-line-soft bg-panel px-[clamp(16px,3vw,32px)] py-3 lg:gap-[26px]">
      <Link to={ROUTES.home} className="flex flex-none items-center gap-2.5">
        <img src={mark} alt="" className="block h-7 w-auto" />
        <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
      </Link>

      <nav className="mr-auto hidden gap-6 md:flex">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={
              isCurrent(l.to)
                ? 'text-[14.5px] font-bold text-brand'
                : 'text-[14.5px] font-semibold text-ink-60 hover:text-ink'
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-[11px]">
        <LangToggle className="hidden sm:flex" />

        {signedIn ? (
          <>
            <BellMenu />
            <button
              type="button"
              onClick={signOut}
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
              className="hidden h-ctl items-center gap-2.5 rounded-well border border-line bg-panel px-1.5 transition hover:bg-page sm:flex"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-avatar text-xs font-extrabold text-brand">
                AM
              </span>
              <span className="pr-1.5 text-sm font-bold text-ink">Alex</span>
            </button>
          </>
        ) : (
          <div className="hidden items-center gap-[11px] md:flex">
            <button type="button" onClick={() => requireAuth()} className="text-[14.5px] font-bold text-ink">
              {t('nav.login')}
            </button>
            <button
              type="button"
              onClick={() => requireAuth()}
              className="rounded-btn bg-brand px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
            >
              {t('nav.signup')}
            </button>
          </div>
        )}

        <MobileMenu
          links={links}
          actions={
            signedIn ? (
              <button
                type="button"
                onClick={signOut}
                className="h-ctl-lg rounded-btn border border-line bg-panel text-[15px] font-bold text-ink"
              >
                {t('nav.signOut')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => requireAuth()}
                  className="h-ctl-lg rounded-btn bg-brand text-[15px] font-bold text-white"
                >
                  {t('nav.signup')}
                </button>
                <button
                  type="button"
                  onClick={() => requireAuth()}
                  className="h-ctl-lg rounded-btn border border-line bg-panel text-[15px] font-bold text-ink"
                >
                  {t('nav.login')}
                </button>
              </>
            )
          }
        />
      </div>
    </header>
  );
}

/** The bell — honest: there is no notifications backend yet, and it says so. */
function BellMenu() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('customer.notifications')}
        aria-expanded={open}
        className="relative grid h-ctl w-ctl place-items-center rounded-well bg-well transition hover:bg-line"
      >
        <Bell size={19} className="text-ink-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[280px] rounded-[18px] border border-line-soft bg-panel p-4 shadow-panel">
          <div className="mb-1.5 text-label text-ink-40">{t('notif.title')}</div>
          <p className="text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('notif.empty')}</p>
        </div>
      )}
    </div>
  );
}
