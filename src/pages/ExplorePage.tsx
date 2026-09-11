import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchPanel from '../components/explore/SearchPanel';
import LiveMap from '../components/explore/LiveMap';
import ChatPanel from '../components/explore/ChatPanel';
import AppBar from '../components/chrome/AppBar';
import { getSupply } from '../components/explore/artisans';
import { DEFAULT_ADDRESS, parseSearch, type When } from '../search';
import type { Place } from '../lib/geocode';
import { ROUTES } from '../routes';
import { HOME, type LngLat } from '../lib/geo';
import { useAuth } from '../auth';

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
  const { signedIn, requireAuth } = useAuth();

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

  /** Chat is the commit point — the only place an account is demanded. */
  const openChat = (id: string) => {
    setSelectedId(id);
    if (signedIn) {
      setChatWith(id);
      return;
    }
    // To /login, and back here with this artisan selected and the chat open.
    const back = new URLSearchParams(params);
    back.set('artisan', id);
    back.set('chat', '1');
    requireAuth(`${ROUTES.explore}?${back.toString()}`);
  };

  // ?chat=1 (set on the way to /login) opens the chat for the selected artisan —
  // derived from the URL, so it also survives a cold reload with a live session.
  const wantChat = params.get('chat') === '1';

  const setWhen = (when: When) => {
    const next = new URLSearchParams(params);
    if (when === 'later') next.set('when', 'later');
    else next.delete('when');
    setParams(next, { replace: true });
  };

  const toggleSort = () => {
    const next = new URLSearchParams(params);
    if (search.sort === 'price') next.delete('sort');
    else next.set('sort', 'price');
    setParams(next, { replace: true });
  };

  const setNeed = (need: string) => {
    const next = new URLSearchParams(params);
    if (need.trim()) next.set('need', need.trim());
    else next.delete('need');
    setParams(next, { replace: true });
  };

  const setPlace = (place: Place) => {
    const next = new URLSearchParams(params);
    next.set('address', place.label);
    next.set('lng', place.lngLat[0].toFixed(5));
    next.set('lat', place.lngLat[1].toFixed(5));
    setParams(next, { replace: true });
  };

  /** The later-mode slot rides in the URL like everything else. */
  const setSlot = (day: number, win: number) => {
    const next = new URLSearchParams(params);
    next.set('when', 'later');
    next.set('day', String(day));
    next.set('win', String(win));
    setParams(next, { replace: true });
  };

  // The docked chat is for signed-in customers only. Signing out closes it.
  const openId = chatWith ?? (wantChat ? arriving : null);
  const chatArtisan = signedIn ? (supply.available.find((a) => a.id === openId) ?? null) : null;

  const closeChat = () => {
    setChatWith(null);
    if (wantChat) {
      const next = new URLSearchParams(params);
      next.delete('chat');
      setParams(next, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-dvh lg:overflow-hidden">
      <AppBar />

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
          onSlot={setSlot}
          onSort={toggleSort}
          onNeed={setNeed}
          onPlace={setPlace}
          selectedId={selectedId}
          onSelect={select}
          onChat={openChat}
        />
        <div className="relative min-h-[520px] min-w-0 lg:min-h-0">
          <LiveMap home={home} selectedId={selectedId} onSelect={select} />
          {chatArtisan && (
            <ChatPanel
              key={chatArtisan.id}
              artisan={chatArtisan}
              address={search.address || DEFAULT_ADDRESS}
              onClose={closeChat}
            />
          )}
        </div>
      </div>
    </div>
  );
}

