import { Link } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight } from '../components/icons';
import { link, type Destination } from '../routes';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * A real "not found" (docs/ARCHITECTURE.md §4). Unknown paths used to redirect
 * home silently — confusing for someone who followed a bad link, and a "soft 404"
 * for search engines. Now they get an honest page (noindex, via seo.ts) with the
 * doors people usually meant. Cut pages still redirect; this is for the rest.
 */
const DOORS: Array<[StringKey, Destination]> = [
  ['nav.findArtisan', 'explore'],
  ['nav.howItWorks', 'howItWorks'],
  ['nav.becomeArtisan', 'forArtisans'],
  ['nav.help', 'help'],
];

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto max-w-[640px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,8vw,104px)]">
          <div className="mb-3 text-label text-brand-hover">404</div>
          <h1 className="mb-3 text-display text-ink [text-wrap:balance]">{t('notFound.title')}</h1>
          <p className="mb-8 text-lead text-ink-60">{t('notFound.body')}</p>
          <Link
            to={link('home')}
            className="mb-8 inline-flex h-ctl-lg items-center gap-2 rounded-btn bg-ink px-6 text-[15px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
          >
            {t('error.home')}
            <ArrowRight size={17} />
          </Link>
          <div className="overflow-hidden rounded-card border border-line-soft">
            {DOORS.map(([label, to], i) => (
              <Link
                key={to}
                to={link(to)}
                className={
                  'flex items-center justify-between px-5 py-4 text-[15px] font-bold text-ink transition hover:bg-page hover:text-ink' +
                  (i < DOORS.length - 1 ? ' border-b border-line-rule' : '')
                }
              >
                {t(label)}
                <ArrowRight size={16} className="text-ink-40" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
