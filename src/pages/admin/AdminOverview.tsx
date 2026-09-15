import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GRANTS, can, type Permission } from '../../shared/adminRoles';
import { PILOT_AREAS, TARGETS, reportTargetMs } from '../../shared/pilot';
import { TRADE_SLUGS, isTradeSlug } from '../../routes';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { clock, environment } from '../../lib/console';
import { duration, recordLink, recordOf, targetTone, type AuditEvent, type ConsoleApplication, type ConsoleReport, type ConsoleStats, type Person, type SignOffRequest } from '../../lib/consoleData';
import Sparkline from '../../components/admin/Sparkline';
import { PageHead, Panel, Pill, RoleBadge, TableWrap, td, th } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { AuditRows, type AuditScope } from './AdminAudit';

/**
 * The console's first screen (rev 2.13): six figures with their trend, what
 * needs attention (safety first, then anything past its target, then yours),
 * team activity, the application pipeline, approved supply by trade × area,
 * system status, and what your role lets you do.
 */
const ALL: Permission[] = [
  'applications.work',
  'reports.work',
  'requests.create',
  'applications.decide',
  'requests.review',
  'reports.resolveSafety',
  'work.assign',
  'waitlist.view',
  'data.export',
  'audit.team',
  'audit.all',
  'team.manage',
];

type Attention = { key: string; kind: 'safety' | 'request' | 'report' | 'application'; title: string; sub: string; age: number; target: number; to: string; mine: boolean };

/** Safety first, then sign-offs waiting on a reviewer, then the rest by urgency. */
const weight = (kind: Attention['kind']) => (kind === 'safety' ? 2 : kind === 'request' ? 1 : 0);

function Kpi({ label, value, sub, subTone, children }: { label: string; value: string; sub: string; subTone?: 'ok' | 'warn' | 'crit' | 'muted'; children?: ReactNode }) {
  const tone = { ok: 'text-k-ok', warn: 'text-k-warn', crit: 'text-k-crit', muted: 'text-k-muted' }[subTone ?? 'muted'];
  return (
    <div className="grid min-w-0 content-start gap-px border-b border-r border-k-line px-3 pb-2 pt-2.5">
      <dt className="truncate text-[11.5px] text-k-muted">{label}</dt>
      <dd className="text-[22px] font-semibold tracking-[-.02em]">{value}</dd>
      <dd className={`font-plexmono text-[11px] ${tone}`}>{sub}</dd>
      {children && <dd>{children}</dd>}
    </div>
  );
}

export default function AdminOverview({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh, state } = useAdminSession();
  const [stats, setStats] = useState<ConsoleStats | null>(null);
  const [apps, setApps] = useState<ConsoleApplication[]>([]);
  const [reports, setReports] = useState<ConsoleReport[]>([]);
  const [audit, setAudit] = useState<{ scope: AuditScope; events: AuditEvent[] } | null>(null);
  const [requests, setRequests] = useState<SignOffRequest[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const reviewer = can(admin.role, 'requests.review');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    void api<ConsoleStats>('/api/admin/stats').then((r) => {
      if (!live) return;
      if (r.ok) setStats(r.data);
      else if (r.status === 401) void refresh();
    });
    void api<{ applications: ConsoleApplication[] }>('/api/admin/applications').then((r) => live && r.ok && setApps(r.data.applications));
    void api<{ reports: ConsoleReport[] }>('/api/admin/reports').then((r) => live && r.ok && setReports(r.data.reports));
    void api<{ scope: AuditScope; events: AuditEvent[] }>('/api/admin/audit').then((r) => live && r.ok && setAudit(r.data));
    void api<{ requests: SignOffRequest[] }>('/api/admin/requests').then((r) => live && r.ok && setRequests(r.data.requests));
    void api<{ people: Person[] }>('/api/admin/people').then((r) => live && r.ok && setPeople(r.data.people));
    return () => {
      live = false;
    };
  }, [refresh]);

  const tradeName = (slug: string) => (isTradeSlug(slug) ? t(`trades.${slug}`) : slug);

  // Safety first, then the most overdue, then your own; eight at most.
  const attention: Attention[] = [
    // Sign-offs waiting on a reviewer (rev 2.14).
    ...(reviewer
      ? requests
          .filter((r) => r.status === 'pending')
          .map((r) => ({
            key: `q${r.id}`,
            kind: 'request' as const,
            title: `${r.recordRef} · ${t(`admin.req.action.${r.action}`)}`,
            sub: t('admin.attn.from', { name: r.createdByName }),
            age: now - Date.parse(r.createdAt),
            target: TARGETS.reportCallbackMs,
            to: recordLink(r),
            mine: false,
          }))
      : []),
    ...reports
      .filter((r) => r.status !== 'resolved')
      .map((r) => ({
        key: `r${r.id}`,
        kind: r.category === 'safety' ? ('safety' as const) : ('report' as const),
        title: `${r.reference} · ${t(`report.cat.${r.category}`)}`,
        sub: `${t('admin.col.job')} ${r.jobId} · ${r.phone}`,
        age: now - Date.parse(r.createdAt),
        target: r.calledAt ? TARGETS.reportCallbackMs : reportTargetMs(r.category),
        to: `/admin/reports?open=${r.id}`,
        mine: r.ownerId === admin.id,
      })),
    ...apps
      .filter((a) => a.status === 'received')
      .map((a) => ({
        key: `a${a.id}`,
        kind: 'application' as const,
        title: `${recordOf(a)} · ${a.fullName}`,
        sub: `${tradeName(a.trade)}${a.profile?.areas.length ? ` · ${a.profile.areas.join(', ')}` : ''}`,
        age: now - Date.parse(a.createdAt),
        target: TARGETS.applicantCallMs,
        to: `/admin/applications?open=${a.id}`,
        mine: a.ownerId === admin.id,
      })),
  ]
    .sort((a, b) => weight(b.kind) - weight(a.kind) || b.age / b.target - a.age / a.target || Number(b.mine) - Number(a.mine))
    .slice(0, 8);

  const s = stats;
  const delta = s ? s.applications.new7 - s.applications.prev7 : 0;
  const mine = apps.filter((a) => a.ownerId === admin.id && a.status !== 'approved' && a.status !== 'declined').length + reports.filter((r) => r.ownerId === admin.id && r.status !== 'resolved').length;
  const pipeline: Array<[StringKey, number, string]> = s
    ? [
        ['admin.pipe.waiting', s.applications.byStatus.received, 'bg-[var(--acc)] opacity-60'],
        ['admin.status.called', s.applications.byStatus.called, 'bg-[var(--acc)]'],
        ['admin.status.approved', s.applications.byStatus.approved, 'bg-k-ok'],
        ['admin.status.declined', s.applications.byStatus.declined, 'bg-k-faint'],
      ]
    : [];
  const cells = s?.coverage ?? {};
  const peak = Math.max(1, ...Object.values(cells).flatMap((row) => Object.values(row)));
  const today = new Intl.DateTimeFormat(lang === 'PT' ? 'pt-PT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(now));
  const granted = ALL.filter((p) => GRANTS[admin.role].includes(p));
  const withheld = ALL.filter((p) => !GRANTS[admin.role].includes(p));

  return (
    <>
      <PageHead kicker={today} title={t(admin.role === 'super' ? 'admin.overview.everyone' : 'admin.overview.title')} />

      <dl className="grid grid-cols-2 overflow-hidden rounded-[7px] border-l border-t border-k-line bg-k-panel md:grid-cols-3 xl:grid-cols-6">
        <Kpi
          label={t('admin.kpi.new')}
          value={s ? String(s.applications.new7) : '—'}
          sub={s ? t('admin.kpi.vsPrev', { sign: delta >= 0 ? '+' : '−', n: Math.abs(delta) }) : ''}
          subTone={delta > 0 ? 'ok' : 'muted'}
        >
          {s && <Sparkline values={s.applications.daily} label={t('admin.kpi.new')} />}
        </Kpi>
        <Kpi
          label={t('admin.kpi.waiting')}
          value={s ? String(s.applications.waiting) : '—'}
          sub={s?.applications.oldestWaitingAt ? t('admin.kpi.oldest', { time: duration(now - Date.parse(s.applications.oldestWaitingAt)) }) : t('admin.kpi.none')}
          subTone={s?.applications.oldestWaitingAt ? targetTone(now - Date.parse(s.applications.oldestWaitingAt), TARGETS.applicantCallMs) : 'muted'}
        />
        <Kpi
          label={t('admin.kpi.firstCall')}
          value={s?.applications.medianFirstCallMs != null ? duration(s.applications.medianFirstCallMs) : '—'}
          sub={t('admin.kpi.target48')}
          subTone={s?.applications.medianFirstCallMs != null ? targetTone(s.applications.medianFirstCallMs, TARGETS.applicantCallMs) : 'muted'}
        />
        <Kpi
          label={t('admin.kpi.approval')}
          value={s?.applications.approvalRate != null ? `${Math.round(s.applications.approvalRate * 100)}%` : '—'}
          sub={t('admin.kpi.decided', { n: s?.applications.decided ?? 0 })}
        />
        <Kpi
          label={t('admin.kpi.reports')}
          value={s ? String(s.reports.open) : '—'}
          sub={s ? t('admin.kpi.safety', { n: s.reports.safetyOpen, m: s.reports.overdue }) : ''}
          subTone={s && (s.reports.safetyOpen || s.reports.overdue) ? 'crit' : 'muted'}
        >
          {s && <Sparkline values={s.reports.daily} tone="crit" label={t('admin.kpi.reports')} />}
        </Kpi>
        {s?.waitlist ? (
          <Kpi label={t('admin.kpi.waitlist')} value={String(s.waitlist.total)} sub={t('admin.kpi.week', { n: s.waitlist.new7 })} subTone={s.waitlist.new7 ? 'ok' : 'muted'}>
            <Sparkline values={s.waitlist.daily} label={t('admin.kpi.waitlist')} />
          </Kpi>
        ) : (
          <Kpi label={t('admin.kpi.mine')} value={String(mine)} sub={t('admin.kpi.mineSub')} />
        )}
      </dl>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={t('admin.attn.title')} meta={t('admin.attn.sub')}>
          {attention.length ? (
            <TableWrap>
              <table className="w-full border-collapse">
                <tbody>
                  {attention.map((item) => {
                    const tone = item.kind === 'safety' ? 'crit' : targetTone(item.age, item.target);
                    return (
                      <tr key={item.key} className="hover:bg-k-hover">
                        <td className="w-[12px] border-b border-k-line py-0 pl-2">
                          <span aria-hidden="true" className={'block h-[30px] w-[3px] rounded ' + (tone === 'crit' ? 'bg-k-crit' : tone === 'warn' ? 'bg-k-warn' : 'bg-[var(--acc)]')} />
                        </td>
                        <td className={`${td} whitespace-normal`}>
                          <Link to={item.to} className="font-medium text-k-text hover:underline">
                            {item.title}
                          </Link>
                          <span className="block text-[11.5px] text-k-muted">{item.sub}</span>
                        </td>
                        <td className={td}>
                          <Pill tone={item.kind === 'safety' ? 'crit' : item.kind === 'report' ? 'warn' : item.kind === 'request' ? 'ok' : 'acc'}>
                            {t(item.kind === 'safety' ? 'admin.attn.safety' : item.kind === 'report' ? 'admin.attn.report' : item.kind === 'request' ? 'admin.attn.signoff' : 'admin.attn.toCall')}
                          </Pill>
                        </td>
                        <td className={`${td} text-right font-plexmono text-[12px] ${tone === 'crit' ? 'text-k-crit' : tone === 'warn' ? 'text-k-warn' : 'text-k-muted'}`}>
                          {duration(item.age)}
                        </td>
                        <td className={`${td} font-plexmono text-[11px] text-[var(--acc-text)]`}>{item.mine ? t('admin.tab.mine') : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <p className="px-3 py-4 text-k-muted">{t('admin.attn.empty')}</p>
          )}
        </Panel>

        <Panel
          title={t(audit?.scope === 'all' ? 'admin.overview.activityAll' : audit?.scope === 'team' ? 'admin.overview.activityTeam' : 'admin.overview.activityOwn')}
          actions={
            <Link to="/admin/audit" className="text-[12px] text-[var(--acc-text)] hover:underline">
              {t('admin.overview.seeAll')}
            </Link>
          }
        >
          {audit && !audit.events.length ? <p className="px-3 py-4 text-k-muted">{t('admin.audit.empty')}</p> : <AuditRows events={(audit?.events ?? []).slice(0, 8)} compact />}
        </Panel>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,.8fr)]">
        <Panel title={t('admin.pipe.title')} meta={s ? t('admin.pipe.sub', { n: s.applications.total }) : ''}>
          <div className="grid gap-2 p-3">
            {pipeline.map(([label, n, bar]) => (
              <div key={label} className="grid grid-cols-[92px_minmax(0,1fr)_34px_40px] items-center gap-2 text-[12px]">
                <span className="text-k-text2">{t(label)}</span>
                <span className="h-3 rounded-[3px] bg-k-hover">
                  <span className={`block h-3 rounded-[3px] ${bar}`} style={{ width: `${s && s.applications.total ? (n / s.applications.total) * 100 : 0}%` }} />
                </span>
                <span className="text-right font-plexmono">{n}</span>
                <span className="text-right font-plexmono text-k-muted">{s && s.applications.total ? `${Math.round((n / s.applications.total) * 100)}%` : '—'}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t('admin.cov.title')} meta={t('admin.cov.sub')}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t('admin.col.trade')}</th>
                  {PILOT_AREAS.map((a) => (
                    <th key={a} className={`${th} text-center`}>
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRADE_SLUGS.map((slug) => (
                  <tr key={slug}>
                    <td className={`${td} text-k-text2`}>{tradeName(slug)}</td>
                    {PILOT_AREAS.map((area) => {
                      const n = cells[slug]?.[area] ?? 0;
                      return (
                        <td key={area} className="border-b border-k-line p-[3px] text-center">
                          <span
                            className={'block rounded-[3px] py-1 font-plexmono text-[11.5px] ' + (n ? 'text-k-text' : 'bg-k-crit/15 text-k-crit')}
                            style={n ? { background: `rgb(255 255 255 / ${(0.05 + (n / peak) * 0.18).toFixed(2)})` } : undefined}
                          >
                            {n}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <Panel title={t('admin.sys.title')}>
          <dl className="grid text-[12px]">
            {(
              [
                ['admin.sys.db', s ? t(s.persistent ? 'admin.sys.postgres' : 'admin.sys.memory') : '…', s && !s.persistent ? 'text-k-crit' : 'text-k-ok'],
                ['admin.sys.env', t(`admin.env.${environment()}`), 'text-k-text'],
                ['admin.account.session', state.status === 'signedIn' ? t('admin.sessionEnds', { time: clock(state.sessionEndsAt, lang) }) : '', 'text-k-text'],
              ] as Array<[StringKey, string, string]>
            ).map(([label, value, tone]) => (
              <div key={label} className="flex justify-between gap-2 border-b border-k-line px-3 py-2 last:border-b-0">
                <dt className="text-k-text2">{t(label)}</dt>
                <dd className={`font-plexmono text-[11.5px] ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {reviewer && (
        <Panel title={t('admin.flow.title')} meta={t('admin.flow.sub')}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t('admin.flow.col.person')}</th>
                  <th className={`${th} text-right`}>{t('admin.flow.col.apps')}</th>
                  <th className={`${th} text-right`}>{t('admin.flow.col.reports')}</th>
                  <th className={`${th} text-right`}>{t('admin.flow.col.waiting')}</th>
                  <th className={`${th} text-right`}>{t('admin.flow.col.asked')}</th>
                  <th className={`${th} text-right`}>{t('admin.flow.col.reviewed')}</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => {
                  const apps7 = apps.filter((a) => a.ownerId === p.id && (a.status === 'received' || a.status === 'called')).length;
                  const reports7 = reports.filter((r) => r.ownerId === p.id && r.status !== 'resolved').length;
                  const asked = requests.filter((r) => r.createdBy === p.id);
                  const waiting = asked.filter((r) => r.status === 'pending').length;
                  const reviewed = requests.filter((r) => r.reviewedBy === p.id && now - Date.parse(r.reviewedAt ?? r.createdAt) < 7 * 86_400_000).length;
                  return (
                    <tr key={p.id} className="hover:bg-k-hover">
                      <td className={td}>
                        <span className="inline-flex items-center gap-2">
                          {p.name}
                          <RoleBadge role={p.role} />
                        </span>
                      </td>
                      <td className={`${td} text-right font-plexmono`}>{apps7}</td>
                      <td className={`${td} text-right font-plexmono`}>{reports7}</td>
                      <td className={`${td} text-right font-plexmono ${waiting ? 'text-k-warn' : 'text-k-muted'}`}>{waiting}</td>
                      <td className={`${td} text-right font-plexmono text-k-muted`}>{asked.length}</td>
                      <td className={`${td} text-right font-plexmono text-k-muted`}>{reviewed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <Panel title={t('admin.access.title')} actions={<RoleBadge role={admin.role} />}>
        <div className="grid gap-4 p-3 sm:grid-cols-2">
          <div>
            <h3 className="mb-1.5 font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">{t('admin.access.can')}</h3>
            <ul className="grid gap-1">
              {granted.map((p) => (
                <li key={p} className="flex gap-2 text-[12.5px]">
                  <span aria-hidden="true" className="text-k-ok">
                    ✓
                  </span>
                  {t(`admin.perm.${p}`)}
                </li>
              ))}
            </ul>
          </div>
          {withheld.length > 0 && (
            <div>
              <h3 className="mb-1.5 font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">{t('admin.access.cannot')}</h3>
              <ul className="grid gap-1">
                {withheld.map((p) => (
                  <li key={p} className="flex gap-2 text-[12.5px] text-k-muted">
                    <span aria-hidden="true">—</span>
                    {t(`admin.perm.${p}`)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <p className="border-t border-k-line px-3 py-2 text-[12px] text-k-text2">{t(`admin.roleDesc.${admin.role}`)}</p>
      </Panel>
    </>
  );
}
