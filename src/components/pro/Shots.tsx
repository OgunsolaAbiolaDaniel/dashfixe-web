import { Euro } from '../icons';
import { formatEuro } from '../../lib/jobs';
import { quote } from '../../lib/pro';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * Stills of the artisan app (designs/Dashfixe Artisan App.dc.html) for the /pro
 * showcase: Today, a job offer, the estimate builder, Earnings. Static and
 * sample; the estimate's numbers are the real arithmetic (lib/pro), so they
 * match the design to the cent.
 */
const LINES: ReadonlyArray<readonly [StringKey, number]> = [
  ['pro.est.l.cartridge', 12.4],
  ['pro.est.l.silicone', 3.2],
  ['pro.est.l.labour', 28],
  ['pro.est.l.callout', 6],
];
const EST = quote(LINES.map(([label, amount]) => ({ id: label, kind: 'part' as const, label, detail: '', amount })));

const CARD = 'rounded-[16px] border border-line-soft bg-panel';

export function TodayShot() {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className="rounded-b-[22px] bg-ink px-4 pb-4 pt-9">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[linear-gradient(140deg,#3b6fe0,#1e40af)] text-[11px] font-extrabold text-white">TF</span>
          <span>
            <span className="block text-[10.5px] text-onink">{t('pro.hi.morning')}</span>
            <span className="block text-[15px] font-extrabold text-white">Tiago</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-[16px] border border-white/15 bg-white/10 px-3 py-2.5">
          <i className="block h-2 w-2 rounded-full bg-success-bright" />
          <span className="mr-auto">
            <span className="block text-[13px] font-bold text-white">{t('pro.online')}</span>
            <span className="block text-[10px] text-onink">{t('pro.radius')}</span>
          </span>
          <span className="flex h-6 w-10 justify-end rounded-full bg-success-bright p-[2px]">
            <i className="block h-5 w-5 rounded-full bg-white" />
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3.5">
        <div className="flex gap-2">
          {(
            [
              ['€184', 'pro.stat.today'],
              ['3', 'pro.stat.done'],
              ['4.9', 'pro.stat.rating'],
            ] as const
          ).map(([v, k]) => (
            <div key={k} className={`${CARD} flex-1 px-2.5 py-2`}>
              <div className="text-[15px] font-extrabold text-ink">{v}</div>
              <div className="text-[9.5px] font-semibold text-ink-40">{t(k)}</div>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[9.5px] font-extrabold uppercase tracking-[.12em] text-ink-40">{t('pro.next')}</p>
        <div className={`${CARD} p-3`}>
          <div className="mb-2 flex items-center">
            <span className="mr-auto rounded-full bg-brand-tint px-2 py-1 text-[9.5px] font-bold text-brand-hover">{t('pro.next.when')}</span>
            <span className="flex-none whitespace-nowrap text-[11px] font-bold text-ink">€90–110</span>
          </div>
          <p className="text-[13.5px] font-bold text-ink">{t('pro.next.title')}</p>
          <p className="mt-0.5 text-[10px] text-ink-40">Amora · 2.2 km</p>
        </div>
        <div className="flex items-center gap-2 rounded-[16px] border border-success/25 bg-success-tint px-3 py-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-panel text-success">
            <Euro size={14} />
          </span>
          <span>
            <span className="block text-[11.5px] font-bold text-[#14532d]">{t('pro.payout.banner', { net: '€412.40' })}</span>
            <span className="block text-[9.5px] text-success">{t('pro.payout.count', { n: 7 })}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function OfferShot() {
  const { t } = useLang();
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#070d22] px-4 pb-5 pt-10 text-center text-white">
      <span className="absolute -left-20 -top-24 h-[260px] w-[280px] rounded-full bg-[radial-gradient(circle,#2563eb_0%,rgba(37,99,235,0)_68%)] blur-[30px]" />
      <span className="absolute -bottom-16 -right-24 h-[240px] w-[260px] rounded-full bg-[radial-gradient(circle,#16a34a_0%,rgba(22,163,74,0)_66%)] opacity-70 blur-[36px]" />
      <div className="relative flex h-full flex-col">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[.16em] text-brand-on-dark">{t('pro.offer.eyebrow')}</p>
        <p className="mb-4 mt-1.5 text-[23px] font-extrabold leading-[1.05] tracking-[-.03em]">{t('pro.job.title')}</p>
        <div className="mb-3 rounded-[18px] border border-white/20 bg-white/10 p-3 text-left">
          <div className="mb-2.5 h-[86px] rounded-[12px] bg-white/10" />
          <p className="text-[11px] leading-[1.45]">“{t('pro.job.quote')}”</p>
        </div>
        <div className="flex gap-1.5">
          {(
            [
              ['6 min', 'pro.offer.drive'],
              ['~1 h', 'pro.offer.work'],
            ] as const
          ).map(([v, k]) => (
            <div key={k} className="flex-1 rounded-[14px] border border-white/15 bg-white/10 py-2">
              <div className="text-[13px] font-extrabold">{v}</div>
              <div className="text-[9px] text-white/75">{t(k)}</div>
            </div>
          ))}
          <div className="flex-1 rounded-[14px] border border-success-bright/35 bg-success-bright/20 py-2 text-[#a7f3cf]">
            <div className="text-[13px] font-extrabold">{formatEuro(EST.net)}</div>
            <div className="text-[9px]">{t('pro.offer.keep')}</div>
          </div>
        </div>
        <div className="mt-auto">
          <div className="mb-3 h-1 rounded-full bg-white/15">
            <div className="h-1 w-3/5 rounded-full bg-success-bright" />
          </div>
          <div className="grid h-11 place-items-center rounded-[14px] bg-success-bright text-[14px] font-extrabold text-[#04301e]">{t('pro.offer.accept')}</div>
        </div>
      </div>
    </div>
  );
}

export function EstimateShot() {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <p className="px-4 pb-2 pt-10 text-[18px] font-extrabold tracking-[-.02em] text-ink">{t('pro.est.title')}</p>
      <div className="flex flex-1 flex-col gap-2 px-4">
        <div className={`${CARD} overflow-hidden`}>
          {LINES.map(([k, amount], i) => (
            <div key={k} className={'flex items-center gap-2 px-3 py-2' + (i < LINES.length - 1 ? ' border-b border-line-rule' : '')}>
              <span className="mr-auto truncate text-[11px] font-semibold text-ink">{t(k)}</span>
              <span className="text-[11px] font-bold text-ink">{formatEuro(amount)}</span>
            </div>
          ))}
        </div>
        <div className={`${CARD} px-3 py-2.5`}>
          <div className="flex text-[10px] text-ink-60">
            <span className="mr-auto">IVA 23%</span>
            <span className="font-semibold text-ink">{formatEuro(EST.iva)}</span>
          </div>
          <div className="mt-1.5 flex items-baseline border-t border-line-rule pt-1.5">
            <span className="mr-auto text-[11.5px] font-bold text-ink">{t('pro.est.pays')}</span>
            <span className="text-[18px] font-extrabold tracking-[-.02em] text-ink">{formatEuro(EST.total)}</span>
          </div>
        </div>
        <div className="rounded-[16px] border border-success/25 bg-success-tint px-3 py-2.5">
          <div className="flex text-[10px] text-success">
            <span className="mr-auto">{t('pro.est.commission')}</span>
            <span className="font-bold">{formatEuro(-EST.commission)}</span>
          </div>
          <div className="mt-0.5 flex items-baseline">
            <span className="mr-auto text-[11.5px] font-bold text-[#14532d]">{t('pro.est.receive')}</span>
            <span className="text-[16px] font-extrabold text-[#14532d]">{formatEuro(EST.net)}</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-5 pt-3">
        <div className="grid h-11 place-items-center rounded-[14px] bg-brand text-[13.5px] font-bold text-white">{t('pro.est.send')}</div>
      </div>
    </div>
  );
}

export function EarningsShot() {
  const { t } = useLang();
  const rows = [
    ['SL', 'pro.job.title', 70.9],
    ['JC', 'pro.shot.shower', 96.8],
    ['AR', 'pro.shot.radiator', 52.2],
  ] as const;
  return (
    <div className="flex h-full flex-col px-4 pt-10">
      <p className="mb-2.5 text-[18px] font-extrabold tracking-[-.02em] text-ink">{t('pro.tab.earnings')}</p>
      <div className="mb-2.5 rounded-[18px] bg-[linear-gradient(150deg,#15803d,#0f5132)] p-3.5">
        <p className="text-[9.5px] font-bold uppercase tracking-[.12em] text-white/80">{t('pro.earn.friday')}</p>
        <p className="mt-1 text-[27px] font-extrabold leading-none tracking-[-.03em] text-white">€412.40</p>
        <p className="mt-1.5 text-[10px] text-white/85">{t('pro.payout.count', { n: 7 })}</p>
      </div>
      <div className="mb-2.5 flex gap-1.5">
        {(
          [
            ['−€56.23', 'pro.earn.commission', false],
            ['€0', 'pro.earn.leadFees', true],
          ] as const
        ).map(([v, k, green]) => (
          <div key={k} className={`${CARD} min-w-0 flex-1 px-2 py-1.5`}>
            <div className={'truncate text-[11.5px] font-extrabold ' + (green ? 'text-success' : 'text-ink')}>{v}</div>
            <div className="truncate text-[9px] font-semibold text-ink-40">{t(k)}</div>
          </div>
        ))}
      </div>
      <div className={`${CARD} overflow-hidden`}>
        {rows.map(([initials, k, net], i) => (
          <div key={k} className={'flex items-center gap-2 px-3 py-2' + (i < rows.length - 1 ? ' border-b border-line-rule' : '')}>
            <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-avatar text-[9px] font-extrabold text-brand">{initials}</span>
            <span className="mr-auto truncate text-[11px] font-bold text-ink">{t(k)}</span>
            <span className="flex-none whitespace-nowrap text-[11px] font-bold text-success">+{formatEuro(net)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
