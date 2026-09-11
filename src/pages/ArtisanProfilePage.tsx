import { Link, Navigate, useParams } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import { ClockSmall, Star, Verified } from '../components/icons';
import { AVAILABLE, getProfile } from '../components/explore/artisans';
import { exploreUrl } from '../search';
import { ROUTES } from '../routes';
import { useLang } from '../i18n';

/**
 * The artisan profile — trust before the commit point (ARCHITECTURE.md §4).
 * Browse-first: profiles are public; the auth gate stays where it belongs, on
 * chat. The CTA drops back into /explore with this artisan selected, so the
 * commit path is always the same one.
 *
 * Sample supply; reviews are illustrative and badged as such. Reviews are kept
 * in Portuguese on purpose — that is what real ones will look like.
 */
export default function ArtisanProfilePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();

  const artisan = AVAILABLE.find((a) => a.id === id);
  const profile = getProfile(id);
  if (!artisan || !profile) return <Navigate to={ROUTES.explore} replace />;

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="min-h-screen bg-page">
      <AppBar />
      <main className="mx-auto max-w-[760px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(24px,3.4vw,40px)]">
        {/* Identity */}
        <section className="rounded-card border border-line-soft bg-panel p-[clamp(20px,3vw,28px)]">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-16 w-16 flex-none place-items-center rounded-[20px] bg-avatar text-[19px] font-extrabold text-brand">
              {artisan.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-extrabold tracking-[-.025em] text-ink">{artisan.name}</h1>
                {artisan.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-[11.5px] font-bold text-brand-hover">
                    <Verified size={13} />
                    {t('profile.verified')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-60">
                <Star size={13} className="flex-none text-star" />
                {`${artisan.rating} · ${artisan.jobs} ${t('search.jobs')} · ${artisan.km} km`}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-well px-[11px] py-1.5 text-xs font-bold text-ink-80">
                  {t(`trades.${artisan.trade}` as const)}
                </span>
                {artisan.badges?.map((b) => (
                  <span key={b} className="rounded-full bg-brand-tint px-[11px] py-1.5 text-xs font-semibold text-brand-hover">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 text-[14.5px] font-medium leading-[1.6] text-ink-80">{profile.about[lang]}</p>

          {/* Stats — dividers, not gaps, inside a card */}
          <div className="mt-5 flex gap-px overflow-hidden rounded-[18px] border border-[#e6ebf3] bg-[#e6ebf3]">
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

          {/* The commit path — back into the product */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line-rule pt-5">
            <span className="mr-auto">
              <span className="block text-[21px] font-extrabold tracking-[-.02em] text-ink">{artisan.price}</span>
              <span className="mt-px flex items-center gap-1.5 text-[12.5px] font-bold text-ink-60">
                <ClockSmall size={13} />
                {t('nearby.minAway', { min: artisan.eta })}
              </span>
            </span>
            <Link
              to={exploreUrl({ artisan: artisan.id, when: 'later' })}
              className="flex h-ctl items-center rounded-[13px] border border-line bg-panel px-4 text-[14.5px] font-bold text-ink transition hover:bg-page hover:text-ink"
            >
              {t('search.later')}
            </Link>
            <Link
              to={exploreUrl({ artisan: artisan.id })}
              className="flex h-ctl items-center rounded-[13px] bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
            >
              {t('search.chatWith', { name: artisan.name.split(' ')[0]! })}
            </Link>
          </div>
        </section>

        {/* Languages */}
        <section className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="text-label text-ink-40">{t('profile.languages')}</span>
          {profile.languages.map((l) => (
            <span key={l} className="rounded-full bg-well px-3 py-1.5 text-[12.5px] font-bold text-ink-80">
              {l}
            </span>
          ))}
        </section>

        {/* Reviews */}
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            <h2 className="mr-auto text-section text-ink">{t('profile.reviews')}</h2>
            <span className="rounded-full bg-warning-tint px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
              {t('nearby.sample')}
            </span>
          </div>
          <div className="overflow-hidden rounded-card border border-line-soft bg-panel">
            {profile.reviews.map((r, i) => (
              <article key={r.name} className={'px-5 py-[18px]' + (i < profile.reviews.length - 1 ? ' border-b border-line-rule' : '')}>
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
        </section>
      </main>
    </div>
  );
}
