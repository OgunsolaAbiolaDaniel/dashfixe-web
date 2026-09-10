import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Wrench } from '../icons';
import { link } from '../../routes';
import { useLang } from '../../i18n';

const CARD =
  'flex items-center gap-6 rounded-[20px] bg-panel p-[clamp(24px,3vw,36px)] text-left transition hover:bg-brand-tint';

export default function Apps({ onAuth }: { onAuth: () => void }) {
  const { t } = useLang();
  return (
    <section className="bg-page">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(44px,5vw,72px)]">
        <h2 className="mb-[30px] text-h2 text-ink">{t('apps.title')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          <button type="button" onClick={onAuth} className={CARD}>
            <span className="grid h-[84px] w-[84px] flex-none place-items-center rounded-card bg-well">
              <Phone size={38} className="text-ink" />
            </span>
            <span className="mr-auto min-w-0">
              <span className="block text-h3 text-ink">{t('apps.customer')}</span>
              <span className="mt-[5px] block text-[14.5px] font-semibold text-ink-60">{t('apps.customer.sub')}</span>
            </span>
            <ArrowRight size={24} className="flex-none text-ink" />
          </button>

          <Link to={link('forArtisans')} className={CARD + ' hover:text-ink'}>
            <span className="grid h-[84px] w-[84px] flex-none place-items-center rounded-card bg-well">
              <Wrench size={38} strokeWidth={1.5} className="text-ink" />
            </span>
            <span className="mr-auto min-w-0">
              <span className="block text-h3 text-ink">{t('apps.artisan')}</span>
              <span className="mt-[5px] block text-[14.5px] font-semibold text-ink-60">{t('apps.artisan.sub')}</span>
            </span>
            <ArrowRight size={24} className="flex-none text-ink" />
          </Link>
        </div>
      </div>
    </section>
  );
}
