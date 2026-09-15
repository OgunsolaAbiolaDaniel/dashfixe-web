import { useEffect, useState } from 'react';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { stamp } from '../../lib/console';
import { ACTION_LABELS, type AuditEvent } from '../../lib/consoleData';
import { PageHead, Panel, RoleBadge, TableWrap, td, th } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * The audit log (rev 2.12): the Super admin sees everything, a Supervisor the
 * team (everyone but the Super admin), an Admin their own actions. The server
 * decides the scope; this page just says which one it got.
 */
export type AuditScope = 'all' | 'team' | 'own';
const ACTIONS = ACTION_LABELS;

const FILTERS: Array<[string, StringKey, (action: string) => boolean]> = [
  ['all', 'admin.audit.filter.all', () => true],
  ['work', 'admin.audit.filter.work', (a) => a.startsWith('application.') || a.startsWith('report.')],
  ['signins', 'admin.audit.filter.signins', (a) => a === 'setup' || a.startsWith('signin')],
  ['team', 'admin.audit.filter.team', (a) => a.startsWith('team.')],
  ['passwords', 'admin.audit.filter.passwords', (a) => a === 'password.change' || a === 'team.password'],
  ['requests', 'admin.audit.filter.requests', (a) => a.startsWith('request.')],
  ['exports', 'admin.audit.filter.exports', (a) => a === 'data.export'],
];

export function AuditRows({ events, compact = false }: { events: AuditEvent[]; compact?: boolean }) {
  const { t, lang } = useLang();
  return (
    <TableWrap>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>{t('admin.audit.col.when')}</th>
            <th className={th}>{t('admin.audit.col.who')}</th>
            {!compact && <th className={th}>{t('admin.team.col.role')}</th>}
            <th className={th}>{t('admin.audit.col.action')}</th>
            <th className={th}>{t('admin.audit.col.record')}</th>
            {!compact && <th className={th}>{t('admin.audit.col.detail')}</th>}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-k-hover">
              <td className={`${td} font-plexmono text-[12px] text-k-text2`}>{stamp(e.at, lang)}</td>
              <td className={td}>{e.adminName ?? <span className="text-k-muted">{t('admin.audit.system')}</span>}</td>
              {!compact && <td className={td}>{e.role ? <RoleBadge role={e.role} /> : <span className="text-k-muted">—</span>}</td>}
              <td className={td}>
                <span className={e.action === 'signin.locked' ? 'text-k-warn' : ''}>{ACTIONS[e.action] ? t(ACTIONS[e.action]!) : e.action}</span>
                {!compact && <span className="ml-2 font-plexmono text-[11px] text-k-muted">{e.action}</span>}
              </td>
              <td className={`${td} font-plexmono text-[12px]`}>{e.record ?? '—'}</td>
              {!compact && <td className={`${td} text-k-text2`}>{e.detail ?? ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export default function AdminAudit({ admin }: { admin: ConsoleAdmin }) {
  const { t } = useLang();
  const { refresh } = useAdminSession();
  const [data, setData] = useState<{ scope: AuditScope; events: AuditEvent[] } | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let live = true;
    void api<{ scope: AuditScope; events: AuditEvent[] }>('/api/admin/audit').then((r) => {
      if (!live) return;
      if (r.ok) setData(r.data);
      else if (r.status === 401) void refresh();
    });
    return () => {
      live = false;
    };
  }, [admin.id, refresh]);

  const scope = data?.scope ?? 'own';
  const test = FILTERS.find(([id]) => id === filter)![2];
  const shown = (data?.events ?? []).filter((e) => test(e.action));

  return (
    <>
      <PageHead
        title={t(scope === 'all' ? 'admin.nav.audit' : 'admin.nav.activity')}
        lead={t(scope === 'all' ? 'admin.audit.leadAll' : scope === 'team' ? 'admin.audit.leadTeam' : 'admin.audit.leadOwn')}
      />
      <div role="group" aria-label={t('admin.audit.filters')} className="flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={
              'rounded-[5px] border px-2.5 py-1 text-[12.5px] transition ' +
              (filter === id ? 'border-[var(--acc-line)] bg-[var(--acc-soft)] text-k-text' : 'border-k-line2 text-k-text2 hover:bg-k-hover')
            }
          >
            {t(label)}
          </button>
        ))}
      </div>
      <Panel title={t('admin.audit.count', { n: shown.length })}>
        {data && !shown.length ? <p className="px-3 py-4 text-k-muted">{t('admin.audit.empty')}</p> : <AuditRows events={shown} />}
      </Panel>
    </>
  );
}
