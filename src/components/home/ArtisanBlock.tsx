import { Link } from 'react-router-dom';
import { link } from '../../routes';
import { useLang } from '../../i18n';

export default function ArtisanBlock() {
  const { t } = useLang();
  return (
    <section id="pros" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-[clamp(28px,4vw,56px)]">
          <div className="overflow-hidden rounded-card bg-well">
            <img
              src="https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt=""
              loading="lazy"
              className="block h-[clamp(280px,30vw,420px)] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="mb-[18px] text-h2 text-ink [text-wrap:balance]">{t('artisan.title')}</h2>
            <p className="mb-[30px] max-w-[420px] text-lead text-ink-60 [text-wrap:pretty]">{t('artisan.body')}</p>
            <div className="flex flex-wrap items-center gap-[26px]">
              <Link
                to={link('forArtisans')}
                className="flex h-[52px] items-center rounded-btn bg-ink px-[26px] text-[15px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
              >
                {t('artisan.start')}
              </Link>
              <Link
                to={link('forArtisans')}
                className="border-b border-[#c8d1e0] pb-1 text-[14.5px] font-semibold text-ink transition hover:border-ink hover:text-ink"
              >
                {t('artisan.signin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
