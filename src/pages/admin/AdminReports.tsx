import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { can } from '../../shared/adminRoles';
import { reportTargetMs } from '../../shared/pilot';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, stamp } from '../../lib/console';
import { downloadCsv, duration, targetTone, toCsv, type ConsoleReport, type Person, type ReportStatus } from '../../lib/consoleData';
import { Btn, Initials, PageHead, Panel, Pill, TableWrap, inputClass, td, th } from '../../components/admin/ui';
import { ContactButtons, FilterSelect, History, OwnerControl, Tabs } from '../../components/admin/work';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { errorKey } from './AdminAuth';

/**
 * /admin/reports (rev 2.13) — customers' "Report a problem", worked to a call-back
 * target (1 h for safety, 24 h otherwise). Resolving takes a written note; safety
 * reports are resolved by a Supervisor, and only a Supervisor reopens.
 */
type Tab = 'open' | 'called' | 'resolved' | 'mine' | 'all';
const STATUS_TONE: Record<ReportStatus, Parameters<typeof Pill>[0]['tone']> = { open: 'crit', called: 'warn', resolved: 'ok' };

function Drawer({
  report,
  admin,
  people,
  version,
  onUpdate,
  onClose,
}: {
  report: ConsoleReport;
  admin: ConsoleAdmin;
  people: Person[];
  version: number;
  onUpdate: (patch: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const canResolve = report.category !== 'safety' || can(admin.role, 'reports.resolveSafety');
  const canReopen = can(admin.role, 'reports.resolveSafety');

  return (
    <section aria-labelledby="report-drawer-title" className="overflow-hidden rounded-[7px] border border-k-line bg-k-panel lg:sticky lg:top-3">
      <div className="grid gap-2.5 border-b border-k-line p-3">
        <div className="flex items-start gap-2">
          <div className="mr-auto min-w-0">
            <h2 id="report-drawer-title" className={'text-[15px] font-semibold ' + (report.category === 'safety' ? 'text-k-crit' : '')}>
              {t(`report.cat.${report.category}`)}
            </h2>
            <p className="font-plexmono text-[11px] text-k-muted">
              {report.reference} · {t('admin.col.job')} {report.jobId} · {stamp(report.createdAt, lang)}
            </p>
          </div>
          <Pill tone={STATUS_TONE[report.status]}>{t(`admin.rstatus.${report.status}`)}</Pill>
          <button type="button" onClick={onClose} aria-label={t('admin.drawer.close')} className="rounded-[4px] px-1.5 text-k-muted hover:bg-k-hover hover:text-k-text">
            ✕
          </button>
        </div>
        <p className="whitespace-pre-line text-[13px] text-k-text">{report.details ?? <span className="text-k-muted">{t('admin.reports.noDetails')}</span>}</p>
        <ContactButtons phone={report.phone} />
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="text-k-muted">{t('admin.owner.label')}</span>
          <OwnerControl admin={admin} ownerId={report.ownerId} people={people} onChange={(ownerId) => void onUpdate({ ownerId })} />
        </div>
        {report.resolution && <p className="rounded-[5px] bg-k-ok/10 px-2.5 py-2 text-[12.5px] text-k-ok">{t('admin.reports.resolvedBy', { text: report.resolution })}</p>}
      </div>

      <div className="grid gap-2 border-b border-k-line p-3">
        {report.status === 'open' && (
          <Btn variant="primary" className="w-fit" onClick={() => void onUpdate({ status: 'called' })}>
            {t('admin.reports.called')}
          </Btn>
        )}
        {report.status !== 'resolved' &&
          (canResolve ? (
            resolving ? (
              <form
                className="grid gap-1.5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await onUpdate({ status: 'resolved', resolution })) setResolving(false);
                }}
              >
                <label htmlFor={`res-${report.id}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
                  {t('admin.reports.resolution')}
                </label>
                <textarea id={`res-${report.id}`} value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} maxLength={1000} className={`${inputClass} resize-y`} />
                <div className="flex gap-1.5">
                  <Btn type="submit" variant="primary" size="sm">
                    {t('admin.reports.resolveSubmit')}
                  </Btn>
                  <Btn size="sm" onClick={() => setResolving(false)}>
                    {t('admin.cancel')}
                  </Btn>
                </div>
              </form>
            ) : (
              <Btn className="w-fit" onClick={() => setResolving(true)}>
                {t('admin.reports.resolve')}
              </Btn>
            )
          ) : (
            <p className="text-[11.5px] text-k-warn">{t('admin.reports.safetyNote')}</p>
          ))}
        {report.status === 'resolved' && canReopen && (
          <Btn className="w-fit" onClick={() => void onUpdate({ status: 'open' })}>
            {t('admin.act.reopen')}
          </Btn>
        )}
      </div>
      <History record={report.reference} version={version} />
    </section>
  );
}

export default function AdminReports({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const [reports, setReports] = useState<ConsoleReport[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<Tab>('open');
  const [reason, setReason] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [now] = useState(() => Date.now());
  const openId = Number(params.get('open')) || null;

  useEffect(() => {
    let live = true;
    void api<{ reports: ConsoleReport[] }>('/api/admin/reports').then((r) => {
      if (!live) return;
      if (r.ok) setReports(r.data.reports);
      else if (r.status === 401) void refresh();
      else setError(errorKey(r.error, r.status));
    });
    void api<{ people: Person[] }>('/api/admin/people').then((r) => live && r.ok && setPeople(r.data.people));
    return () => {
      live = false;
    };
  }, [refresh]);

  const list = useMemo(() => reports ?? [], [reports]);
  const needle = q.trim().toLowerCase();
  const shown = list
    .filter(
      (r) =>
        (tab === 'all' || (tab === 'mine' ? r.ownerId === admin.id && r.status !== 'resolved' : r.status === tab)) &&
        (!reason || r.category === reason) &&
        (!needle || `${r.reference} ${r.jobId} ${r.phone} ${r.details ?? ''}`.toLowerCase().includes(needle)),
    )
    // Safety first, then the oldest.
    .sort((a, b) => Number(b.category === 'safety') - Number(a.category === 'safety') || a.createdAt.localeCompare(b.createdAt));
  const open = list.find((r) => r.id === openId) ?? null;
  const name = (id: number | null) => people.find((p) => p.id === id)?.name ?? null;

  const select = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('open', String(id));
    else next.delete('open');
    setParams(next, { replace: true });
  };

  const update = async (id: number, patch: Record<string, unknown>) => {
    setError(null);
    setNotice(null);
    const r = await api<{ report: ConsoleReport }>('/api/admin/reports/update', { id, ...patch });
    if (!r.ok) {
      if (r.status === 401) void refresh();
      setError(errorKey(r.error, r.status));
      return false;
    }
    setReports((current) => (current ?? []).map((x) => (x.id === id ? r.data.report : x)));
    setVersion((v) => v + 1);
    return true;
  };

  const exportCsv = async () => {
    const r = await api<{ rows: Array<Record<string, unknown>> }>('/api/admin/export', { kind: 'reports' });
    if (!r.ok) return setError(errorKey(r.error, r.status));
    downloadCsv(`dashfixe-problem-reports-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(r.data.rows));
    setNotice(t('admin.exported', { n: r.data.rows.length }));
  };

  return (
    <>
      <PageHead title={t('admin.reports.title')} lead={t('admin.reports.lead')}>
        {can(admin.role, 'data.export') && <Btn onClick={() => void exportCsv()}>{t('admin.exportCsv')}</Btn>}
      </PageHead>
      <Tabs<Tab>
        label={t('admin.col.status')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'open', label: t('admin.rstatus.open'), count: list.filter((r) => r.status === 'open').length },
          { id: 'called', label: t('admin.rstatus.called'), count: list.filter((r) => r.status === 'called').length },
          { id: 'resolved', label: t('admin.rstatus.resolved'), count: list.filter((r) => r.status === 'resolved').length },
          { id: 'mine', label: t('admin.tab.mine'), count: list.filter((r) => r.ownerId === admin.id && r.status !== 'resolved').length },
          { id: 'all', label: t('admin.tab.all'), count: list.length },
        ]}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterSelect label={t('admin.col.reason')} value={reason} onChange={setReason}>
          <option value="">{t('admin.filter.any')}</option>
          {(['safety', 'late', 'price', 'quality', 'damage', 'other'] as const).map((c) => (
            <option key={c} value={c}>
              {t(`report.cat.${c}`)}
            </option>
          ))}
        </FilterSelect>
        <input
          type="search"
          aria-label={t('admin.search')}
          placeholder={t('admin.reports.searchPh')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${inputClass} ml-auto w-[240px] py-[3px] text-[12.5px]`}
        />
      </div>
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

      <div className={'grid items-start gap-3 ' + (open ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : '')}>
        <Panel title={`${t('admin.reports.title')} · ${shown.length}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${th} w-[12px] px-0`}>
                    <span className="sr-only">{t('admin.attn.safety')}</span>
                  </th>
                  <th className={th}>{t('admin.col.ref')}</th>
                  <th className={th}>{t('admin.col.reason')}</th>
                  <th className={th}>{t('admin.col.details')}</th>
                  <th className={th}>{t('admin.col.customer')}</th>
                  <th className={th}>{t('admin.col.sent')}</th>
                  <th className={th}>{t('admin.col.sla')}</th>
                  <th className={th}>{t('admin.col.status')}</th>
                  <th className={th}>{t('admin.col.owner')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const age = now - Date.parse(r.createdAt);
                  const target = reportTargetMs(r.category);
                  const waiting = r.status === 'open' && !r.calledAt;
                  const tone = waiting ? targetTone(age, target) : null;
                  const owner = name(r.ownerId);
                  return (
                    <tr key={r.id} className={r.id === openId ? 'bg-[var(--acc-soft)]' : 'hover:bg-k-hover'}>
                      <td className="border-b border-k-line py-0 pl-2">
                        <span aria-hidden="true" className={'block h-[26px] w-[3px] rounded ' + (r.category === 'safety' && r.status !== 'resolved' ? 'bg-k-crit' : tone === 'warn' ? 'bg-k-warn' : 'bg-k-line2')} />
                      </td>
                      <td className={`${td} font-plexmono text-[12px]`}>{r.reference}</td>
                      <td className={td}>
                        <button type="button" onClick={() => select(r.id)} className={'text-left font-medium hover:underline ' + (r.category === 'safety' ? 'text-k-crit' : 'text-k-text')}>
                          {t(`report.cat.${r.category}`)}
                        </button>
                      </td>
                      <td className={`${td} max-w-[260px] truncate text-k-text2`}>{r.details ?? '—'}</td>
                      <td className={`${td} font-plexmono text-[12px]`}>{r.phone}</td>
                      <td className={`${td} text-k-text2`} title={stamp(r.createdAt, lang)}>
                        {ago(r.createdAt, lang, now)}
                      </td>
                      <td className={`${td} font-plexmono text-[12px] ${tone === 'crit' ? 'text-k-crit' : tone === 'warn' ? 'text-k-warn' : 'text-k-muted'}`}>
                        {waiting ? (age > target ? t('admin.target.overdue', { time: duration(age - target) }) : t('admin.target.left', { time: duration(target - age) })) : '—'}
                      </td>
                      <td className={td}>
                        <Pill tone={STATUS_TONE[r.status]}>{t(`admin.rstatus.${r.status}`)}</Pill>
                      </td>
                      <td className={td}>
                        {owner ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Initials name={owner} mine={r.ownerId === admin.id} />
                            {owner}
                          </span>
                        ) : (
                          <span className="text-k-muted">{t('admin.owner.none')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          {reports && !shown.length && <p className="px-3 py-4 text-k-muted">{t('admin.empty')}</p>}
        </Panel>
        {open && (
          <Drawer key={open.id} report={open} admin={admin} people={people} version={version} onUpdate={(patch) => update(open.id, patch)} onClose={() => select(null)} />
        )}
      </div>
    </>
  );
}
