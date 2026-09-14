import { useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Euro, Home, IdCard, Verified } from '../icons';
import { formatEuro } from '../../lib/jobs';
import { daysAgo, setOnline, setWeekend, usePro, week } from '../../lib/pro';
import { useLang } from '../../i18n';
import { link } from '../../routes';
import type { StringKey } from '../../i18n/strings';

/**
 * Between jobs: the four tabs of designs/Dashfixe Artisan App.dc.html — Today
 * (the availability switch, the day's numbers, the next booking, the payout),
 * Schedule, Earnings ("Lead fees €0" is a permanent tile) and Profile & standing.
 * Tiago and his week are sample data, badged as such.
 */
type Tab = 'today' | 'schedule' | 'earnings' | 'profile';
type Props = { now: number; finished: boolean; notice: string | null; onReset: () => void };

const TABS: ReadonlyArray<{ id: Tab; Icon: ComponentType<{ size?: number }>; key: StringKey }> = [
  { id: 'today', Icon: Home, key: 'pro.tab.today' },
  { id: 'schedule', Icon: Calendar, key: 'pro.tab.schedule' },
  { id: 'earnings', Icon: Euro, key: 'pro.tab.earnings' },
  { id: 'profile', Icon: IdCard, key: 'pro.tab.profile' },
];

const CARD = 'rounded-[20px] border border-line-soft bg-panel';

export default function ProTabs({ now, finished, notice, onReset }: Props) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('today');
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'today' && <Today now={now} finished={finished} notice={notice} onReset={onReset} onEarnings={() => setTab('earnings')} />}
        {tab === 'schedule' && <Schedule now={now} />}
        {tab === 'earnings' && <Earnings now={now} />}
        {tab === 'profile' && <Profile onReset={onReset} />}
      </div>
      <nav aria-label={t('pro.tabs')} className="grid flex-none grid-cols-4 border-t border-line-rule bg-panel pb-3 pt-2.5">
        {TABS.map(({ id, Icon, key }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
            className={'flex flex-col items-center gap-1 py-1 text-[11.5px] font-bold transition ' + (tab === id ? 'text-brand' : 'text-ink-40 hover:text-ink')}
          >
            <Icon size={21} />
            {t(key)}
          </button>
        ))}
      </nav>
    </div>
  );
}

/** Screen 01 — online is a physical-feeling switch on a dark header. */
function Today({ now, finished, notice, onReset, onEarnings }: Omit<Props, 'onReset'> & { onReset: () => void; onEarnings: () => void }) {
  const { t } = useLang();
  const pro = usePro();
  const [hour] = useState(() => new Date(now).getHours());
  const w = week(pro.paid, now);
  const today = w.jobs.filter((j) => daysAgo(j.at, now) === 0);
  const greet = hour < 12 ? 'pro.hi.morning' : hour < 19 ? 'pro.hi.afternoon' : 'pro.hi.evening';

  return (
    <>
      <div className="rounded-b-[30px] bg-ink px-5 pb-6 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[16px] bg-[linear-gradient(140deg,#3b6fe0,#1e40af)] text-[14px] font-extrabold text-white">
            TF
          </span>
          <span className="mr-auto">
            <span className="block text-[13px] font-medium text-onink">{t(greet)}</span>
            <span className="block text-[19px] font-extrabold tracking-[-.02em] text-white">Tiago</span>
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[.06em] text-onink-strong">
            {t('pro.sample')}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pro.online}
          onClick={() => setOnline(!pro.online)}
          className="flex w-full items-center gap-3.5 rounded-[22px] border border-white/15 bg-white/10 px-[18px] py-4 text-left transition hover:bg-white/15"
        >
          <span className="relative h-2.5 w-2.5 flex-none">
            <i className={'absolute inset-0 rounded-full ' + (pro.online ? 'bg-success-bright' : 'bg-onink')} />
            {pro.online && <i className="absolute inset-0 animate-ping rounded-full bg-success-bright opacity-60" />}
          </span>
          <span className="mr-auto">
            <span className="block text-[17px] font-bold text-white">{t(pro.online ? 'pro.online' : 'pro.offline')}</span>
            <span className="mt-0.5 block text-[13px] text-onink">{t(pro.online ? 'pro.radius' : 'pro.goOnline')}</span>
          </span>
          <span aria-hidden="true" className={'flex h-8 w-14 flex-none rounded-full p-[3px] transition ' + (pro.online ? 'justify-end bg-success-bright' : 'bg-white/20')}>
            <i className="block h-[26px] w-[26px] rounded-full bg-white" />
          </span>
        </button>
      </div>

      <div className="px-5 pb-6 pt-5">
        <div role="status" className="mb-5">
          {notice && <p className="mb-2 rounded-[16px] bg-well px-4 py-3 text-[13.5px] font-semibold text-ink-80">{notice}</p>}
          {finished ? (
            <div className="rounded-[20px] border border-success/25 bg-success-tint p-4">
              <p className="mb-3 text-[14px] font-semibold leading-[1.5] text-[#14532d]">{t('pro.done')}</p>
              <button type="button" onClick={onReset} className="h-10 rounded-[12px] bg-panel px-4 text-[13.5px] font-bold text-ink transition hover:bg-well">
                {t('pro.restart')}
              </button>
            </div>
          ) : pro.online ? (
            <p className="flex items-center gap-2.5 text-[14px] font-semibold text-ink-60">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              {t('pro.looking')}
            </p>
          ) : (
            <p className="text-[14px] font-semibold text-ink-60">{t('pro.offlineNote')}</p>
          )}
        </div>

        <div className="mb-5 flex gap-2.5">
          <Stat value={formatEuro(today.reduce((s, j) => s + j.net, 0))} label={t('pro.stat.today')} />
          <Stat value={String(today.length)} label={t('pro.stat.done')} />
          <Stat value="4.9" label={t('pro.stat.rating')} />
        </div>

        <p className="mb-2.5 text-label text-ink-40">{t('pro.next')}</p>
        <div className={`${CARD} mb-5 p-[18px]`}>
          <div className="mb-3 flex items-center">
            <span className="mr-auto rounded-full bg-brand-tint px-3 py-1.5 text-[12.5px] font-bold text-brand-hover">{t('pro.next.when')}</span>
            <span className="text-[14px] font-bold text-ink">€90–110</span>
          </div>
          <p className="text-[18px] font-bold tracking-[-.02em] text-ink">{t('pro.next.title')}</p>
          <p className="mt-1 text-[13.5px] font-medium text-ink-40">Rua Cidade de Setúbal 8, Amora · 2.2 km</p>
        </div>

        <button
          type="button"
          onClick={onEarnings}
          className="flex w-full items-center gap-3 rounded-[20px] border border-success/25 bg-success-tint px-4 py-3.5 text-left transition hover:brightness-[.98]"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[14px] bg-panel text-success">
            <Euro size={19} />
          </span>
          <span className="mr-auto">
            <span className="block text-[15.5px] font-bold text-[#14532d]">{t('pro.payout.banner', { net: formatEuro(w.net) })}</span>
            <span className="mt-px block text-[13px] font-medium text-success">{t('pro.payout.count', { n: w.jobs.length })}</span>
          </span>
          <ChevronRight size={17} className="text-success" />
        </button>
      </div>
    </>
  );
}

/** Screen 11 — booked work and open live hours on one timeline. */
function Schedule({ now }: { now: number }) {
  const { t, lang } = useLang();
  const pro = usePro();
  const locale = lang === 'PT' ? 'pt-PT' : 'en-GB';
  const days = Array.from({ length: 5 }, (_, i) => new Date(now + i * 86_400_000));
  const slots = [
    { time: '09:00', title: t('pro.next.title'), sub: 'Amora · 2.2 km · €90–110', kind: 'job' },
    { time: '11:30', title: t('pro.sched.boiler'), sub: 'Seixal · 3.8 km · €65', kind: 'job' },
    { time: '13:00', title: t('pro.sched.lunch'), sub: t('pro.sched.noOffers'), kind: 'off' },
    { time: '14:00', title: t('pro.sched.open'), sub: t('pro.sched.openSub'), kind: 'open' },
  ] as const;

  return (
    <div className="px-5 pb-6 pt-5">
      <h2 className="mb-4 text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-ink">{t('pro.tab.schedule')}</h2>
      <div className="mb-5 flex gap-1.5">
        {days.map((d, i) => (
          <span key={i} className={'flex-1 rounded-[14px] py-2.5 text-center ' + (i === 0 ? 'bg-brand text-white' : 'border border-line-soft bg-panel text-ink')}>
            <span className={'block text-[11px] font-semibold uppercase ' + (i === 0 ? 'text-white/85' : 'text-ink-40')}>
              {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d).replace('.', '')}
            </span>
            <span className="mt-0.5 block text-[17px] font-extrabold">{d.getDate()}</span>
          </span>
        ))}
      </div>
      <ol className="flex flex-col gap-2.5">
        {slots.map((s) => (
          <li key={s.time} className="flex gap-3">
            <span className="w-[46px] flex-none pt-3.5 text-[13px] font-bold text-ink-40">{s.time}</span>
            <div
              className={
                'flex-1 rounded-[20px] px-4 py-3.5 ' +
                (s.kind === 'job'
                  ? 'border border-l-4 border-line-soft border-l-brand bg-panel'
                  : s.kind === 'off'
                    ? 'border-[1.5px] border-dashed border-line bg-well'
                    : 'border-[1.5px] border-dashed border-brand/35 bg-brand-tint/50')
              }
            >
              <p className={'text-[15.5px] font-bold ' + (s.kind === 'job' ? 'text-ink' : s.kind === 'off' ? 'text-ink-60' : 'text-brand-hover')}>{s.title}</p>
              <p className="mt-0.5 text-[13px] font-medium text-ink-40">{s.sub}</p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        role="switch"
        aria-checked={pro.weekend}
        onClick={() => setWeekend(!pro.weekend)}
        className="mt-5 flex w-full items-center gap-3 rounded-[22px] bg-ink p-[17px] text-left"
      >
        <span className="mr-auto">
          <span className="block text-[16px] font-bold text-white">{t('pro.sched.weekend')}</span>
          <span className="mt-0.5 block text-[13px] text-onink">{t('pro.sched.weekendSub')}</span>
        </span>
        <span aria-hidden="true" className={'flex h-[30px] w-[52px] flex-none rounded-full p-[3px] transition ' + (pro.weekend ? 'justify-end bg-success-bright' : 'bg-white/20')}>
          <i className="block h-6 w-6 rounded-full bg-white" />
        </span>
      </button>
    </div>
  );
}

/** Screen 10 — the week's payout, and the no-lead-fee claim in the artisan's own numbers. */
function Earnings({ now }: { now: number }) {
  const { t, lang } = useLang();
  const pro = usePro();
  const w = week(pro.paid, now);
  const locale = lang === 'PT' ? 'pt-PT' : 'en-GB';
  const when = (at: number) => {
    const d = daysAgo(at, now);
    const day = d === 0 ? t('later.mode.today') : d === 1 ? t('pro.yesterday') : new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(at);
    return `${day}, ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(at)}`;
  };

  return (
    <div className="px-5 pb-6 pt-5">
      <h2 className="mb-4 text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-ink">{t('pro.tab.earnings')}</h2>
      <div className="mb-4 rounded-[26px] bg-[linear-gradient(150deg,#15803d,#0f5132)] p-[22px] shadow-[0_16px_34px_-14px_rgba(22,163,74,.6)]">
        <p className="text-[12.5px] font-bold uppercase tracking-[.12em] text-white/80">{t('pro.earn.friday')}</p>
        <p className="mb-1 mt-2 text-[42px] font-extrabold leading-[1.05] tracking-[-.035em] text-white">{formatEuro(w.net)}</p>
        <p className="text-[14px] font-medium text-white/85">{t('pro.payout.count', { n: w.jobs.length })}</p>
      </div>
      <div className="mb-5 flex gap-2.5">
        <Stat value={formatEuro(w.gross)} label={t('pro.earn.gross')} small />
        <Stat value={formatEuro(-w.commission)} label={t('pro.earn.commission')} small />
        <Stat value="€0" label={t('pro.earn.leadFees')} small green />
      </div>
      <p className="mb-2.5 text-label text-ink-40">{t('pro.earn.week')}</p>
      <ul className={`${CARD} overflow-hidden`}>
        {w.jobs.map((j, i) => (
          <li key={j.id} className={'flex items-center gap-3 px-4 py-3.5' + (i < w.jobs.length - 1 ? ' border-b border-line-rule' : '')}>
            <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] bg-avatar text-[12px] font-extrabold text-brand">{j.initials}</span>
            <span className="mr-auto min-w-0">
              <span className="block truncate text-[15px] font-bold text-ink">{j.title[lang]}</span>
              <span className="mt-px block text-[12.5px] font-medium text-ink-40">{when(j.at)}</span>
            </span>
            <span className="text-[15.5px] font-bold text-success">+{formatEuro(j.net)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Screen 12 — profile and standing: vetting documents with their dates. */
function Profile({ onReset }: { onReset: () => void }) {
  const { t } = useLang();
  const rings = [
    { value: '4.9', label: t('pro.stat.rating'), pct: 0.96, color: '#F5A524' },
    { value: '96%', label: t('pro.prof.accepted'), pct: 0.92, color: '#2563EB' },
    { value: '203', label: t('pro.prof.jobs'), pct: 0.88, color: '#15803D' },
  ];
  const standing = [
    { key: 'pro.prof.identity', when: t('pro.prof.identityWhen'), ok: true },
    { key: 'pro.prof.insurance', when: t('pro.prof.insuranceWhen'), ok: true },
    { key: 'pro.prof.gas', when: t('pro.prof.renew'), ok: false },
  ] as const;

  return (
    <div className="px-5 pb-6 pt-5">
      <div className="relative mt-10">
        <span className="absolute -top-10 left-1/2 z-[2] grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border-[5px] border-page bg-avatar text-[23px] font-extrabold text-brand">
          TF
        </span>
        <div className={`${CARD} px-4 pb-4 pt-12 text-center`}>
          <h2 className="flex items-center justify-center gap-1.5 text-[23px] font-extrabold tracking-[-.02em] text-ink">
            Tiago Ferreira
            <Verified size={18} className="text-brand" />
          </h2>
          <p className="mt-0.5 text-[14px] font-medium text-ink-40">{t('pro.prof.line')}</p>
          <div className="mt-3.5 flex rounded-[20px] bg-page px-2 py-3">
            {rings.map((r) => (
              <span key={r.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="relative block h-14 w-14">
                  <svg width="56" height="56" viewBox="0 0 40 40" aria-hidden="true">
                    <circle cx="20" cy="20" r="16.5" fill="none" stroke="#EEF1F7" strokeWidth="4.5" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16.5"
                      fill="none"
                      stroke={r.color}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray="103.7"
                      strokeDashoffset={103.7 * (1 - r.pct)}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                  <b className="absolute inset-0 grid place-items-center text-[13.5px] font-extrabold tracking-[-.02em] text-ink">{r.value}</b>
                </span>
                <span className="text-[11.5px] font-semibold text-ink-40">{r.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-2.5 mt-5 text-label text-ink-40">{t('pro.prof.standing')}</p>
      <ul className={`${CARD} mb-4 overflow-hidden`}>
        {standing.map((s, i) => (
          <li key={s.key} className={'flex items-center gap-3 px-4 py-3.5' + (i < standing.length - 1 ? ' border-b border-line-rule' : '')}>
            <span
              aria-hidden="true"
              className={
                'grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] text-[13px] font-extrabold ' +
                (s.ok ? 'bg-success text-white' : 'border border-warning/40 bg-warning-tint text-warning')
              }
            >
              {s.ok ? '✓' : '!'}
            </span>
            <span className="mr-auto text-[15px] font-semibold text-ink">{t(s.key)}</span>
            <span className={'text-[12.5px] ' + (s.ok ? 'font-medium text-ink-40' : 'font-bold text-warning')}>{s.when}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 rounded-[20px] bg-brand-tint p-4">
        <p className="mb-1 text-[15px] font-bold text-ink-80">{t('pro.prof.pilot')}</p>
        <p className="mb-3 text-[13.5px] font-medium leading-[1.5] text-ink-60">{t('pro.prof.pilotBody')}</p>
        <Link
          to={link('artisanApply')}
          className="inline-flex h-10 items-center rounded-[12px] bg-brand px-4 text-[13.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
        >
          {t('fa.hero.apply')}
        </Link>
      </div>
      <p className="mb-3 text-[12px] font-medium text-ink-40">{t('pro.prof.sample')}</p>
      <button type="button" onClick={onReset} className="text-[13.5px] font-bold text-ink-60 transition hover:text-ink">
        {t('pro.restart')}
      </button>
    </div>
  );
}

function Stat({ value, label, small, green }: { value: string; label: string; small?: boolean; green?: boolean }) {
  return (
    <div className={`${CARD} min-w-0 flex-1 p-3.5`}>
      <div className={(small ? 'text-[17px]' : 'text-[22px]') + ' truncate font-extrabold tracking-[-.02em] ' + (green ? 'text-success' : 'text-ink')}>{value}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-ink-40">{label}</div>
    </div>
  );
}
