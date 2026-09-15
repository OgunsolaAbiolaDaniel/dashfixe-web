import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import mark from '../assets/dashfixe-mark.png';
import wordmark from '../assets/dashfixe-wordmark.png';
import SearchPanel from '../components/explore/SearchPanel';
import LiveMap from '../components/explore/LiveMap';
import ChatPanel from '../components/explore/ChatPanel';
import { AVAILABLE } from '../components/explore/artisans';
import { ROUTES, link } from '../routes';
import { parseSearch, type When } from '../search';
import { useAuth } from '../auth';
import type { Lang } from '../types';

/**
 * Search and map — designs/Dashfixe Web.dc.html.
 *
 * The search arrives in the URL from the home composer, a trade tile or a nearby card,
 * so a search is shareable and survives reload and the back button.
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
  const { signedIn, gate } = useAuth();
  const [lang, setLang] = useState<Lang>('EN');

  const arriving = AVAILABLE.find((a) => a.id === search.artisan)?.id ?? AVAILABLE[0].id;
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
  const chatArtisan = signedIn ? (AVAILABLE.find((a) => a.id === chatWith) ?? null) : null;

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-dvh lg:overflow-hidden">
      <header className="flex min-h-[69px] items-center gap-4 border-b border-line-soft bg-panel px-[clamp(16px,3vw,32px)] py-3 lg:gap-[26px]">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2.5">
          <img src={mark} alt="" className="block h-7 w-auto" />
          <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
        </Link>

        <nav className="mr-auto hidden gap-6 md:flex">
          <a href="#find" className="text-[14.5px] font-bold text-brand">
            Find an artisan
          </a>
          <Link to="/#explore" className="text-[14.5px] font-semibold text-ink-60 hover:text-ink">
            How it works
          </Link>
          <Link
            to={link('forArtisans')}
            className="text-[14.5px] font-semibold text-ink-60 hover:text-ink"
          >
            Become an artisan
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[11px]">
          <div className="hidden rounded-xl bg-well p-[3px] sm:flex">
            {(['EN', 'PT'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={
                  'rounded-[9px] px-[13px] py-[7px] text-[13px] transition ' +
                  (lang === code
                    ? 'bg-panel font-bold text-ink shadow-card'
                    : 'font-semibold text-ink-40 hover:text-ink-60')
                }
              >
                {code}
              </button>
            ))}
          </div>
          <AuthButtons />
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
          onWhen={setWhen}
          selectedId={selectedId}
          onSelect={select}
          onChat={openChat}
        />
        <div className="relative min-h-[520px] min-w-0 lg:min-h-0">
          <LiveMap selectedId={selectedId} onSelect={select} />
          {chatArtisan && <ChatPanel artisan={chatArtisan} onClose={() => setChatWith(null)} />}
        </div>
      </div>
    </div>
  );
}

function AuthButtons() {
  const { signedIn, requireAuth, signOut } = useAuth();

  if (signedIn) {
    return (
      <button
        type="button"
        onClick={signOut}
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
    <>
      <button
        type="button"
        onClick={() => requireAuth()}
        className="text-[14.5px] font-bold text-ink"
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => requireAuth()}
        className="rounded-btn bg-brand px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
      >
        Sign up
      </button>
    </>
  );
}
