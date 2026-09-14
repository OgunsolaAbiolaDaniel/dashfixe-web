import { Link, Navigate, useParams } from 'react-router-dom';
import AppBar from '../components/chrome/AppBar';
import { ClockSmall } from '../components/icons';
import { AVAILABLE, getProfile } from '../components/explore/artisans';
import { ProfileIdentity, ProfileLanguages, ProfileReviews, ProfileStats } from '../components/explore/ArtisanProfileParts';
import { exploreUrl } from '../search';
import { ROUTES } from '../routes';
import { useLang } from '../i18n';

/**
 * The artisan profile — trust before the commit point (ARCHITECTURE.md §4).
 * Browse-first: profiles are public; the auth gate stays where it belongs, on
 * chat. The CTA drops back into /explore with this artisan selected, so the
 * commit path is always the same one. The same pieces (ArtisanProfileParts)
 * make the profile card that opens from the chat.
 *
 * Sample supply; reviews are illustrative and badged as such.
 */
export default function ArtisanProfilePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();

  const artisan = AVAILABLE.find((a) => a.id === id);
  const profile = getProfile(id);
  if (!artisan || !profile) return <Navigate to={ROUTES.explore} replace />;

  return (
    <div className="min-h-screen bg-page">
      <AppBar />
      <main className="mx-auto max-w-[760px] px-[clamp(18px,4vw,32px)] pb-[clamp(48px,6vw,72px)] pt-[clamp(24px,3.4vw,40px)]">
        {/* Identity */}
        <section className="rounded-card border border-line-soft bg-panel p-[clamp(20px,3vw,28px)]">
          <ProfileIdentity artisan={artisan} />

          <p className="mt-5 text-[14.5px] font-medium leading-[1.6] text-ink-80">{profile.about[lang]}</p>

          <div className="mt-5">
            <ProfileStats artisan={artisan} profile={profile} />
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

        <section className="mt-5">
          <ProfileLanguages profile={profile} />
        </section>

        <section className="mt-5">
          <ProfileReviews profile={profile} />
        </section>
      </main>
    </div>
  );
}
