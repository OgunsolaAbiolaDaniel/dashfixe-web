import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchPanel from '../components/explore/SearchPanel';
import { LiveMap } from '../components/map/lazy';
import ChatPanel from '../components/explore/ChatPanel';
import AppBar from '../components/chrome/AppBar';
import { getSupply, type Artisan } from '../components/explore/artisans';
import { WINDOWS, normalizeSlot, parseSearch, type When } from '../search';
import { clockIn, createJob } from '../lib/jobs';
import type { Estimate } from '../lib/estimate';
import { translate } from '../i18n/strings';
import type { Place } from '../lib/geocode';
import { ROUTES } from '../routes';
import type { LngLat } from '../lib/geo';
import { setPlace as savePlace, usePlace } from '../lib/place';
import { classifyNeed } from '../lib/classify';
import { creditFor, spendCredit } from '../lib/wallet';
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
  const parsed = parseSearch(params);
  const { signedIn, requireAuth } = useAuth();
  // Later mode books exactly the slot the picker shows: never a day that's over
  // or a window that has passed (search.normalizeSlot). Clocks read once per mount.
  const [now] = useState(() => Date.now());
  const search = parsed.when === 'later' ? { ...parsed, ...normalizeSlot(parsed.day ?? 0, parsed.win ?? 2, new Date(now)) } : parsed;

  // parseSearch builds a fresh tuple on every render, and the map refits whenever the
  // home reference changes — so key the memo on the numbers, not the array.
  // A search carried in the URL wins (shared links open where they were made);
  // otherwise the customer's saved place (lib/place) — never a hard-coded default.
  const place = usePlace();
  // Keyed on a primitive string, so the memo holds for the React Compiler too.
  const homeKey = search.lngLat ? `${search.lngLat[0]},${search.lngLat[1]}` : '';
  const home = useMemo<LngLat>(
    () => (homeKey ? (homeKey.split(',').map(Number) as LngLat) : place.lngLat),
    [homeKey, place.lngLat],
  );
  const addressLabel = search.address || (search.lngLat ? '' : place.label);
  // Only the chosen trade's artisans (from the chip, the picker, or the words typed).
  const supply = getSupply(home, search.trade);

  const arriving = supply.available.find((a) => a.id === search.artisan)?.id ?? supply.available[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(arriving);
  // Changing trade can filter the selected artisan out: fall back to the nearest.
  const shown = supply.available.some((a) => a.id === selectedId) ? selectedId : (supply.available[0]?.id ?? '');
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

  /**
   * A changed need also recognises its trade (lib/classify) — the chip under the
   * field shows the word it matched on. An unchanged need never overrides a trade
   * the customer picked by hand.
   */
  const setNeed = (need: string) => {
    const text = need.trim();
    if (text === search.need) return;
    const next = new URLSearchParams(params);
    if (text) next.set('need', text);
    else next.delete('need');
    const match = classifyNeed(text);
    if (match) next.set('trade', match.trade);
    setParams(next, { replace: true });
  };

  const setTrade = (trade: string) => {
    const next = new URLSearchParams(params);
    if (trade) next.set('trade', trade);
    else next.delete('trade');
    setParams(next, { replace: true });
  };

  const choosePlace = (picked: Place) => {
    savePlace(picked);
    const next = new URLSearchParams(params);
    next.set('address', picked.label);
    next.set('lng', picked.lngLat[0].toFixed(5));
    next.set('lat', picked.lngLat[1].toFixed(5));
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

  /**
   * Approving the estimate in chat books the job: on the way now, or held for
   * the chosen slot in later mode. Returns the id the chat's "Track" link opens.
   */
  const approve = (a: Artisan, estimate: Estimate): string => {
    const later = search.when === 'later';
    const need = search.need.trim();
    // Any Dashfixe credit (lib/wallet) comes off automatically, as its own line.
    const credit = creditFor(estimate.total);
    const lines = credit
      ? [...estimate.lines, { label: { EN: translate('EN', 'job.creditLine'), PT: translate('PT', 'job.creditLine') }, amount: -credit }]
      : estimate.lines;
    const job = createJob({
      artisanId: a.id,
      artisanName: a.name,
      initials: a.initials,
      trade: a.trade,
      title: need
        ? { EN: need, PT: need }
        : { EN: translate('EN', `trades.${a.trade}`), PT: translate('PT', `trades.${a.trade}`) },
      status: later ? 'agreed' : 'travelling',
      from: a.lngLat,
      to: home,
      address: addressLabel || place.label,
      ...(later
        ? { dayOffset: search.day ?? 0, slot: { window: WINDOWS[search.win ?? 2]! } }
        : { arrives: clockIn(a.eta) }),
      lines,
      total: estimate.total - credit,
    });
    spendCredit(credit, job.id);
    return job.id;
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
          onTrade={setTrade}
          onPlace={choosePlace}
          addressLabel={addressLabel}
          selectedId={shown}
          onSelect={select}
          onChat={openChat}
        />
        <div className="relative min-h-[520px] min-w-0 lg:min-h-0">
          <LiveMap home={home} selectedId={shown} onSelect={select} trade={search.trade} />
          {chatArtisan && (
            <ChatPanel
              key={chatArtisan.id}
              artisan={chatArtisan}
              address={addressLabel || place.label}
              need={search.need}
              later={search.when === 'later'}
              onApprove={(estimate) => approve(chatArtisan, estimate)}
              onClose={closeChat}
            />
          )}
        </div>
      </div>
    </div>
  );
}

