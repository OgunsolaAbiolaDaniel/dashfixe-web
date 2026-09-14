import { Link, Navigate } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ArrowRight, Check, Euro } from '../components/icons';
import { useAuth } from '../auth';
import { useApplication } from '../lib/proApplication';
import { setAvailability, setRadius, toggleReady, useProDash } from '../lib/proDashboard';
import { formatEuro } from '../lib/jobs';
import { ROUTES, link, type TradeSlug } from '../routes';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * /pro/dashboard — the artisan's dashboard (Uber's drivers.uber.com), rev 2.5.
 *
 * Honest about where things stand: nobody is an approved artisan yet, so it holds
 * what's true today — the application's status and next step, a "get ready for
 * your call" checklist built from what they applied with, the hours and radius
 * they'll take live jobs, and their profile — plus a clearly badged preview of
 * the earnings view they'll get once approved. Choices are saved on this device
 * (lib/proDashboard); nothing is uploaded.
 */
const CARD = 'rounded-card border border-line-soft bg-panel p-[clamp(18px,3vw,26px)]';

const AVAILABILITY: Array<[string, StringKey]> = [
  ['weekdays', 'pro.apply.av.weekdays'],
  ['evenings', 'pro.apply.av.evenings'],
  ['weekends', 'pro.apply.av.weekends'],
];
const RADII = [3, 5, 10];

export default function ProDashboardPage() {
  const { t } = useLang();
  const { signedIn, checking, name, phone, signOut } = useAuth();
  const app = useApplication();
  const dash = useProDash();

  if (checking) return null;
  if (!signedIn) return <Navigate to={`${ROUTES.proLogin}?next=${encodeURIComponent(ROUTES.proDashboard)}`} replace />;

  const first = name ?? app?.fullName.split(' ')[0] ?? '';
  const hours = dash.availability ?? app?.availability ?? [];

  // The checklist follows what they applied with.
  const items: Array<[string, StringKey]> = [
    ['id', 'pro.dash.doc.id'],
    ['nif', 'pro.dash.doc.nif'],
    ['iban', 'pro.dash.doc.iban'],
    ...(app?.insurance ? ([['insurance', 'pro.dash.doc.insurance']] as Array<[string, StringKey]>) : []),
    ...(app?.licences?.includes('dgeg') ? ([['dgeg', 'pro.dash.doc.dgeg']] as Array<[string, StringKey]>) : []),
    ...(app?.licences?.includes('gas') ? ([['gas', 'pro.dash.doc.gas']] as Array<[string, StringKey]>) : []),
  ];
  const done = items.filter(([id]) => dash.ready.includes(id)).length;

  return (
    <MarketingShell surface="pro">
      <section className="bg-page">
        <div className="mx-auto max-w-[1120px] px-[clamp(18px,4vw,40px)] py-[clamp(28px,4vw,56px)]">
          <div className="mb-7 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="mr-auto">
              <p className="mb-1.5 text-[14px] font-bold text-ink-60">{first ? t('pro.dash.hi', { name: first }) : t('pro.dash.hiAnon')}</p>
              <h1 className="text-h2 text-ink">{t('pro.dash.title')}</h1>
              <p className="mt-1.5 text-lead text-ink-60">{t('pro.dash.lead')}</p>
            </div>
            {app && (
              <span className="rounded-full bg-brand-tint px-3.5 py-2 text-[13px] font-bold text-brand-hover">
                {t('pro.dash.statusPill', { ref: app.reference })}
              </span>
            )}
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              {/* Where the application stands */}
              {app ? (
                <section className="relative overflow-hidden rounded-card bg-ink p-[clamp(20px,3vw,28px)]">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 block h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.7)_0%,rgba(37,99,235,0)_68%)] blur-[20px]"
                  />
                  <div className="relative">
                    <p className="mb-2 text-label text-brand-on-dark">{t('pro.dash.next')}</p>
                    <h2 className="mb-2 text-[21px] font-extrabold tracking-[-.02em] text-white">{t('pro.status.t2')}</h2>
                    <p className="mb-5 max-w-[480px] text-[14.5px] font-medium leading-[1.55] text-onink-strong">
                      {t('pro.status.t2b', { phone: app.phone })}
                    </p>
                    <Link
                      to={ROUTES.proApplication}
                      className="inline-flex h-ctl items-center gap-2 rounded-btn bg-panel px-5 text-[14.5px] font-bold text-ink transition hover:bg-well hover:text-ink"
                    >
                      {t('pro.dash.seeStatus')}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </section>
              ) : (
                <section className={CARD}>
                  <h2 className="mb-2 text-h3 text-ink">{t('pro.dash.noApp')}</h2>
                  <p className="mb-5 text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('pro.dash.noAppBody')}</p>
                  <Link
                    to={ROUTES.proApply}
                    className="inline-flex h-ctl-lg items-center gap-2 rounded-btn bg-brand px-6 text-[15px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
                  >
                    {t('pro.apply.start')}
                    <ArrowRight size={16} />
                  </Link>
                </section>
              )}

              {/* Get ready for the call — nothing is uploaded */}
              <section className={CARD}>
                <div className="mb-1.5 flex flex-wrap items-baseline gap-3">
                  <h2 className="mr-auto text-h3 text-ink">{t('pro.dash.ready')}</h2>
                  <span className="text-[13px] font-bold text-ink-60">{t('pro.dash.readyCount', { done, total: items.length })}</span>
                </div>
                <p className="mb-4 text-[14px] font-medium leading-[1.55] text-ink-60">{t('pro.dash.readyBody')}</p>
                <div aria-hidden="true" className="mb-4 h-1.5 overflow-hidden rounded-full bg-well">
                  <div className="h-1.5 rounded-full bg-success transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
                </div>
                <ul className="flex flex-col gap-2">
                  {items.map(([id, key]) => {
                    const on = dash.ready.includes(id);
                    return (
                      <li key={id}>
                        <label className={'flex cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 transition ' + (on ? 'border-success/30 bg-success-tint' : 'border-line-soft bg-page hover:border-line')}>
                          <input type="checkbox" checked={on} onChange={() => toggleReady(id)} className="peer sr-only" />
                          <span
                            aria-hidden="true"
                            className={
                              'grid h-6 w-6 flex-none place-items-center rounded-[8px] border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ' +
                              (on ? 'border-success bg-success text-white' : 'border-line bg-panel')
                            }
                          >
                            {on && <Check size={14} strokeWidth={3} />}
                          </span>
                          <span className={'text-[14.5px] font-semibold ' + (on ? 'text-ink' : 'text-ink-80')}>{t(key)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* When and how far */}
              <section className={CARD}>
                <h2 className="mb-1.5 text-h3 text-ink">{t('pro.dash.hours')}</h2>
                <p className="mb-4 text-[14px] font-medium leading-[1.55] text-ink-60">{t('pro.dash.hoursBody')}</p>
                <fieldset className="mb-4">
                  <legend className="mb-2 text-label text-ink-40">{t('pro.apply.availability')}</legend>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY.map(([value, key]) => (
                      <label key={value} className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hours.includes(value)}
                          onChange={() => setAvailability(hours.includes(value) ? hours.filter((h) => h !== value) : [...hours, value])}
                          className="peer sr-only"
                        />
                        <span className="inline-flex h-10 items-center rounded-full border border-line bg-panel px-4 text-[14px] font-semibold text-ink-80 transition hover:border-ink-30 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                          {t(key)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-label text-ink-40">{t('pro.dash.radius')}</legend>
                  <div className="flex flex-wrap gap-2">
                    {RADII.map((km) => (
                      <label key={km} className="cursor-pointer">
                        <input type="radio" name="pro-radius" checked={dash.radius === km} onChange={() => setRadius(km)} className="peer sr-only" />
                        <span className="inline-flex h-10 items-center rounded-full border border-line bg-panel px-4 text-[14px] font-semibold text-ink-80 transition hover:border-ink-30 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                          {km} km
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>
            </div>

            <div className="flex flex-col gap-5">
              {/* Profile */}
              <section className={CARD}>
                <h2 className="mb-4 text-h3 text-ink">{t('pro.dash.profile')}</h2>
                <dl className="divide-y divide-line-rule">
                  {(
                    [
                      ['fa.apply.name', app?.fullName ?? name ?? '—'],
                      ['pro.dash.phone', phone ?? app?.phone ?? '—'],
                      ['pro.dash.trade', app ? t(`trades.${app.trade as TradeSlug}` as const) : '—'],
                      ['pro.dash.areas', app?.areas.join(', ') || '—'],
                    ] as Array<[StringKey, string]>
                  ).map(([key, value]) => (
                    <div key={key} className="flex gap-3 py-2.5">
                      <dt className="w-[38%] flex-none text-[13px] font-semibold text-ink-40">{t(key)}</dt>
                      <dd className="min-w-0 flex-1 break-words text-[14.5px] font-semibold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-rule pt-4">
                  <Link to={ROUTES.proApply} className="text-[13.5px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.dash.update')}
                  </Link>
                  <button type="button" onClick={signOut} className="text-[13.5px] font-bold text-ink-60 transition hover:text-ink">
                    {t('nav.signOut')}
                  </button>
                </div>
              </section>

              {/* What it becomes — sample, and says so */}
              <section className={CARD}>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto text-h3 text-ink">{t('pro.dash.preview')}</h2>
                  <span className="rounded-full bg-warning-tint px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-warning">
                    {t('pro.dash.previewBadge')}
                  </span>
                </div>
                <p className="mb-4 text-[14px] font-medium leading-[1.55] text-ink-60">{t('pro.dash.previewBody')}</p>
                <div className="mb-3 rounded-[18px] bg-[linear-gradient(150deg,#15803d,#0f5132)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-white/80">{t('pro.earn.friday')}</p>
                  <p className="mt-1 text-[30px] font-extrabold leading-none tracking-[-.03em] text-white">€412.40</p>
                  <p className="mt-1.5 text-[12.5px] text-white/85">{t('pro.payout.count', { n: 7 })}</p>
                </div>
                <ul className="overflow-hidden rounded-[16px] border border-line-soft">
                  {(
                    [
                      ['SL', 'pro.job.title', 70.9],
                      ['JC', 'pro.shot.shower', 96.8],
                      ['AR', 'pro.shot.radiator', 52.2],
                    ] as const
                  ).map(([initials, key, net], i) => (
                    <li key={key} className={'flex items-center gap-3 px-3.5 py-2.5' + (i < 2 ? ' border-b border-line-rule' : '')}>
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-avatar text-[10px] font-extrabold text-brand">{initials}</span>
                      <span className="mr-auto truncate text-[13.5px] font-bold text-ink">{t(key)}</span>
                      <span className="flex-none whitespace-nowrap text-[13.5px] font-bold text-success">+{formatEuro(net)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-ink-60">
                  <Euro size={14} className="text-success" />
                  {t('pro.dash.leadFees')}
                </p>
              </section>

              {/* Help */}
              <section className="rounded-card bg-brand-tint p-5">
                <h2 className="mb-1 text-[15.5px] font-bold text-ink-80">{t('pro.dash.help')}</h2>
                <p className="mb-3 text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('pro.dash.helpBody')}</p>
                <div className="flex flex-col gap-1.5">
                  <Link to={ROUTES.proHelp} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.dash.helpCentre')}
                    <ArrowRight size={15} />
                  </Link>
                  <Link to={link('artisanPay')} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.status.howPay')}
                    <ArrowRight size={15} />
                  </Link>
                  <Link to={link('artisanApp')} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand transition hover:text-brand-hover">
                    {t('pro.status.seeApp')}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
