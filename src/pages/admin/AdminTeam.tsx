import { useEffect, useState, type FormEvent } from 'react';
import { ADMIN_ROLES, can, type AdminRole } from '../../shared/adminRoles';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, suggestPassword } from '../../lib/console';
import { Btn, CopyButton, Field, Initials, PageHead, Panel, Pill, RoleBadge, TableWrap, inputClass, td, th } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { errorKey } from './AdminAuth';

/**
 * /admin/team — the Super admin's page (rev 2.12). Add a person with a starting
 * password (shown once, to send by WhatsApp), change roles, reset passwords,
 * disable. The server enforces every rule; this page mirrors them.
 */
type Callout = { title: string; message: string };

function stateOf(a: ConsoleAdmin): [Parameters<typeof Pill>[0]['tone'], StringKey] {
  if (a.disabled) return ['crit', 'admin.state.disabled'];
  if (a.locked) return ['warn', 'admin.state.locked'];
  if (a.tempExpired) return ['warn', 'admin.state.expired'];
  if (a.mustChange) return ['acc', 'admin.state.pending'];
  return ['ok', 'admin.state.active'];
}

function AddPerson({ onAdded, onCancel }: { onAdded: (admin: ConsoleAdmin, password: string) => void; onCancel: () => void }) {
  const { t } = useLang();
  const [form, setForm] = useState<{ name: string; email: string; role: AdminRole; password: string }>(() => ({
    name: '',
    email: '',
    role: 'admin',
    password: suggestPassword(),
  }));
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api<{ admin: ConsoleAdmin }>('/api/admin/team', form);
    setBusy(false);
    if (!r.ok) return setError(errorKey(r.error, r.status));
    onAdded(r.data.admin, form.password);
  };

  return (
    <Panel title={t('admin.team.add')} meta={t('admin.team.sendNote')}>
      <form onSubmit={(e) => void submit(e)} className="grid gap-3 p-3" noValidate>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label={t('admin.name')}>
            {(id) => <input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} autoComplete="off" />}
          </Field>
          <Field label={t('admin.email')}>
            {(id) => <input id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputClass} font-plexmono`} autoComplete="off" />}
          </Field>
          <Field label={t('admin.team.col.role')}>
            {(id) => (
              <select id={id} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })} className={inputClass}>
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`admin.role.${r}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t('admin.team.startPassword')}>
            {(id) => (
              <div className="flex gap-1.5">
                <input id={id} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} font-plexmono`} autoComplete="off" />
                <Btn size="sm" onClick={() => setForm({ ...form, password: suggestPassword() })} aria-label={t('admin.team.suggest')} title={t('admin.team.suggest')}>
                  ↻
                </Btn>
              </div>
            )}
          </Field>
        </div>
        <p className="text-[12px] text-k-muted">{t(`admin.roleDesc.${form.role}`)}</p>
        {error && (
          <p role="alert" className="text-[12.5px] text-k-crit">
            {t(error)}
          </p>
        )}
        <div className="flex gap-2">
          <Btn type="submit" variant="primary" disabled={busy}>
            {t('admin.team.addSubmit')}
          </Btn>
          <Btn onClick={onCancel}>{t('admin.cancel')}</Btn>
        </div>
      </form>
    </Panel>
  );
}

export default function AdminTeam({ admin }: { admin: ConsoleAdmin }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const [people, setPeople] = useState<ConsoleAdmin[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [callout, setCallout] = useState<Callout | null>(null);
  const [error, setError] = useState<StringKey | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [resetting, setResetting] = useState<{ id: number; password: string } | null>(null);
  const manages = can(admin.role, 'team.manage');

  useEffect(() => {
    if (!manages) return;
    let live = true;
    void api<{ admins: ConsoleAdmin[] }>('/api/admin/team').then((r) => {
      if (!live) return;
      if (r.ok) setPeople(r.data.admins);
      else if (r.status === 401) void refresh();
      else setError(errorKey(r.error, r.status));
    });
    return () => {
      live = false;
    };
  }, [manages, refresh]);

  if (!manages) {
    return (
      <div className="grid justify-items-center gap-1.5 rounded-[7px] border border-dashed border-k-line2 bg-k-panel p-10 text-center">
        <h1 className="text-[14px] font-semibold">{t('admin.locked.team')}</h1>
        <p className="max-w-[46ch] text-[12.5px] text-k-muted">{t('admin.locked.teamBody')}</p>
      </div>
    );
  }

  const message = (a: ConsoleAdmin, password: string) =>
    t('admin.team.message', { url: `${window.location.origin}/admin`, email: a.email, password });

  const update = async (id: number, patch: Record<string, unknown>) => {
    setError(null);
    const r = await api<{ admin: ConsoleAdmin }>('/api/admin/team/update', { id, ...patch });
    if (!r.ok) {
      setError(errorKey(r.error, r.status));
      return null;
    }
    setPeople((list) => (list ?? []).map((a) => (a.id === id ? r.data.admin : a)));
    return r.data.admin;
  };

  return (
    <>
      <PageHead title={t('admin.team.title')} lead={t('admin.team.lead')}>
        {!adding && (
          <Btn variant="primary" onClick={() => setAdding(true)}>
            + {t('admin.team.add')}
          </Btn>
        )}
      </PageHead>

      {callout && (
        <div role="status" className="grid gap-2 rounded-[7px] border border-[var(--acc-line)] bg-[var(--acc-soft)] p-3">
          <p className="text-[12.5px] font-medium">{callout.title}</p>
          <p className="break-all rounded-[5px] border border-k-line2 bg-k-bg px-2.5 py-2 font-plexmono text-[12px] text-k-text">{callout.message}</p>
          <div className="flex gap-2">
            <CopyButton text={callout.message} />
            <Btn size="sm" onClick={() => setCallout(null)}>
              {t('admin.team.dismiss')}
            </Btn>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-[5px] border border-k-crit/35 bg-k-crit/10 px-2.5 py-2 text-[12.5px] text-k-crit">
          {t(error)}
        </p>
      )}

      {adding && (
        <AddPerson
          onCancel={() => setAdding(false)}
          onAdded={(a, password) => {
            setPeople((list) => [...(list ?? []), a]);
            setAdding(false);
            setCallout({ title: t('admin.team.added', { name: a.name }), message: message(a, password) });
          }}
        />
      )}

      <Panel title={`${t('admin.team.title')} · ${people?.length ?? '…'}`}>
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>{t('admin.team.col.name')}</th>
                <th className={th}>{t('admin.email')}</th>
                <th className={th}>{t('admin.team.col.role')}</th>
                <th className={th}>{t('admin.team.col.state')}</th>
                <th className={th}>{t('admin.team.col.lastActive')}</th>
                <th className={th}>{t('admin.team.col.added')}</th>
                <th className={th}>
                  <span className="sr-only">{t('admin.audit.col.action')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(people ?? []).map((a) => {
                const me = a.id === admin.id;
                const [tone, state] = stateOf(a);
                return (
                  <tr key={a.id} className="align-top hover:bg-k-hover">
                    <td className={td}>
                      <span className="inline-flex items-center gap-2">
                        <Initials name={a.name} mine={me} />
                        {a.name}
                        {me && <span className="font-plexmono text-[11px] text-k-muted">({t('admin.team.you')})</span>}
                      </span>
                    </td>
                    <td className={`${td} font-plexmono text-[12px]`}>{a.email}</td>
                    <td className={td}>
                      {me ? (
                        <RoleBadge role={a.role} />
                      ) : (
                        <select
                          aria-label={t('admin.team.roleFor', { name: a.name })}
                          value={a.role}
                          onChange={async (e) => {
                            const next = await update(a.id, { role: e.target.value });
                            if (next) setCallout({ title: t('admin.team.roleChanged', { name: next.name, role: t(`admin.role.${next.role}`) }), message: t(`admin.roleDesc.${next.role}`) });
                          }}
                          className="rounded-[4px] border border-k-line2 bg-k-bg px-1.5 py-0.5 text-[12px] text-k-text"
                        >
                          {ADMIN_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(`admin.role.${r}`)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className={td}>
                      <Pill tone={tone}>{t(state)}</Pill>
                    </td>
                    <td className={`${td} text-k-text2`}>{a.lastActiveAt ? ago(a.lastActiveAt, lang) : t('admin.never')}</td>
                    <td className={`${td} text-k-text2`}>{ago(a.createdAt, lang)}</td>
                    <td className={`${td} whitespace-normal`}>
                      {!me && confirming === a.id ? (
                        <div className="grid gap-1.5">
                          <span className="text-[12px]">{t('admin.team.disableConfirm', { name: a.name })}</span>
                          <div className="flex gap-1.5">
                            <Btn size="sm" variant="danger" onClick={async () => { setConfirming(null); await update(a.id, { disabled: true }); }}>
                              {t('admin.team.disableYes')}
                            </Btn>
                            <Btn size="sm" onClick={() => setConfirming(null)}>
                              {t('admin.cancel')}
                            </Btn>
                          </div>
                        </div>
                      ) : !me && resetting?.id === a.id ? (
                        <div className="grid gap-1.5">
                          <span className="text-[12px]">{t('admin.team.resetFor', { name: a.name })}</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <code className="rounded-[4px] border border-k-line2 bg-k-bg px-1.5 py-0.5 font-plexmono text-[12px]">{resetting.password}</code>
                            <Btn size="sm" onClick={() => setResetting({ id: a.id, password: suggestPassword() })} aria-label={t('admin.team.suggest')} title={t('admin.team.suggest')}>
                              ↻
                            </Btn>
                          </div>
                          <div className="flex gap-1.5">
                            <Btn
                              size="sm"
                              variant="primary"
                              onClick={async () => {
                                const password = resetting.password;
                                setResetting(null);
                                const next = await update(a.id, { password });
                                if (next) setCallout({ title: t('admin.team.resetDone', { name: next.name }), message: message(next, password) });
                              }}
                            >
                              {t('admin.team.resetYes')}
                            </Btn>
                            <Btn size="sm" onClick={() => setResetting(null)}>
                              {t('admin.cancel')}
                            </Btn>
                          </div>
                        </div>
                      ) : (
                        !me && (
                          <div className="flex flex-wrap gap-1.5">
                            <Btn size="sm" onClick={() => setResetting({ id: a.id, password: suggestPassword() })}>
                              {t('admin.team.reset')}
                            </Btn>
                            {a.disabled ? (
                              <Btn size="sm" onClick={() => void update(a.id, { disabled: false })}>
                                {t('admin.team.enable')}
                              </Btn>
                            ) : (
                              <Btn size="sm" variant="danger" onClick={() => setConfirming(a.id)}>
                                {t('admin.team.disable')}
                              </Btn>
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <div className="grid gap-px overflow-hidden rounded-[7px] border border-k-line bg-k-line md:grid-cols-3">
        {ADMIN_ROLES.map((r) => (
          <div key={r} className="grid content-start gap-1.5 bg-k-panel p-3">
            <RoleBadge role={r} />
            <p className="text-[12px] text-k-text2">{t(`admin.roleDesc.${r}`)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
