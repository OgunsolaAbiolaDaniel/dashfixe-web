import { Star, Verified } from '../icons';
import { useLang } from '../../i18n';
import type { Artisan, Profile } from './artisans';

/**
 * The artisan profile's pieces — one set, two places: the /artisan/:id page and
 * the profile card that opens from the chat (ArtisanProfileModal). Sample supply;
 * reviews are illustrative and badged as such (in PT on purpose — that is what
 * real ones will look like).
 */

/** Avatar, name + verified, rating · jobs · distance, trade and badges. */
export function ProfileIdentity({
  artisan,
  heading: H = 'h1',
  titleId,
  ring = false,
}: {
  artisan: Artisan;
  heading?: 'h1' | 'h2';
  titleId?: string;
  /** A white ring, for the avatar on a tinted ground. */
  ring?: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <span
        className={
          'grid h-16 w-16 flex-none place-items-center rounded-[20px] bg-avatar text-[19px] font-extrabold text-brand' +
          (ring ? ' ring-4 ring-panel' : '')
        }
      >
        {artisan.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <H id={titleId} className="text-[24px] font-extrabold tracking-[-.025em] text-ink">
            {artisan.name}
          </H>
          {artisan.verified && (
            <span className="flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-[11.5px] font-bold text-brand-hover">
              <Verified size={13} />
              {t('profile.verified')}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-60">
          <Star size={13} className="flex-none text-star" />
          {`${artisan.rating} · ${artisan.jobs} ${t('search.jobs')} · ${artisan.km} km`}
        </div>
        {/* On the card's tinted header (ring), chips sit on white so they keep their shape. */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className={'rounded-full px-[11px] py-1.5 text-xs font-bold text-ink-80 ' + (ring ? 'bg-panel' : 'bg-well')}>
            {t(`trades.${artisan.trade}` as const)}
          </span>
          {artisan.badges?.map((b) => (
            <span key={b} className={'rounded-full px-[11px] py-1.5 text-xs font-semibold text-brand-hover ' + (ring ? 'bg-panel' : 'bg-brand-tint')}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Rating, jobs and years — dividers, not gaps, inside a card. */
export function ProfileStats({ artisan, profile }: { artisan: Artisan; profile: Profile }) {
  const { t } = useLang();
  return (
    <div className="flex gap-px overflow-hidden rounded-[18px] border border-[#e6ebf3] bg-[#e6ebf3]">
      {[
        { v: String(artisan.rating), label: t('profile.rating') },
        { v: String(artisan.jobs), label: t('search.jobs') },
        { v: `${profile.years}`, label: t('profile.years') },
      ].map((s) => (
        <span key={s.label} className="flex-1 bg-panel px-3 py-3 text-center">
          <span className="block text-[19px] font-extrabold tracking-[-.02em] text-ink">{s.v}</span>
          <span className="mt-0.5 block text-[11.5px] font-semibold text-ink-40">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

export function ProfileLanguages({ profile }: { profile: Profile }) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-label text-ink-40">{t('profile.languages')}</span>
      {profile.languages.map((l) => (
        <span key={l} className="rounded-full bg-well px-3 py-1.5 text-[12.5px] font-bold text-ink-80">
          {l}
        </span>
      ))}
    </div>
  );
}

/** The sample reviews, badged as sample. */
export function ProfileReviews({ profile, heading: H = 'h2', limit }: { profile: Profile; heading?: 'h2' | 'h3'; limit?: number }) {
  const { t } = useLang();
  const reviews = limit ? profile.reviews.slice(0, limit) : profile.reviews;
  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <H className="mr-auto text-section text-ink">{t('profile.reviews')}</H>
        <span className="rounded-full bg-warning-tint px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
          {t('nearby.sample')}
        </span>
      </div>
      <div className="overflow-hidden rounded-card border border-line-soft bg-panel">
        {reviews.map((r, i) => (
          <article key={r.name} className={'px-5 py-[18px]' + (i < reviews.length - 1 ? ' border-b border-line-rule' : '')}>
            <div className="mb-1.5 flex items-baseline gap-3">
              <span aria-label={`${r.stars}/5`} className="text-[13px] tracking-[.1em] text-star">
                {stars(r.stars)}
              </span>
              <span className="ml-auto text-[12.5px] font-semibold text-ink-40">{`${r.name} · ${r.date}`}</span>
            </div>
            <p className="text-[14px] font-medium leading-[1.55] text-ink-80">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
