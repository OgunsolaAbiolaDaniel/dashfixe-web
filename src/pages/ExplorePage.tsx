import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import mark from '../assets/dashfixe-mark.png';
import wordmark from '../assets/dashfixe-wordmark.png';
import SearchPanel from '../components/explore/SearchPanel';
import LiveMap from '../components/explore/LiveMap';
import ChatPanel from '../components/explore/ChatPanel';
import LangToggle from '../components/shared/LangToggle';
import MobileMenu from '../components/shared/MobileMenu';
import { getSupply } from '../components/explore/artisans';
import { ROUTES, link } from '../routes';
import { DEFAULT_ADDRESS, parseSearch, type When } from '../search';
import { HOME, type LngLat } from '../lib/geo';
import { useAuth } from '../auth';
import { useLang } from '../i18n';

/**
 * Search and map — designs/Dashfixe Web.dc.html.
 *
 * The search arrives in the URL from the home composer, a trade tile or a nearby card,
 * so a search is shareable and survives reload and the back button. When the composer
 * resolved an address, `lng`/`lat` ride along and everything here — the map, the list,
 * distances and arrival times — is worked out from that point.
 *
 * Browsing is open — search, availability and estimates need no account. Opening a
 * chat is the commit point: the docked panel never appears for a signed-out visitor,
 * and "Chat" raises the auth sheet instead.
 *
 * The supply shown here is illustrative — see components/explore/artisans.ts.
 */
export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const search = parseSearch(params);
  const { signedIn, gate, requireAuth, signOut } = useAuth();
  const { t } = useLang();

  // parseSearch builds a fresh tuple on every render, and the map refits whenever the
  // home reference changes — so key the memo on the numbers, not the array.
  const lng = search.lngLat?.[0];
  const lat = search.lngLat?.[1];
  const home = useMemo<LngLat>(() => (lng !== undefined && lat !== undefined ? [lng, lat] : HOME), [lng, lat]);
  const supply = getSupply(home);

  const arriving = supply.available.find((a) => a.id === search.artisan)?.id ?? supply.available[0]!.id;
  const [selectedId, setSelectedId] = useState(arriving);
  const [chatWith, setChatWith] = useState<string | null>(null);

  const select = (id: string) => {
    setSelectedId(id);
    if (chatWith) setChatWith(id);
  };

  /** Chat is the commit point — this is where an account is needed. */
  const openChat = (id: string) => {
    setSelectedId(id);
    gate(() => setChatWith(id));
  };

  const setWhen = (when: When) => {
    const next = new URLSearchParams(params);
    if (when === 'later') next.set('when', 'later');
    else next.delete('when');
    setParams(next, { replace: true });
  };

  // The docked chat is for signed-in customers only. Signing out closes it.
  const chatArtisan = signedIn ? (supply.available.find((a) => a.id === chatWith) ?? null) : null;

  const links = [
    { label: t('nav.findArtisan'), to: '#find' },
    { label: t('nav.howItWorks'), to: '/#explore' },
    { label: t('nav.becomeArtisan'), to: link('forArtisans') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-dvh lg:overflow-hidden">
      <header className="flex min-h-[69px] items-center gap-4 border-b border-line-soft bg-panel px-[clamp(16px,3vw,32px)] py-3 lg:gap-[26px]">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2.5">
          <img src={mark} alt="" className="block h-7 w-auto" />
          <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
        </Link>

        <nav className="mr-auto hidden gap-6 md:flex">
          <a href="#find" className="text-[14.5px] font-bold text-brand">
            {t('nav.findArtisan')}
          </a>
          <Link to="/#explore" className="text-[14.5px] font-semibold text-ink-60 hover:text-ink">
            {t('nav.howItWorks')}
          </Link>
          <Link to={link('forArtisans')} className="text-[14.5px] font-semibold text-ink-60 hover:text-ink">
            {t('nav.becomeArtisan')}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[11px]">
          <LangToggle className="hidden sm:flex" />
          <AuthButtons />
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

      {/* Desktop: the map pins to the viewport and the results panel scrolls on its
          own, like a ride-hailing screen. Mobile: the page stacks and scrolls. */}
      <div
        id="find"
        className="grid min-h-0 flex-1 items-stretch grid-cols-1 lg:grid-cols-[minmax(340px,436px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
      >
        <SearchPanel
          search={search}
          supply={supply}
          onWhen={setWhen}
          selectedId={selectedId}
          onSelect={select}
          onChat={openChat}
        />
        <div className="relative min-h-[520px] min-w-0 lg:min-h-0">
          <LiveMap home={home} selectedId={selectedId} onSelect={select} />
          {chatArtisan && (
            <ChatPanel
              artisan={chatArtisan}
              address={search.address || DEFAULT_ADDRESS}
              onClose={() => setChatWith(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AuthButtons() {
  const { signedIn, requireAuth, signOut } = useAuth();
  const { t } = useLang();

  if (signedIn) {
    return (
      <button
        type="button"
        onClick={signOut}
        aria-label={t('nav.signOut')}
        title={t('nav.signOut')}
        className="flex h-ctl items-center gap-2.5 rounded-well border border-line bg-panel px-1.5 transition hover:bg-page"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] bg-avatar text-xs font-extrabold text-brand">
          AM
        </span>
        <span className="pr-1.5 text-sm font-bold text-ink">Alex</span>
      </button>
    );
  }

  return (
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
  );
}
