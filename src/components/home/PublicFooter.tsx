import { Link } from 'react-router-dom';
import wordmarkLight from '../../assets/dashfixe-wordmark-light.png';
import { link } from '../../routes';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

const LINK = 'text-[13.5px] font-semibold text-onink transition hover:text-white';
const HEAD = 'mb-4 text-label text-onink-strong';

const SERVICES = ['plumbing', 'electrical', 'painting', 'carpentry', 'cleaning'] as const;
const COMPANY: StringKey[] = ['footer.about', 'footer.coverage', 'footer.careers', 'footer.press', 'footer.contact'];
const ARTISANS: StringKey[] = [
  'footer.apply',
  'footer.payouts',
  'footer.vetting',
  'footer.artisanApp',
  'footer.subcontracting',
];
const SUPPORT: StringKey[] = ['footer.helpCentre', 'footer.safety', 'footer.cancellations', 'footer.report'];

export default function PublicFooter() {
  const { t } = useLang();
  return (
    <footer className="bg-ink">
      <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)] pb-7 pt-[clamp(44px,5vw,64px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-x-6 gap-y-8 pb-9">
          <div>
            <img src={wordmarkLight} alt="Dashfixe" className="mb-4 block h-5 w-auto" />
            <p className="max-w-[220px] text-[13.5px] font-medium leading-[1.6] text-onink">{t('footer.tagline')}</p>
          </div>

          <div>
            <div className={HEAD}>{t('footer.services')}</div>
            <div className="flex flex-col gap-[11px]">
              {SERVICES.map((s) => (
                <a key={s} href="#trades" className={LINK}>
                  {t(`trades.${s}` as const)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>{t('footer.company')}</div>
            <div className="flex flex-col gap-[11px]">
              {COMPANY.map((k) => (
                <a key={k} href={link('about')} className={LINK}>
                  {t(k)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>{t('footer.forArtisans')}</div>
            <div className="flex flex-col gap-[11px]">
              {ARTISANS.map((k) => (
                <Link key={k} to={link('forArtisans')} className={LINK}>
                  {t(k)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>{t('footer.support')}</div>
            <div className="flex flex-col gap-[11px]">
              {SUPPORT.map((k) => (
                <a key={k} href={link('help')} className={LINK}>
                  {t(k)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 border-t border-white/10 pt-[26px]">
          <span className="text-[13.5px] font-semibold text-onink">{t('footer.copyright')}</span>
          <div className="flex flex-wrap gap-[22px]">
            <a href={link('privacy')} className={LINK}>
              {t('footer.privacy')}
            </a>
            <a href={link('terms')} className={LINK}>
              {t('footer.terms')}
            </a>
            <a href={link('cookies')} className={LINK}>
              {t('footer.cookies')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
