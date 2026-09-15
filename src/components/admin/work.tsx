import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { can } from '../../shared/adminRoles';
import type { ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { ago, stamp } from '../../lib/console';
import { ACTION_LABELS, type AuditEvent, type ConsoleMessage, type Person, type RequestAction, type SignOffRequest } from '../../lib/consoleData';
import { Btn, RoleBadge, inputClass } from './ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

const REQUEST_ERRORS: ReadonlySet<string> = new Set([
  'already_requested', 'already_decided', 'already_resolved', 'not_pending', 'note_required', 'own_request', 'resolution_required', 'empty_message', 'forbidden',
]);
const requestError = (error: string, status: number): StringKey =>
  status === 0 ? 'admin.err.network' : REQUEST_ERRORS.has(error) ? (`admin.err.${error}` as StringKey) : 'admin.err.generic';

/**
 * Supervisor sign-off on one record (rev 2.14) — it shows each viewer their part:
 * - a pending request: the Supervisor approves or sends it back (with a reason);
 *   the Admin who asked can withdraw; anyone else sees who is waiting on what
 * - nothing pending: an Admin can ask (and sees why a last request came back)
 */
export function RequestPanel({
  admin,
  recordType,
  recordId,
  recordRef,
  requests,
  canAsk,
  actions,
  onChanged,
}: {
  admin: ConsoleAdmin;
  recordType: 'application' | 'report';
  recordId: number;
  recordRef: string;
  /** Requests the viewer can see, any record; newest first. */
  requests: SignOffRequest[];
  /** The record is still open to a request (undecided application, unresolved report). */
  canAsk: boolean;
  actions: RequestAction[];
  onChanged: () => void;
}) {
  const { t, lang } = useLang();
  const mine = requests.filter((r) => r.recordRef === recordRef);
  const pending = mine.find((r) => r.status === 'pending');
  const lastReturned = mine.find((r) => r.status === 'returned' && r.createdBy === admin.id);
  const [mode, setMode] = useState<'idle' | 'asking' | 'returning'>('idle');
  const [action, setAction] = useState<RequestAction>(actions[0]!);
  const [note, setNote] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const call = async (path: string, body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const r = await api(path, body);
    setBusy(false);
    if (!r.ok) return setError(requestError(r.error, r.status));
    setMode('idle');
    setNote('');
    setPayload('');
    onChanged();
  };

  const box = 'grid gap-2 rounded-[6px] border px-3 py-2.5 text-[12.5px]';
  const errorLine = error && (
    <p role="alert" className="text-[12px] text-k-crit">
      {t(error)}
    </p>
  );

  if (pending) {
    const reviewer = can(admin.role, 'requests.review') && pending.createdBy !== admin.id;
    return (
      <div role="group" aria-label={t('admin.req.pendingPill')} className={`${box} border-[var(--acc-line)] bg-[var(--acc-soft)]`}>
        <p>
          <strong className="font-semibold">
            {pending.createdBy === admin.id
              ? t('admin.req.waiting', { action: t(`admin.req.action.${pending.action}`) })
              : t('admin.req.asks', { name: pending.createdByName, action: t(`admin.req.action.${pending.action}`) })}
          </strong>
          <span className="ml-1.5 font-plexmono text-[11px] text-k-muted">{ago(pending.createdAt, lang)}</span>
        </p>
        {pending.payload && <p className="text-k-text2">{t('admin.req.proposed', { text: pending.payload })}</p>}
        {pending.note && <p className="text-k-text2">“{pending.note}”</p>}
        {reviewer &&
          (mode === 'returning' ? (
            <form
              className="grid gap-1.5"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void call('/api/admin/requests/review', { id: pending.id, decision: 'return', note });
              }}
            >
              <label htmlFor={`ret-${pending.id}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
                {t('admin.req.reason')}
              </label>
              <textarea id={`ret-${pending.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className={`${inputClass} resize-y`} />
              <div className="flex gap-1.5">
                <Btn type="submit" size="sm" variant="danger" disabled={busy}>
                  {t('admin.req.returnSubmit')}
                </Btn>
                <Btn size="sm" onClick={() => setMode('idle')}>
                  {t('admin.cancel')}
                </Btn>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <Btn size="sm" variant="primary" disabled={busy} onClick={() => void call('/api/admin/requests/review', { id: pending.id, decision: 'approve' })}>
                {t('admin.req.approve')}
              </Btn>
              <Btn size="sm" onClick={() => setMode('returning')}>
                {t('admin.req.return')}
              </Btn>
            </div>
          ))}
        {pending.createdBy === admin.id && (
          <Btn size="sm" className="w-fit" disabled={busy} onClick={() => void call('/api/admin/requests/withdraw', { id: pending.id })}>
            {t('admin.req.withdraw')}
          </Btn>
        )}
        {errorLine}
      </div>
    );
  }

  if (!can(admin.role, 'requests.create') || !canAsk) return null;

  return (
    <div className={`${box} border-k-line2 bg-k-panel2`}>
      {lastReturned && (
        <p className="text-k-warn">{t('admin.req.returned', { name: lastReturned.reviewedByName ?? '—', note: lastReturned.reviewNote ?? '' })}</p>
      )}
      {mode === 'asking' ? (
        <form
          className="grid gap-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void call('/api/admin/requests', { recordType, recordId, action, note: note || null, payload: payload || null });
          }}
        >
          {actions.length > 1 && (
            <fieldset className="flex flex-wrap items-center gap-3">
              <legend className="mb-1 font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">{t('admin.req.askFor')}</legend>
              {actions.map((a) => (
                <label key={a} className="inline-flex items-center gap-1.5">
                  <input type="radio" name={`act-${recordRef}`} checked={action === a} onChange={() => setAction(a)} className="accent-[var(--acc)]" />
                  {t(`admin.req.action.${a}`)}
                </label>
              ))}
            </fieldset>
          )}
          {action === 'resolve' && (
            <>
              <label htmlFor={`prop-${recordRef}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
                {t('admin.req.proposedLabel')}
              </label>
              <textarea id={`prop-${recordRef}`} value={payload} onChange={(e) => setPayload(e.target.value)} rows={2} maxLength={1000} className={`${inputClass} resize-y`} />
            </>
          )}
          <label htmlFor={`note-req-${recordRef}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
            {t('admin.req.note')}
          </label>
          <textarea id={`note-req-${recordRef}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className={`${inputClass} resize-y`} />
          <div className="flex gap-1.5">
            <Btn type="submit" size="sm" variant="primary" disabled={busy}>
              {t('admin.req.send')}
            </Btn>
            <Btn size="sm" onClick={() => setMode('idle')}>
              {t('admin.cancel')}
            </Btn>
          </div>
        </form>
      ) : (
        <Btn size="sm" variant="primary" className="w-fit" onClick={() => setMode('asking')}>
          {t('admin.req.ask')}
        </Btn>
      )}
      {errorLine}
    </div>
  );
}

/** A record's conversation (rev 2.14): anyone in the console, oldest first. */
export function Discussion({ record, admin, version = 0 }: { record: string; admin: ConsoleAdmin; version?: number }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ConsoleMessage[] | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<StringKey | null>(null);

  useEffect(() => {
    let live = true;
    void api<{ messages: ConsoleMessage[] }>('/api/admin/thread', { record }).then((r) => live && r.ok && setMessages(r.data.messages));
    return () => {
      live = false;
    };
  }, [record, version]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = await api<{ message: ConsoleMessage }>('/api/admin/messages', { record, body });
    if (!r.ok) return setError(requestError(r.error, r.status));
    setMessages((list) => [...(list ?? []), r.data.message]);
    setBody('');
  };

  return (
    <div className="grid gap-2 px-3 py-2.5">
      {messages && !messages.length && <p className="text-[12.5px] text-k-muted">{t('admin.disc.empty')}</p>}
      <ol className="grid gap-2">
        {(messages ?? []).map((m) => (
          <li key={m.id} className={'rounded-[6px] border px-2.5 py-2 text-[12.5px] ' + (m.authorId === admin.id ? 'border-[var(--acc-line)] bg-[var(--acc-soft)]' : 'border-k-line2 bg-k-panel2')}>
            <p className="mb-0.5 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold">{m.authorName}</span>
              <RoleBadge role={m.authorRole} />
              <span className="font-plexmono text-[11px] text-k-muted">{stamp(m.createdAt, lang)}</span>
            </p>
            <p className="whitespace-pre-line text-k-text">{m.body}</p>
          </li>
        ))}
      </ol>
      <form onSubmit={(e) => void send(e)} className="grid gap-1.5">
        <label htmlFor={`msg-${record}`} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
          {t('admin.disc.label')}
        </label>
        <textarea id={`msg-${record}`} value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} className={`${inputClass} resize-y`} />
        {error && (
          <p role="alert" className="text-[12px] text-k-crit">
            {t(error)}
          </p>
        )}
        <Btn type="submit" size="sm" className="w-fit" disabled={!body.trim()}>
          {t('admin.disc.send')}
        </Btn>
      </form>
    </div>
  );
}

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
