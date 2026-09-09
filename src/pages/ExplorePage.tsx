import { useState } from 'react';
import { Link } from 'react-router-dom';
import mark from '../assets/dashfixe-mark.png';
import wordmark from '../assets/dashfixe-wordmark.png';
import SearchPanel from '../components/explore/SearchPanel';
import MapCanvas from '../components/explore/MapCanvas';
import ChatPanel from '../components/explore/ChatPanel';
import { AVAILABLE } from '../components/explore/artisans';
import { ROUTES, link } from '../routes';
import type { Lang } from '../types';

/**
 * Search and map — designs/Dashfixe Web.dc.html.
 *
 * Two panes: a fixed-min search panel on the page ground, the map filling the rest.
 * Selecting in the list and selecting on the map are the same action, so both sync.
 *
 * The supply shown here is illustrative — see components/explore/artisans.ts.
 */
export default function ExplorePage() {
  const [lang, setLang] = useState<Lang>('EN');
  const [selectedId, setSelectedId] = useState(AVAILABLE[0].id);
  const [chatWith, setChatWith] = useState<string | null>(AVAILABLE[0].id);

  const select = (id: string) => {
    setSelectedId(id);
    if (chatWith) setChatWith(id);
  };

  const chatArtisan = AVAILABLE.find((a) => a.id === chatWith) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="flex flex-wrap items-center gap-[26px] border-b border-line-soft bg-panel px-8 py-4">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2.5">
          <img src={mark} alt="" className="block h-7 w-auto" />
          <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
        </Link>

        <nav className="mr-auto flex gap-6">
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

        <div className="flex items-center gap-[11px]">
          <div className="flex rounded-xl bg-well p-[3px]">
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
          <Link to={ROUTES.waitlist} className="text-[14.5px] font-bold text-ink hover:text-ink">
            Log in
          </Link>
          <Link
            to={ROUTES.waitlist}
            className="rounded-btn bg-brand px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
          >
            Sign up
          </Link>
        </div>
      </header>

      <div
        id="find"
        className="grid min-h-0 flex-1 items-stretch grid-cols-1 lg:grid-cols-[minmax(340px,436px)_minmax(0,1fr)]"
      >
        <SearchPanel selectedId={selectedId} onSelect={select} onChat={setChatWith} />
        <div className="relative min-h-[520px] min-w-0">
          <MapCanvas selectedId={selectedId} onSelect={select} />
          {chatArtisan && <ChatPanel artisan={chatArtisan} onClose={() => setChatWith(null)} />}
        </div>
      </div>
    </div>
  );
}
