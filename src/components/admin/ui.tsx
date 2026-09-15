import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { AdminRole } from '../../shared/adminRoles';
import { ROLE_COLOURS } from '../../lib/console';
import { useLang } from '../../i18n';

/**
 * The console's building blocks (rev 2.12): dense, black, IBM Plex. Colour is
 * spent on two things only — the viewer's role accent (`--acc*`, set by
 * AdminShell) and attention (ok / warn / crit).
 */

export function PageHead({ kicker, title, lead, children }: { kicker?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="mr-auto min-w-0">
        {kicker && <p className="text-[12px] text-k-muted">{kicker}</p>}
        <h1 className="text-[19px] font-semibold tracking-[-.01em] text-k-text">{title}</h1>
        {lead && <p className="mt-0.5 max-w-[70ch] text-[12.5px] text-k-muted">{lead}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-1.5">{children}</div>}
    </div>
  );
}

export function Panel({ title, meta, actions, children, className = '' }: { title?: string; meta?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[7px] border border-k-line bg-k-panel ${className}`}>
      {(title || actions) && (
        <header className="flex items-center gap-2 border-b border-k-line px-3 py-2">
          {title && <h2 className="text-[12.5px] font-semibold text-k-text">{title}</h2>}
          {meta && <span className="text-[11.5px] text-k-muted">{meta}</span>}
          {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'invert' | 'default' | 'danger' | 'ghost'; size?: 'sm' | 'md' };

const VARIANTS = {
  primary: 'border-[var(--acc)] bg-[var(--acc)] text-white hover:brightness-110',
  /** Before anyone is signed in there's no role colour: white on black. */
  invert: 'border-k-text bg-k-text text-k-bg hover:bg-white',
  default: 'border-k-line2 bg-k-panel2 text-k-text hover:bg-k-hover',
  danger: 'border-k-crit/40 bg-transparent text-k-crit hover:bg-k-crit/10',
  ghost: 'border-transparent bg-transparent text-[var(--acc-text)] hover:underline',
};

export function Btn({ variant = 'default', size = 'md', className = '', type = 'button', ...props }: BtnProps) {
  return (
    <button
      type={type}
      {...props}
      className={
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] border font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ' +
        (size === 'sm' ? 'px-2 py-[3px] text-[11.5px] ' : 'px-2.5 py-[5px] text-[12.5px] ') +
        VARIANTS[variant] +
        ' ' +
        className
      }
    />
  );
}

export const inputClass =
  'block w-full rounded-[5px] border border-k-line2 bg-k-bg px-2.5 py-[6px] text-[13px] text-k-text outline-none transition placeholder:text-k-faint focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc-soft)]';

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted">
        {label}
      </label>
      {children(id, hint || error ? noteId : undefined)}
      {(error || hint) && (
        <p id={noteId} role={error ? 'alert' : undefined} className={'text-[11.5px] ' + (error ? 'text-k-crit' : 'text-k-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** A password input with Show/Hide. */
export function PasswordInput({ id, describedBy, value, onChange, autoComplete }: { id: string; describedBy?: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const { t } = useLang();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        className={`${inputClass} pr-16 font-plexmono`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[4px] px-1.5 py-0.5 text-[11.5px] text-k-muted hover:bg-k-hover hover:text-k-text"
      >
        {shown ? t('admin.hide') : t('admin.show')}
      </button>
    </div>
  );
}

const TONES = {
  ok: 'bg-k-ok/15 text-k-ok',
  warn: 'bg-k-warn/15 text-k-warn',
  crit: 'bg-k-crit/15 text-k-crit',
  muted: 'bg-k-muted/15 text-k-text2',
  acc: 'bg-[var(--acc-soft)] text-[var(--acc-text)]',
};

export function Pill({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-[7px] py-px text-[11.5px] font-medium ${TONES[tone]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** A role's own colour, whoever is looking. */
export function RoleBadge({ role }: { role: AdminRole }) {
  const { t } = useLang();
  const c = ROLE_COLOURS[role];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-[3px] border px-1.5 py-px font-plexmono text-[10.5px] font-semibold uppercase tracking-[.04em]"
      style={{ color: c.text, borderColor: c.line, background: c.soft }}
    >
      {t(`admin.role.${role}`)}
    </span>
  );
}

export function Initials({ name, mine = false }: { name: string; mine?: boolean }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden="true"
      className={
        'inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-[5px] border text-[9.5px] font-semibold ' +
        (mine ? 'border-[var(--acc-line)] bg-[var(--acc-soft)] text-[var(--acc-text)]' : 'border-k-line2 bg-k-hover text-k-text2')
      }
    >
      {letters || '·'}
    </span>
  );
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  return (
    <Btn
      size="sm"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? t('admin.copied') : (label ?? t('admin.copy'))}
    </Btn>
  );
}

/** A table that scrolls sideways on its own, never the page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export const th = 'whitespace-nowrap border-b border-k-line bg-k-panel2 px-2.5 py-[7px] text-left font-plexmono text-[10.5px] font-semibold uppercase tracking-[.05em] text-k-muted';
export const td = 'whitespace-nowrap border-b border-k-line px-2.5 py-[7px] align-middle';
