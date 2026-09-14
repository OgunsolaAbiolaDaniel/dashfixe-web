import { Phone } from '../icons';
import StoreBadges from './StoreBadges';
import { useLang } from '../../i18n';

/**
 * "Do more on the Dashfixe app" — the signed-in customer's footer band (Activity,
 * Account, the end of the home panel). The badges say "coming soon": the apps
 * ship with the pilot, and nothing here implies they're out.
 */
export default function AppPromoBand({ className = '' }: { className?: string }) {
  const { t } = useLang();
  return (
    <aside aria-label={t('promo.title')} className={`relative overflow-hidden rounded-card bg-ink p-5 ${className}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 block h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.7)_0%,rgba(37,99,235,0)_68%)] blur-[20px]"
      />
      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-[16px] bg-white/10 text-white">
          <Phone size={22} />
        </span>
        <div className="min-w-[190px] flex-1">
          <p className="text-[16px] font-extrabold tracking-[-.015em] text-white">{t('promo.title')}</p>
          <p className="mt-1 text-[13px] font-medium leading-[1.5] text-onink">{t('promo.body')}</p>
        </div>
        <StoreBadges tone="light" size="sm" />
      </div>
    </aside>
  );
}
