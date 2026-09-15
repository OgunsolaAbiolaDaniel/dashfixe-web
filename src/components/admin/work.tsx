import { useEffect, useState, type ReactNode } from 'react';
import { can } from '../../shared/adminRoles';
import type { ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { stamp } from '../../lib/console';
import { ACTION_LABELS, type AuditEvent, type Person } from '../../lib/consoleData';
import { Btn } from './ui';
import { useLang } from '../../i18n';

/**
 * Pieces shared by the console's work screens (rev 2.13): status tabs, the owner
 * control (which follows the viewer's role), contact buttons and a record's
 * history from the audit log.
 */
export function Tabs<T extends string>({ label, tabs, value, onChange }: { label: string; tabs: Array<{ id: T; label: string; count?: number }>; value: T; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={
            'rounded-[5px] border px-2.5 py-1 text-[12.5px] transition ' +
            (value === tab.id ? 'border-k-line2 bg-k-panel2 text-k-text' : 'border-transparent text-k-muted hover:text-k-text')
          }
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1.5 font-plexmono text-[11px] text-k-muted">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A labelled filter select; `''` means any. */
export function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-[5px] border border-k-line2 bg-k-bg px-2 py-[3px] text-[12px] text-k-text2">
      <span className="text-k-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-k-text outline-none">
        {children}
      </select>
    </label>
  );
}

/**
 * Who owns this. Supervisors and the Super admin assign anyone; an Admin can take
 * something unowned or let go of their own — the same rule the server applies.
 */
export function OwnerControl({ admin, ownerId, people, onChange }: { admin: ConsoleAdmin; ownerId: number | null; people: Person[]; onChange: (id: number | null) => void }) {
  const { t } = useLang();
  if (can(admin.role, 'work.assign')) {
    return (
      <select
        aria-label={t('admin.owner.label')}
        value={ownerId ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="rounded-[4px] border border-k-line2 bg-k-bg px-1.5 py-0.5 text-[12.5px] text-k-text"
      >
        <option value="">{t('admin.owner.none')}</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.id === admin.id ? ` (${t('admin.team.you')})` : ''}
          </option>
        ))}
      </select>
    );
  }
  if (ownerId === null) {
    return (
      <Btn size="sm" variant="primary" onClick={() => onChange(admin.id)}>
        {t('admin.owner.take')}
      </Btn>
    );
  }
  if (ownerId === admin.id) {
    return (
      <span className="inline-flex items-center gap-2">
        {admin.name}
        <Btn size="sm" onClick={() => onChange(null)}>
          {t('admin.owner.release')}
        </Btn>
      </span>
    );
  }
  return <span className="text-k-text2">{t('admin.owner.theirs', { name: people.find((p) => p.id === ownerId)?.name ?? '—' })}</span>;
}

export function ContactButtons({ phone, email }: { phone: string; email?: string }) {
  const { t } = useLang();
  const link = 'inline-flex items-center rounded-[5px] border px-2.5 py-[5px] text-[12.5px] font-medium transition';
  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={`tel:${phone}`} className={`${link} border-[var(--acc)] bg-[var(--acc)] text-white hover:brightness-110 hover:text-white`}>
        {t('admin.call')} <span className="ml-1.5 font-plexmono text-[11.5px]">{phone}</span>
      </a>
      <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={`${link} border-k-line2 bg-k-panel2 text-k-text hover:bg-k-hover hover:text-k-text`}>
        WhatsApp
      </a>
      {email && (
        <a href={`mailto:${email}`} className={`${link} border-k-line2 bg-k-panel2 text-k-text hover:bg-k-hover hover:text-k-text`}>
          {t('admin.emailBtn')}
        </a>
      )}
    </div>
  );
}

/** Every change to one record, newest first. `version` re-fetches after a save. */
export function History({ record, version }: { record: string; version: number }) {
  const { t, lang } = useLang();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  useEffect(() => {
    let live = true;
    void api<{ events: AuditEvent[] }>('/api/admin/history', { record }).then((r) => live && r.ok && setEvents(r.data.events));
    return () => {
      live = false;
    };
  }, [record, version]);
  if (events && !events.length) return <p className="px-3 py-3 text-[12.5px] text-k-muted">{t('admin.drawer.noHistory')}</p>;
  return (
    <ol className="grid gap-0 px-3 py-2">
      {(events ?? []).map((e, i) => (
        <li key={e.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-2 py-1.5 text-[12px]">
          <span aria-hidden="true" className={'mt-[5px] h-[7px] w-[7px] rounded-full ' + (i === 0 ? 'bg-[var(--acc)]' : 'bg-k-line2')} />
          <span className="text-k-text2">
            <span className="text-k-text">{e.adminName ?? t('admin.audit.system')}</span> · {ACTION_LABELS[e.action] ? t(ACTION_LABELS[e.action]!) : e.action}
            {e.detail && <span className="text-k-muted"> — {e.detail}</span>}
            <span className="block font-plexmono text-[11px] text-k-muted">{stamp(e.at, lang)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
