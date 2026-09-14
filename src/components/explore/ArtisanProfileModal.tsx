import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ClockSmall, Close } from '../icons';
import { ProfileIdentity, ProfileLanguages, ProfileReviews, ProfileStats } from './ArtisanProfileParts';
import { getProfile, type Artisan } from './artisans';
import { artisanUrl } from '../../routes';
import { useLang } from '../../i18n';

/**
 * The artisan's profile card, opened from the chat (owner request, rev 2.4): who
 * you're talking to — verification, rating, jobs, years, about, languages,
 * reviews, price and arrival — without leaving the conversation.
 *
 * A centred card on desktop, a bottom sheet on phones; rendered in a portal so
 * the docked chat's rounded, clipped frame doesn't cut it. Escape and the
 * backdrop close it.
 *
 * The card owns focus: on opening it remembers what had focus (the button that
 * opened it) and moves to Close — once; when it's removed, its cleanup hands
 * focus back, after the card has left the page. Parent re-renders (the chat's
 * scripted replies) never re-run it.
 */
export default function ArtisanProfileModal({ artisan, onClose }: { artisan: Artisan; onClose: () => void }) {
  const { t, lang } = useLang();
  const profile = getProfile(artisan.id);
  const titleId = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);
  // The latest onClose, without re-subscribing on every parent render.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, []);

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[130] flex items-end justify-center bg-ink/50 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-hero bg-panel shadow-panel sm:max-h-[86vh] sm:max-w-[460px] sm:rounded-hero"
      >
        <div className="relative bg-brand-tint px-5 pb-5 pt-5">
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label={t('chat.profile.close')}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-panel text-ink-60 transition hover:bg-well"
          >
            <Close size={16} />
          </button>
          <div className="pr-10">
            <ProfileIdentity artisan={artisan} heading="h2" titleId={titleId} ring />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-[12.5px] font-bold text-success">
              <span className="block h-1.5 w-1.5 rounded-full bg-success" />
              {t('chat.profile.available', { eta: artisan.eta })}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-[12.5px] font-bold text-ink-80">
              <ClockSmall size={13} />
              {artisan.price}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {profile && (
            <div className="flex flex-col gap-5">
              <p className="text-[14.5px] font-medium leading-[1.6] text-ink-80">{profile.about[lang]}</p>
              <ProfileStats artisan={artisan} profile={profile} />
              <ProfileLanguages profile={profile} />
              <ProfileReviews profile={profile} heading="h3" limit={2} />
            </div>
          )}
        </div>

        <div className="flex flex-none gap-2.5 border-t border-line-rule px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <Link
            to={artisanUrl(artisan.id)}
            className="flex h-ctl items-center rounded-[13px] border border-line bg-panel px-4 text-[14.5px] font-bold text-ink transition hover:bg-page hover:text-ink"
          >
            {t('chat.profile.full')}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-ctl flex-1 items-center justify-center rounded-[13px] bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
          >
            {t('chat.profile.back')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
