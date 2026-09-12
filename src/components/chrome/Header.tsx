import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { Bell, ChevronDown, Globe } from '../icons';
import { ROUTES, link } from '../../routes';
import { initialsOf, useAuth } from '../../auth';
import { useLang } from '../../i18n';
import MobileMenu from '../shared/MobileMenu';

/**
 * THE header — every page wears it (ARCHITECTURE.md §5). One logo that always
 * goes home, one link set per auth state, one language control, one account
 * area. Only the frame changes with the surface:
 *
 * - `contained` (marketing pages): content-width, like the page below it.
 * - `full` (map screens): edge to edge, so it lines up with the panel + map.
 * - `minimal` (/login): logo + language only — nothing to wander off to mid-flow.
 */
type Props = { layout?: 'contained' | 'full'; minimal?: boolean };

const LINK = 'rounded-xl px-3.5 py-2 text-nav transition';

export default function Header({ layout = 'contained', minimal = false }: Props) {
  const { signedIn, requireAuth, signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const { pathname, search } = useLocation();

  const links = signedIn
    ? [
        { label: t('customer.home'), to: ROUTES.home },
        { label: t('nav.findArtisan'), to: link('explore') },
        { label: t('nav.activity'), to: ROUTES.activity },
      ]
    : [
        { label: t('nav.findArtisan'), to: link('explore') },
        { label: t('nav.bookAhead'), to: link('book') },
        { label: t('nav.howItWorks'), to: link('howItWorks') },
        { label: t('nav.becomeArtisan'), to: link('forArtisans') },
      ];

  // "/explore" and "/explore?when=later" are two links onto one route: tell them apart.
  const later = new URLSearchParams(search).get('when') === 'later';
  const isCurrent = (to: string) => {
    const [path, query = ''] = to.split('?');
    if (path === '/') return pathname === '/';
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (path === ROUTES.explore) return query.includes('when=later') === later;
    return true;
  };

  const frame =
    layout === 'contained' ? 'mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)]' : 'px-[clamp(16px,3vw,32px)]';

  return (
    <header className="sticky top-0 z-[60] border-b border-line-rule bg-panel">
      <div className={frame}>
        <div className="flex h-[68px] items-center gap-5">
          <Link to={ROUTES.home} aria-label="Dashfixe — home" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-7 w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
          </Link>

          {!minimal && (
            <nav className="hidden items-center gap-0.5 md:flex">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={isCurrent(l.to) ? 'page' : undefined}
                  className={
                    LINK +
                    (isCurrent(l.to) ? ' bg-well font-bold text-ink' : ' text-ink-60 hover:bg-well hover:text-ink')
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')}
              aria-label={t('nav.language')}
              title={t('nav.language')}
              className="flex h-ctl items-center gap-2 rounded-xl px-3 text-nav text-ink transition hover:bg-well"
            >
              <Globe size={17} className="text-ink-60" />
              {lang}
            </button>

            {!minimal &&
              (signedIn ? (
                <>
                  <BellMenu />
                  <AccountMenu />
                </>
              ) : (
                <>
                  <Link to={link('help')} className={`${LINK} hidden text-ink hover:bg-well lg:block`}>
                    {t('nav.help')}
                  </Link>
                  <button type="button" onClick={() => requireAuth()} className={`${LINK} hidden text-ink hover:bg-well md:block`}>
                    {t('nav.login')}
                  </button>
                  <button
                    type="button"
                    onClick={() => requireAuth()}
                    className="hidden h-ctl rounded-full bg-ink px-5 text-nav text-white transition hover:bg-ink-80 md:block"
                  >
                    {t('nav.signup')}
                  </button>
                </>
              ))}

            {!minimal && (
              <MobileMenu
                links={[...links, { label: t('nav.help'), to: link('help') }]}
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
                      <button type="button" onClick={() => requireAuth()} className="h-ctl-lg rounded-btn bg-ink text-[15px] font-bold text-white">
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Close a popover on outside click or Escape. */
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, close]);
}

const POPOVER = 'absolute right-0 top-[calc(100%+8px)] z-[80] w-[280px] rounded-[18px] border border-line-soft bg-panel shadow-panel';

/** The bell — honest: there is no notifications backend yet, and it says so. */
function BellMenu() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useDismiss(wrap, open, () => setOpen(false));

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('customer.notifications')}
        aria-expanded={open}
        className="grid h-ctl w-ctl place-items-center rounded-xl transition hover:bg-well"
      >
        <Bell size={19} className="text-ink-60" />
      </button>
      {open && (
        <div className={`${POPOVER} p-4`}>
          <div className="mb-1.5 text-label text-ink-40">{t('notif.title')}</div>
          <p className="text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('notif.empty')}</p>
        </div>
      )}
    </div>
  );
}

/** Avatar + first name; the menu holds the account's places to go and sign out. */
function AccountMenu() {
  const { t } = useLang();
  const { name, phone, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useDismiss(wrap, open, close);

  const ROW = 'block rounded-xl px-3 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-well hover:text-ink';

  return (
    <div ref={wrap} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('nav.account')}
        aria-expanded={open}
        className="flex h-ctl items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-2.5 transition hover:bg-page"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-avatar text-xs font-extrabold text-brand">
          {initialsOf(name, phone)}
        </span>
        {name && <span className="max-w-[110px] truncate text-sm font-bold text-ink">{name.split(' ')[0]}</span>}
        <ChevronDown size={15} className="flex-none text-ink-40" />
      </button>
      {open && (
        <div className={`${POPOVER} p-2`}>
          <div className="border-b border-line-rule px-3 pb-3 pt-2">
            <div className="text-label text-ink-40">{t('nav.signedInAs')}</div>
            <div className="mt-1 truncate text-[15px] font-bold text-ink">{name ?? phone}</div>
            {name && phone && <div className="text-[12.5px] font-semibold text-ink-40">{phone}</div>}
          </div>
          <div className="py-1.5">
            <Link to={ROUTES.activity} onClick={close} className={ROW}>
              {t('nav.activity')}
            </Link>
            <Link to={link('help')} onClick={close} className={ROW}>
              {t('nav.help')}
            </Link>
          </div>
          <button type="button" onClick={signOut} className={`${ROW} w-full border-t border-line-rule text-left text-ink-60`}>
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
