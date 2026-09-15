import { useEffect, useState } from 'react';
import { can } from '../../shared/adminRoles';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, stamp } from '../../lib/console';
import { downloadCsv, toCsv, type WaitlistRow } from '../../lib/consoleData';
import { Btn, PageHead, Panel, TableWrap, inputClass, td, th } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { errorKey } from './AdminAuth';

/** /admin/waitlist (rev 2.13) — Supervisors and up. Exports are logged. */
export default function AdminWaitlist({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const [entries, setEntries] = useState<WaitlistRow[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const allowed = can(admin.role, 'waitlist.view');

  useEffect(() => {
    if (!allowed) return;
    let live = true;
    void api<{ entries: WaitlistRow[] }>('/api/admin/waitlist').then((r) => {
      if (!live) return;
      if (r.ok) setEntries(r.data.entries);
      else if (r.status === 401) void refresh();
      else setError(errorKey(r.error, r.status));
    });
    return () => {
      live = false;
    };
  }, [allowed, refresh]);

  if (!allowed) {
    return (
      <div className="grid justify-items-center gap-1.5 rounded-[7px] border border-dashed border-k-line2 bg-k-panel p-10 text-center">
        <h1 className="text-[14px] font-semibold">{t('admin.waitlist.locked')}</h1>
        <p className="max-w-[46ch] text-[12.5px] text-k-muted">{t('admin.locked.teamBody')}</p>
      </div>
    );
  }

  const list = entries ?? [];
  const shown = list.filter((e) => !q.trim() || e.email.toLowerCase().includes(q.trim().toLowerCase()));
  const week = list.filter((e) => now - Date.parse(e.createdAt) < 7 * 86_400_000).length;

  const exportCsv = async () => {
    const r = await api<{ rows: Array<Record<string, unknown>> }>('/api/admin/export', { kind: 'waitlist' });
    if (!r.ok) return setError(errorKey(r.error, r.status));
    downloadCsv(`dashfixe-waitlist-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(r.data.rows));
    setNotice(t('admin.exported', { n: r.data.rows.length }));
  };

  return (
    <>
      <PageHead title={t('admin.waitlist.title')} lead={t('admin.waitlist.lead')}>
        {can(admin.role, 'data.export') && <Btn onClick={() => void exportCsv()}>{t('admin.exportCsv')}</Btn>}
      </PageHead>
      {error && (
        <p role="alert" className="rounded-[5px] border border-k-crit/35 bg-k-crit/10 px-2.5 py-2 text-[12.5px] text-k-crit">
          {t(error)}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-[5px] bg-k-ok/15 px-2.5 py-2 text-[12.5px] text-k-ok">
          {notice}
        </p>
      )}
      <Panel
        title={t('admin.waitlist.total', { n: list.length, m: week })}
        actions={
          <input
            type="search"
            aria-label={t('admin.search')}
            placeholder={t('admin.email')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${inputClass} w-[220px] py-[3px] text-[12.5px]`}
          />
        }
      >
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>{t('admin.email')}</th>
                <th className={th}>{t('admin.col.type')}</th>
                <th className={th}>{t('admin.col.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="hover:bg-k-hover">
                  <td className={`${td} font-plexmono text-[12px]`}>{e.email}</td>
                  <td className={td}>{t(e.userType === 'ARTISAN' ? 'admin.waitlist.artisan' : 'admin.waitlist.homeowner')}</td>
                  <td className={`${td} text-k-text2`} title={stamp(e.createdAt, lang)}>
                    {ago(e.createdAt, lang, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        {entries && !shown.length && <p className="px-3 py-4 text-k-muted">{t('admin.empty')}</p>}
      </Panel>
    </>
  );
}
