import { Link } from 'react-router-dom';
import { ArrowRight, Check } from '../icons';
import PhoneShot from '../shared/PhoneShot';
import StoreBadges from '../shared/StoreBadges';
import { AskShot, DoneShot, TrackShot } from './AppShots';
import { link } from '../../routes';
import { useLang } from '../../i18n';

/**
 * "Do more with the app" — the home's closing section for visitors. What the
 * customer app adds (live tracking, alerts, receipts), stills of it, and the
 * store badges, which say "coming soon" because the apps ship with the pilot.
 * Tradespeople get one line to the artisan app (/pro).
 */
const BENEFITS = ['apps.b1', 'apps.b2', 'apps.b3'] as const;

export default function Apps() {
  const { t } = useLang();
  return (
    <section className="overflow-hidden bg-page">
      <div className="mx-auto grid max-w-[1280px] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(18px,4vw,40px)] py-[clamp(48px,6vw,88px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <h2 className="mb-3 text-h2 text-ink">{t('apps.title')}</h2>
          <p className="mb-6 max-w-[460px] text-lead text-ink-60">{t('apps.lead')}</p>
          <ul className="mb-7 flex flex-col gap-3">
            {BENEFITS.map((k) => (
              <li key={k} className="flex items-start gap-3 text-[15px] font-semibold leading-[1.45] text-ink-80">
                <span className="mt-px grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-tint text-brand">
                  <Check size={13} strokeWidth={2.6} />
                </span>
                {t(k)}
              </li>
            ))}
          </ul>
          <StoreBadges note />
          <Link to={link('artisanApp')} className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-bold text-brand transition hover:text-brand-hover">
            {t('apps.pro')}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="-mx-[clamp(18px,4vw,40px)] flex snap-x gap-5 overflow-x-auto px-[clamp(18px,4vw,40px)] pb-2 lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0">
          <PhoneShot caption={t('app.shot.ask')}>
            <AskShot />
          </PhoneShot>
          <PhoneShot caption={t('app.shot.track')} className="lg:-mt-10">
            <TrackShot />
          </PhoneShot>
          {/* Three swipe on phones; two sit side by side in the desktop column. */}
          <PhoneShot caption={t('app.shot.done')} className="lg:hidden">
            <DoneShot />
          </PhoneShot>
        </div>
      </div>
    </section>
  );
}
