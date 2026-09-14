import { Check, MapPin, Search, Star, Wrench } from '../icons';
import { useLang } from '../../i18n';

/**
 * Stills of the customer app (designs/Dashfixe Design.dc.html) for "Do more with
 * the app": ask, track, done. Static and sample (Tiago, €63.00 — the same numbers
 * as the seeded job, so the stills agree with the web app).
 */
const CARD = 'rounded-[16px] border border-line-soft bg-panel';

export function AskShot() {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col px-4 pt-10">
      <p className="mb-3 text-[20px] font-extrabold leading-[1.1] tracking-[-.025em] text-ink">{t('app.s.need')}</p>
      <div className={`${CARD} mb-2 p-3`}>
        <p className="text-[12px] font-semibold text-ink">{t('app.s.needValue')}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-bold text-brand-hover">
          <Wrench size={11} />
          {t('trades.plumbing')}
        </span>
      </div>
      <div className={`${CARD} mb-3 flex items-center gap-2 p-3`}>
        <MapPin size={14} className="text-ink-60" />
        <span className="truncate text-[11px] font-semibold text-ink">Rua da Cooperativa 14, Amora</span>
      </div>
      <div className="grid h-11 place-items-center rounded-[14px] bg-brand text-[13px] font-bold text-white">
        <span className="flex items-center gap-1.5">
          <Search size={14} />
          {t('app.s.find')}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-success">
        <i className="block h-1.5 w-1.5 rounded-full bg-success" />
        {t('app.s.available')}
      </p>
    </div>
  );
}

export function TrackShot() {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className="relative h-[250px] overflow-hidden bg-[#e9eef7]">
        <svg viewBox="0 0 236 250" className="absolute inset-0 h-full w-full">
          <path d="M0 190 L90 204 L170 196 L236 212 L236 250 L0 250 Z" fill="#cfe0ef" />
          <g fill="#dde4f0">
            <rect x="12" y="40" width="58" height="40" rx="4" />
            <rect x="84" y="36" width="54" height="34" rx="4" />
            <rect x="150" y="44" width="72" height="40" rx="4" />
            <rect x="16" y="104" width="52" height="46" rx="4" />
            <rect x="84" y="96" width="56" height="40" rx="4" />
            <rect x="152" y="108" width="68" height="44" rx="4" />
          </g>
          <g stroke="#f6f8fc" fill="none" strokeLinecap="round">
            <path d="M0 92 H236" strokeWidth="10" />
            <path d="M0 166 H236" strokeWidth="8" />
            <path d="M76 0 V250" strokeWidth="9" />
            <path d="M146 0 V250" strokeWidth="7" />
          </g>
          <path d="M190 60 L146 60 L146 166 L100 166 L100 184" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute left-[80%] top-[24%] grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-brand text-[9px] font-extrabold text-white">
          TF
        </span>
        <span className="absolute left-[42%] top-[74%] grid h-7 w-7 -translate-x-1/2 -translate-y-full place-items-center rounded-full border-[3px] border-white bg-ink text-white">
          <MapPin size={12} />
        </span>
      </div>
      <div className="relative -mt-5 flex-1 rounded-t-[22px] bg-page px-4 pt-4">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[.12em] text-brand">{t('app.s.onWay')}</p>
        <p className="mt-1 text-[21px] font-extrabold leading-none tracking-[-.03em] text-ink">{t('app.s.arrives')}</p>
        <div className={`${CARD} mt-3 flex items-center gap-2.5 p-3`}>
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-avatar text-[11px] font-extrabold text-brand">TF</span>
          <span className="mr-auto">
            <span className="block text-[12px] font-bold text-ink">Tiago Ferreira</span>
            <span className="block text-[10px] text-ink-40">{t('trades.plumbing')} · 4.9</span>
          </span>
          <span className="text-right">
            <span className="block text-[9px] text-ink-40">{t('app.s.agreed')}</span>
            <span className="block text-[13px] font-extrabold text-ink">€63.00</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function DoneShot() {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col px-4 pt-12">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-[20px] bg-success-tint text-success">
        <Check size={26} strokeWidth={2.4} />
      </span>
      <p className="mb-1 text-[24px] font-extrabold leading-[1.05] tracking-[-.03em] text-ink">{t('app.s.fixed')}</p>
      <p className="mb-4 text-[12px] font-medium text-ink-60">{t('app.s.rate')}</p>
      <div className="mb-4 flex gap-1.5 text-star">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={24} />
        ))}
      </div>
      <div className={`${CARD} p-3`}>
        <div className="flex text-[10.5px] text-ink-60">
          <span className="mr-auto">{t('pro.est.l.cartridge')}</span>
          <span className="font-semibold text-ink">€14.00</span>
        </div>
        <div className="mt-1.5 flex text-[10.5px] text-ink-60">
          <span className="mr-auto">{t('pro.est.l.labour')}</span>
          <span className="font-semibold text-ink">€49.00</span>
        </div>
        <div className="mt-2 flex items-baseline border-t border-line-rule pt-2">
          <span className="mr-auto text-[11.5px] font-bold text-ink">{t('app.s.paid')}</span>
          <span className="text-[16px] font-extrabold text-ink">€63.00</span>
        </div>
      </div>
    </div>
  );
}
