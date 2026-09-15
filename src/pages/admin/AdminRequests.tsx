import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { can } from '../../shared/adminRoles';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, stamp } from '../../lib/console';
import { REQUEST_STATUSES, recordLink, type Person, type RequestStatus, type SignOffRequest } from '../../lib/consoleData';
import { Btn, PageHead, Panel, Pill, TableWrap, inputClass, td, th } from '../../components/admin/ui';
import { FilterSelect, Tabs } from '../../components/admin/work';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { errorKey } from './AdminAuth';

/**
 * /admin/requests (rev 2.14) — supervisor sign-off.
 * Supervisors and the Super admin: the queue — approve (which applies it) or send
 * back with a reason, right from the list. Admins: what they asked, and the answer.
 */
type Tab = RequestStatus | 'all';
const TONE: Record<RequestStatus, Parameters<typeof Pill>[0]['tone']> = { pending: 'acc', approved: 'ok', returned: 'warn', withdrawn: 'muted' };

export default function AdminRequests({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const reviewer = can(admin.role, 'requests.review');
  const [requests, setRequests] = useState<SignOffRequest[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [person, setPerson] = useState('');
  const [returning, setReturning] = useState<{ id: number; note: string } | null>(null);
  const [error, setError] = useState<StringKey | null>(null);
  const [version, setVersion] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    void api<{ requests: SignOffRequest[] }>('/api/admin/requests').then((r) => {
      if (!live) return;
      if (r.ok) setRequests(r.data.requests);
      else if (r.status === 401) void refresh();
      else setError(errorKey(r.error, r.status));
    });
    return () => {
      live = false;
    };
  }, [refresh, version]);

  useEffect(() => {
    let live = true;
    void api<{ people: Person[] }>('/api/admin/people').then((r) => live && r.ok && setPeople(r.data.people));
    return () => {
      live = false;
    };
  }, []);

  const review = useCallback(async (id: number, decision: 'approve' | 'return', note?: string) => {
    setError(null);
    const r = await api('/api/admin/requests/review', { id, decision, note: note ?? null });
    if (!r.ok) {
      setError(r.error === 'note_required' ? 'admin.err.note_required' : r.error === 'not_pending' ? 'admin.err.not_pending' : errorKey(r.error, r.status));
      return;
    }
    setReturning(null);
    setVersion((v) => v + 1);
  }, []);

  const withdraw = async (id: number) => {
    const r = await api('/api/admin/requests/withdraw', { id });
    if (!r.ok) return setError(errorKey(r.error, r.status));
    setVersion((v) => v + 1);
  };

  const list = requests ?? [];
  const shown = list.filter((r) => (tab === 'all' || r.status === tab) && (!person || r.createdBy === Number(person)));

  return (
    <>
      <PageHead title={t('admin.req.title')} lead={t(reviewer ? 'admin.req.leadAll' : 'admin.req.leadOwn')} />
      <div className="flex flex-wrap items-center gap-2">
        <Tabs<Tab>
          label={t('admin.col.status')}
          value={tab}
          onChange={setTab}
          tabs={[
            ...REQUEST_STATUSES.map((s) => ({ id: s as Tab, label: t(`admin.req.status.${s}`), count: list.filter((r) => r.status === s).length })),
            { id: 'all', label: t('admin.tab.all'), count: list.length },
          ]}
        />
        {reviewer && (
          <span className="ml-auto">
            <FilterSelect label={t('admin.req.col.from')} value={person} onChange={setPerson}>
              <option value="">{t('admin.filter.any')}</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FilterSelect>
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-[5px] border border-k-crit/35 bg-k-crit/10 px-2.5 py-2 text-[12.5px] text-k-crit">
          {t(error)}
        </p>
      )}
      <Panel title={`${t('admin.req.title')} · ${shown.length}`}>
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>{t('admin.req.col.record')}</th>
                <th className={th}>{t('admin.req.col.asks')}</th>
                <th className={th}>{t('admin.req.col.from')}</th>
                <th className={th}>{t('admin.col.sent')}</th>
                <th className={th}>{t('admin.req.col.note')}</th>
                <th className={th}>{t('admin.col.status')}</th>
                <th className={th}>{t('admin.req.col.reviewed')}</th>
                <th className={th}>
                  <span className="sr-only">{t('admin.audit.col.action')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="align-top hover:bg-k-hover">
                  <td className={`${td} font-plexmono text-[12px]`}>
                    <Link to={recordLink(r)} className="text-[var(--acc-text)] hover:underline">
                      {r.recordRef}
                    </Link>
                  </td>
                  <td className={td}>{t(`admin.req.action.${r.action}`)}</td>
                  <td className={td}>{r.createdByName}</td>
                  <td className={`${td} text-k-text2`} title={stamp(r.createdAt, lang)}>
                    {ago(r.createdAt, lang, now)}
                  </td>
                  <td className={`${td} max-w-[280px] whitespace-normal text-k-text2`}>
                    {r.payload && <span className="block">{t('admin.req.proposed', { text: r.payload })}</span>}
                    {r.note ?? (r.payload ? '' : '—')}
                  </td>
                  <td className={td}>
                    <Pill tone={TONE[r.status]}>{t(`admin.req.status.${r.status}`)}</Pill>
                  </td>
                  <td className={`${td} whitespace-normal text-k-text2`}>
                    {r.reviewedByName ? (
                      <>
                        {r.reviewedByName}
                        {r.reviewNote && <span className="block text-[11.5px] text-k-muted">“{r.reviewNote}”</span>}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`${td} whitespace-normal`}>
                    {r.status === 'pending' && reviewer && r.createdBy !== admin.id &&
                      (returning?.id === r.id ? (
                        <form
                          className="grid min-w-[220px] gap-1.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void review(r.id, 'return', returning.note);
                          }}
                        >
                          <label htmlFor={`why-${r.id}`} className="sr-only">
                            {t('admin.req.reason')}
                          </label>
                          <textarea
                            id={`why-${r.id}`}
                            placeholder={t('admin.req.reason')}
                            value={returning.note}
                            onChange={(e) => setReturning({ id: r.id, note: e.target.value })}
                            rows={2}
                            className={`${inputClass} resize-y text-[12px]`}
                          />
                          <div className="flex gap-1.5">
                            <Btn type="submit" size="sm" variant="danger">
                              {t('admin.req.returnSubmit')}
                            </Btn>
                            <Btn size="sm" onClick={() => setReturning(null)}>
                              {t('admin.cancel')}
                            </Btn>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-1.5">
                          <Btn size="sm" variant="primary" onClick={() => void review(r.id, 'approve')}>
                            {t('admin.req.approve')}
                          </Btn>
                          <Btn size="sm" onClick={() => setReturning({ id: r.id, note: '' })}>
                            {t('admin.req.return')}
                          </Btn>
                        </div>
                      ))}
                    {r.status === 'pending' && r.createdBy === admin.id && (
                      <Btn size="sm" onClick={() => void withdraw(r.id)}>
                        {t('admin.req.withdraw')}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        {requests && !shown.length && <p className="px-3 py-4 text-k-muted">{t('admin.req.empty')}</p>}
      </Panel>
    </>
  );
}
