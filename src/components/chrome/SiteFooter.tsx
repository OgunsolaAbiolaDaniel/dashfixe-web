import { Link } from 'react-router-dom';
import wordmarkLight from '../../assets/dashfixe-wordmark-light.png';
import { TRADE_SLUGS, link, tradeUrl, type Destination } from '../../routes';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

const LINK = 'text-[13.5px] font-semibold text-onink transition hover:text-white';
const HEAD = 'mb-4 text-label text-onink-strong';

/**
 * Marketing-surface footer — ARCHITECTURE.md §5. Every link resolves to something
 * true: trades open their landing pages (the SEO pages, one hop from /explore),
 * artisan links anchor into /for-artisans, support links anchor into /help. No
 * careers, no press — nothing that doesn't exist.
 */
const COMPANY: Array<[StringKey, Destination]> = [
  ['footer.about', 'about'],
  ['footer.coverage', 'coverage'],
  ['footer.contact', 'contact'],
];
const ARTISANS: Array<[StringKey, Destination]> = [
  ['footer.apply', 'artisanApply'],
  ['footer.payouts', 'artisanPay'],
  ['footer.vetting', 'artisanVetting'],
  ['footer.artisanApp', 'artisanApp'],
];
const SUPPORT: Array<[StringKey, Destination]> = [
  ['footer.helpCentre', 'help'],
  ['footer.safety', 'safety'],
  ['footer.cancellations', 'cancellations'],
  ['footer.report', 'contact'],
];

export default function SiteFooter() {
  const { t } = useLang();

  const column = (title: StringKey, rows: Array<[StringKey, Destination]>) => (
    <div>
      <div className={HEAD}>{t(title)}</div>
      <div className="flex flex-col gap-[11px]">
        {rows.map(([key, dest]) => (
          <Link key={key} to={link(dest)} className={LINK}>
            {t(key)}
          </Link>
        ))}
      </div>
    </div>
  );

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
              {TRADE_SLUGS.map((s) => (
                <Link key={s} to={tradeUrl(s)} className={LINK}>
                  {t(`trades.${s}` as const)}
                </Link>
              ))}
            </div>
          </div>

          {column('footer.company', COMPANY)}
          {column('footer.forArtisans', ARTISANS)}
          {column('footer.support', SUPPORT)}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 border-t border-white/10 pt-[26px]">
          <span className="text-[13.5px] font-semibold text-onink">{t('footer.copyright')}</span>
          <div className="flex flex-wrap gap-[22px]">
            <Link to={link('privacy')} className={LINK}>
              {t('footer.privacy')}
            </Link>
            <Link to={link('terms')} className={LINK}>
              {t('footer.terms')}
            </Link>
            <Link to={link('cookies')} className={LINK}>
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
