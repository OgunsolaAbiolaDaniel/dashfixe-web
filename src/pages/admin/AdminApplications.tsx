import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { can } from '../../shared/adminRoles';
import { PILOT_AREAS, TARGETS } from '../../shared/pilot';
import { TRADE_SLUGS, isTradeSlug } from '../../routes';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, stamp } from '../../lib/console';
import { APPLICATION_STATUSES, downloadCsv, duration, recordOf, targetTone, toCsv, type ApplicationStatus, type ConsoleApplication, type Person } from '../../lib/consoleData';
import { Btn, Initials, PageHead, Panel, Pill, TableWrap, inputClass, td, th } from '../../components/admin/ui';
import { ContactButtons, FilterSelect, History, OwnerControl, Tabs } from '../../components/admin/work';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { errorKey } from './AdminAuth';

/**
 * /admin/applications (rev 2.13) — the Dashfixe Pro applications, worked in the
 * console: status tabs, filters, search, bulk assign and call, and a detail
 * panel with contact, answers, owner, note, decision and history. Decisions are a
 * Supervisor's; the server refuses them from an Admin.
 */
type Tab = 'all' | 'mine' | ApplicationStatus;

const STATUS_TONE: Record<ApplicationStatus, Parameters<typeof Pill>[0]['tone']> = { received: 'acc', called: 'warn', approved: 'ok', declined: 'muted' };
const EXPERIENCE: Record<string, StringKey> = { '0-2': 'pro.apply.exp.a', '3-5': 'pro.apply.exp.b', '6-10': 'pro.apply.exp.c', '10+': 'pro.apply.exp.d' };

function useTradeLabel() {
  const { t } = useLang();
  return (slug: string) => (isTradeSlug(slug) ? t(`trades.${slug}`) : slug);
}

function Drawer({
  app,
  admin,
  people,
  version,
  onUpdate,
  onClose,
}: {
  app: ConsoleApplication;
  admin: ConsoleAdmin;
  people: Person[];
  version: number;
  onUpdate: (patch: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const trade = useTradeLabel();
  const [view, setView] = useState<'answers' | 'history'>('answers');
  const [note, setNote] = useState(app.note ?? '');
  const decides = can(admin.role, 'applications.decide');
  const isDecided = app.status === 'approved' || app.status === 'declined';
  const p = app.profile;
  const facts: Array<[StringKey, string]> = p
    ? [
        ['admin.d.trades', [app.trade, ...p.trades].map(trade).join(', ')],
        ['admin.d.experience', EXPERIENCE[p.experience] ? t(EXPERIENCE[p.experience]!) : p.experience],
        ['admin.d.areas', p.areas.join(', ')],
        ['admin.d.hours', p.availability.map((a) => t(`pro.apply.av.${a}` as StringKey)).join(', ')],
        ['admin.d.licences', p.licences.filter((l) => l !== 'none').map((l) => t(`pro.apply.lic.${l}` as StringKey)).join(', ') || t('admin.d.none')],
        ['admin.d.transport', t(p.transport ? 'admin.d.yes' : 'admin.d.no')],
        ['admin.d.insurance', t(p.insurance ? 'admin.d.yes' : 'admin.d.no')],
      ]
    : [['admin.d.trades', trade(app.trade)]];

  return (
    <section aria-labelledby="app-drawer-title" className="overflow-hidden rounded-[7px] border border-k-line bg-k-panel lg:sticky lg:top-3">
      <div className="grid gap-2.5 border-b border-k-line p-3">
        <div className="flex items-start gap-2">
          <div className="mr-auto min-w-0">
            <h2 id="app-drawer-title" className="text-[15px] font-semibold">
              {app.fullName}
            </h2>
            <p className="font-plexmono text-[11px] text-k-muted">
              {recordOf(app)} · {stamp(app.createdAt, lang)}
            </p>
          </div>
          <Pill tone={STATUS_TONE[app.status]}>{t(`admin.status.${app.status}`)}</Pill>
          <button type="button" onClick={onClose} aria-label={t('admin.drawer.close')} className="rounded-[4px] px-1.5 text-k-muted hover:bg-k-hover hover:text-k-text">
            ✕
          </button>
        </div>
        <ContactButtons phone={app.phone} email={app.email} />
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="text-k-muted">{t('admin.owner.label')}</span>
          <OwnerControl admin={admin} ownerId={app.ownerId} people={people} onChange={(ownerId) => void onUpdate({ ownerId })} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-k-line px-2">
        {(['answers', 'history'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={'-mb-px border-b-2 px-2 py-2 text-[12px] ' + (view === v ? 'border-[var(--acc)] text-k-text' : 'border-transparent text-k-muted hover:text-k-text')}
          >
            {t(v === 'answers' ? 'admin.drawer.answers' : 'admin.drawer.history')}
          </button>
        ))}
      </div>

      {view === 'answers' ? (
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1.5 p-3 text-[12.5px]">
          {facts.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-k-muted">{t(key)}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
          <dt className="text-k-muted">{t('admin.email')}</dt>
          <dd className="break-all font-plexmono text-[11.5px]">{app.email}</dd>
          {!p && <dd className="col-span-2 text-[12px] text-k-muted">{t('admin.shortForm')}</dd>}
        </dl>
      ) : (
        <History record={recordOf(app)} version={version} />
      )}

      <div className="grid gap-1.5 border-t border-k-line p-3">
        <label htmlFor={`note-${app.id}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
          {t('admin.note.label')}
        </label>
        <textarea
          id={`note-${app.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          className={`${inputClass} resize-y`}
        />
        {note.trim() !== (app.note ?? '') && (
          <Btn size="sm" className="w-fit" onClick={() => void onUpdate({ note })}>
            {t('admin.note.save')}
          </Btn>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-k-line p-3">
        {app.status === 'received' && (
          <Btn variant={decides ? 'default' : 'primary'} onClick={() => void onUpdate({ status: 'called' })}>
            {t('admin.act.called')}
          </Btn>
        )}
        {decides && !isDecided && (
          <>
            <Btn variant="primary" onClick={() => void onUpdate({ status: 'approved' })}>
              {t('admin.act.approve')}
            </Btn>
            <Btn variant="danger" onClick={() => void onUpdate({ status: 'declined' })}>
              {t('admin.act.decline')}
            </Btn>
          </>
        )}
        {decides && isDecided && (
          <Btn onClick={() => void onUpdate({ status: 'called' })}>{t('admin.act.reopen')}</Btn>
        )}
        {!decides && <p className="basis-full text-[11.5px] text-k-warn">{t('admin.act.needsSupervisor')}</p>}
      </div>
    </section>
  );
}

export default function AdminApplications({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const trade = useTradeLabel();
  const { refresh } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState<ConsoleApplication[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [filters, setFilters] = useState({ trade: '', area: '', owner: '', q: '' });
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [error, setError] = useState<StringKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [now] = useState(() => Date.now());
  const openId = Number(params.get('open')) || null;

  useEffect(() => {
    let live = true;
    void api<{ applications: ConsoleApplication[] }>('/api/admin/applications').then((r) => {
      if (!live) return;
      if (r.ok) setApps(r.data.applications);
      else if (r.status === 401) void refresh();
      else setError(errorKey(r.error, r.status));
    });
    void api<{ people: Person[] }>('/api/admin/people').then((r) => live && r.ok && setPeople(r.data.people));
    return () => {
      live = false;
    };
  }, [refresh]);

  const list = useMemo(() => apps ?? [], [apps]);
  const q = filters.q.trim().toLowerCase();
  const shown = list.filter(
    (a) =>
      (tab === 'all' || (tab === 'mine' ? a.ownerId === admin.id : a.status === tab)) &&
      (!filters.trade || a.trade === filters.trade || !!a.profile?.trades.includes(filters.trade)) &&
      (!filters.area || !!a.profile?.areas.includes(filters.area)) &&
      (!filters.owner || (filters.owner === 'none' ? a.ownerId === null : a.ownerId === Number(filters.owner))) &&
      (!q || `${a.fullName} ${a.phone} ${a.email} ${a.reference ?? ''}`.toLowerCase().includes(q)),
  );
  const open = list.find((a) => a.id === openId) ?? null;
  const count = (s: ApplicationStatus) => list.filter((a) => a.status === s).length;
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
    const r = await api<{ application: ConsoleApplication }>('/api/admin/applications/update', { id, ...patch });
    if (!r.ok) {
      if (r.status === 401) void refresh();
      setError(errorKey(r.error, r.status));
      return false;
    }
    setApps((current) => (current ?? []).map((a) => (a.id === id ? r.data.application : a)));
    setVersion((v) => v + 1);
    return true;
  };

  const bulk = async (patch: Record<string, unknown>, only?: (a: ConsoleApplication) => boolean) => {
    for (const a of list.filter((x) => picked.has(x.id) && (!only || only(x)))) await update(a.id, patch);
    setPicked(new Set());
  };

  const exportCsv = async () => {
    const r = await api<{ rows: Array<Record<string, unknown>> }>('/api/admin/export', { kind: 'applications' });
    if (!r.ok) return setError(errorKey(r.error, r.status));
    downloadCsv(`dashfixe-applications-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(r.data.rows));
    setNotice(t('admin.exported', { n: r.data.rows.length }));
  };

  const allShownPicked = shown.length > 0 && shown.every((a) => picked.has(a.id));

  return (
    <>
      <PageHead title={t('admin.apps.title')} lead={t('admin.apps.lead')}>
        {can(admin.role, 'data.export') && <Btn onClick={() => void exportCsv()}>{t('admin.exportCsv')}</Btn>}
      </PageHead>

      <Tabs<Tab>
        label={t('admin.col.status')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: t('admin.tab.all'), count: list.length },
          ...APPLICATION_STATUSES.map((s) => ({ id: s as Tab, label: t(`admin.status.${s}`), count: count(s) })),
          { id: 'mine', label: t('admin.tab.mine'), count: list.filter((a) => a.ownerId === admin.id).length },
        ]}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterSelect label={t('admin.filter.trade')} value={filters.trade} onChange={(v) => setFilters({ ...filters, trade: v })}>
          <option value="">{t('admin.filter.any')}</option>
          {TRADE_SLUGS.map((s) => (
            <option key={s} value={s}>
              {trade(s)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t('admin.filter.area')} value={filters.area} onChange={(v) => setFilters({ ...filters, area: v })}>
          <option value="">{t('admin.filter.any')}</option>
          {PILOT_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t('admin.filter.owner')} value={filters.owner} onChange={(v) => setFilters({ ...filters, owner: v })}>
          <option value="">{t('admin.filter.any')}</option>
          <option value="none">{t('admin.owner.none')}</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <input
          type="search"
          aria-label={t('admin.search')}
          placeholder={t('admin.apps.searchPh')}
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className={`${inputClass} ml-auto w-[240px] py-[3px] text-[12.5px]`}
        />
      </div>

      {picked.size > 0 && (
        <div role="group" aria-label={t('admin.bulk.selected', { n: picked.size })} className="flex flex-wrap items-center gap-2 rounded-[6px] border border-[var(--acc-line)] bg-[var(--acc-soft)] px-2.5 py-1.5 text-[12.5px]">
          <strong className="font-semibold">{t('admin.bulk.selected', { n: picked.size })}</strong>
          {can(admin.role, 'work.assign') && (
            <FilterSelect label={t('admin.bulk.assign')} value="" onChange={(v) => void bulk({ ownerId: v === 'none' ? null : Number(v) })}>
              <option value="" disabled>
                …
              </option>
              <option value="none">{t('admin.owner.none')}</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FilterSelect>
          )}
          <Btn size="sm" onClick={() => void bulk({ status: 'called' }, (a) => a.status === 'received')}>
            {t('admin.bulk.called')}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setPicked(new Set())}>
            {t('admin.bulk.clear')}
          </Btn>
        </div>
      )}

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
        <Panel title={`${t('admin.apps.title')} · ${shown.length}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>
                    <input
                      type="checkbox"
                      aria-label={t('admin.col.selectAll')}
                      checked={allShownPicked}
                      onChange={() => setPicked(allShownPicked ? new Set() : new Set(shown.map((a) => a.id)))}
                      className="accent-[var(--acc)]"
                    />
                  </th>
                  <th className={th}>{t('admin.col.ref')}</th>
                  <th className={th}>{t('admin.col.applicant')}</th>
                  <th className={th}>{t('admin.col.trade')}</th>
                  <th className={th}>{t('admin.col.areas')}</th>
                  <th className={th}>{t('admin.col.sent')}</th>
                  <th className={`${th} text-right`}>{t('admin.col.waiting')}</th>
                  <th className={th}>{t('admin.col.status')}</th>
                  <th className={th}>{t('admin.col.owner')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => {
                  const age = now - Date.parse(a.createdAt);
                  const tone = a.status === 'received' ? targetTone(age, TARGETS.applicantCallMs) : null;
                  const owner = name(a.ownerId);
                  return (
                    <tr key={a.id} className={a.id === openId ? 'bg-[var(--acc-soft)]' : 'hover:bg-k-hover'}>
                      <td className={td}>
                        <input
                          type="checkbox"
                          aria-label={t('admin.col.select', { name: a.fullName })}
                          checked={picked.has(a.id)}
                          onChange={() =>
                            setPicked((s) => {
                              const next = new Set(s);
                              if (next.has(a.id)) next.delete(a.id);
                              else next.add(a.id);
                              return next;
                            })
                          }
                          className="accent-[var(--acc)]"
                        />
                      </td>
                      <td className={`${td} font-plexmono text-[12px]`}>{recordOf(a)}</td>
                      <td className={td}>
                        <button type="button" onClick={() => select(a.id)} className="text-left font-medium text-k-text hover:underline">
                          {a.fullName}
                        </button>
                        <span className="block font-plexmono text-[11px] text-k-muted">{a.phone}</span>
                      </td>
                      <td className={td}>{trade(a.trade)}</td>
                      <td className={`${td} text-k-text2`}>{a.profile?.areas.join(', ') || '—'}</td>
                      <td className={`${td} text-k-text2`} title={stamp(a.createdAt, lang)}>
                        {ago(a.createdAt, lang, now)}
                      </td>
                      <td className={`${td} text-right font-plexmono text-[12px] ${tone === 'crit' ? 'text-k-crit' : tone === 'warn' ? 'text-k-warn' : 'text-k-muted'}`}>
                        {tone ? duration(age) : '—'}
                      </td>
                      <td className={td}>
                        <Pill tone={STATUS_TONE[a.status]}>{t(`admin.status.${a.status}`)}</Pill>
                      </td>
                      <td className={td}>
                        {owner ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Initials name={owner} mine={a.ownerId === admin.id} />
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
          {apps && !shown.length && <p className="px-3 py-4 text-k-muted">{t('admin.empty')}</p>}
        </Panel>

        {open && (
          <Drawer
            key={open.id}
            app={open}
            admin={admin}
            people={people}
            version={version}
            onUpdate={(patch) => update(open.id, patch)}
            onClose={() => select(null)}
          />
        )}
      </div>
    </>
  );
}
