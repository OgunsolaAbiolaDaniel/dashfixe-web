import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GRANTS, can, type Permission } from '../../shared/adminRoles';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { PageHead, Panel, RoleBadge } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import { AuditRows, type AuditEvent, type AuditScope } from './AdminAudit';

/**
 * The console's first screen (rev 2.12): what your role lets you do (straight
 * from shared/adminRoles.ts — the same table the server enforces), the team at a
 * glance for the Super admin, and recent activity in your scope. The work
 * screens (applications, reports) arrive in the next PR.
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

export default function AdminOverview({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const [audit, setAudit] = useState<{ scope: AuditScope; events: AuditEvent[] } | null>(null);
  const [team, setTeam] = useState<ConsoleAdmin[] | null>(null);
  const manages = can(admin.role, 'team.manage');

  useEffect(() => {
    let live = true;
    void api<{ scope: AuditScope; events: AuditEvent[] }>('/api/admin/audit').then((r) => {
      if (!live) return;
      if (r.ok) setAudit(r.data);
      else if (r.status === 401) void refresh();
    });
    if (manages) void api<{ admins: ConsoleAdmin[] }>('/api/admin/team').then((r) => live && r.ok && setTeam(r.data.admins));
    return () => {
      live = false;
    };
  }, [manages, refresh]);

  const granted = ALL.filter((p) => GRANTS[admin.role].includes(p));
  const withheld = ALL.filter((p) => !GRANTS[admin.role].includes(p));
  const today = new Intl.DateTimeFormat(lang === 'PT' ? 'pt-PT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const stats = team && [
    ['admin.overview.people', team.length, ''],
    ['admin.overview.active', team.filter((a) => !a.disabled && !a.mustChange).length, 'text-k-ok'],
    ['admin.overview.pending', team.filter((a) => a.mustChange && !a.disabled).length, 'text-[var(--acc-text)]'],
    ['admin.overview.blocked', team.filter((a) => a.disabled || a.locked).length, 'text-k-warn'],
  ] as const;

  return (
    <>
      <PageHead kicker={today} title={t(admin.role === 'super' ? 'admin.overview.everyone' : 'admin.overview.title')} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title={t('admin.access.title')} actions={<RoleBadge role={admin.role} />}>
          <div className="grid gap-4 p-3 sm:grid-cols-2">
            <div>
              <h3 className="mb-1.5 font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">{t('admin.access.can')}</h3>
              <ul className="grid gap-1">
                {granted.map((p) => (
                  <li key={p} className="flex gap-2 text-[12.5px]">
                    <span aria-hidden="true" className="text-k-ok">✓</span>
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

        {stats ? (
          <Panel
            title={t('admin.overview.team')}
            actions={
              <Link to="/admin/team" className="text-[12px] text-[var(--acc-text)] hover:underline">
                {t('admin.overview.manage')}
              </Link>
            }
          >
            <dl className="grid grid-cols-2">
              {stats.map(([label, n, tone], i) => (
                <div key={label} className={'grid gap-0.5 px-3 py-2.5 ' + (i % 2 === 0 ? 'border-r border-k-line ' : '') + (i < 2 ? 'border-b border-k-line' : '')}>
                  <dt className="text-[11.5px] text-k-muted">{t(label)}</dt>
                  <dd className={`text-[22px] font-semibold tracking-[-.02em] ${tone}`}>{n}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ) : (
          <Panel title={t('admin.overview.work')}>
            <p className="px-3 py-2.5 text-[12.5px] text-k-text2">{t('admin.overview.workBody')}</p>
            <a href="/ops" className="block border-t border-k-line px-3 py-2 text-[12.5px] text-[var(--acc-text)] hover:underline">
              {t('admin.overview.openOps')}
            </a>
          </Panel>
        )}
      </div>

      <Panel
        title={t(audit?.scope === 'all' ? 'admin.overview.activityAll' : audit?.scope === 'team' ? 'admin.overview.activityTeam' : 'admin.overview.activityOwn')}
        actions={
          <Link to="/admin/audit" className="text-[12px] text-[var(--acc-text)] hover:underline">
            {t('admin.overview.seeAll')}
          </Link>
        }
      >
        {audit && !audit.events.length ? (
          <p className="px-3 py-4 text-k-muted">{t('admin.audit.empty')}</p>
        ) : (
          <AuditRows events={(audit?.events ?? []).slice(0, 8)} compact />
        )}
      </Panel>

      {stats && (
        <Panel title={t('admin.overview.work')}>
          <p className="px-3 py-2.5 text-[12.5px] text-k-text2">{t('admin.overview.workBody')}</p>
          <a href="/ops" className="block border-t border-k-line px-3 py-2 text-[12.5px] text-[var(--acc-text)] hover:underline">
            {t('admin.overview.openOps')}
          </a>
        </Panel>
      )}
    </>
  );
}
