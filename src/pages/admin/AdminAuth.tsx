import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { AdminRole } from '../../shared/adminRoles';
import { useAdminSession } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { roleVars } from '../../lib/console';
import { Btn, Field, PasswordInput, inputClass } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';

/**
 * The console's door (rev 2.12): sign in, one-time setup, and the forced
 * password change after a starting password. Black, centred, before any sidebar.
 */
const KNOWN: ReadonlySet<string> = new Set([
  'invalid_credentials', 'locked', 'disabled', 'temp_expired', 'wrong_key', 'weak_password', 'invalid_email', 'invalid_name',
  'already_set_up', 'setup_unavailable', 'wrong_password', 'same_password', 'email_taken', 'not_yourself', 'last_super', 'forbidden',
  'needs_supervisor', 'invalid_owner', 'resolution_required',
]);

// eslint-disable-next-line react-refresh/only-export-components -- shared by every console form
export function errorKey(error: string, status: number): StringKey {
  if (status === 0) return 'admin.err.network';
  return KNOWN.has(error) ? (`admin.err.${error}` as StringKey) : 'admin.err.generic';
}

/** No role yet, so no role colour: neutral. */
const NEUTRAL = { '--acc': '#ECECF1', '--acc-text': '#ECECF1', '--acc-soft': 'rgba(236, 236, 241, .12)', '--acc-line': 'rgba(236, 236, 241, .3)' } as CSSProperties;

export function ConsoleFrame({ role, children }: { role?: AdminRole; children: ReactNode }) {
  const { t } = useLang();
  return (
    <div
      style={role ? roleVars(role) : NEUTRAL}
      className="grid min-h-screen place-items-center bg-k-bg bg-[radial-gradient(rgb(255_255_255/.05)_1px,transparent_1px)] bg-[length:18px_18px] p-5 font-plex text-[13px] text-k-text"
    >
      <main className="w-full max-w-[380px]">
        <div className="mb-4 flex items-center gap-2 text-[15px] font-bold">
          Dashfixe
          <span className="rounded-[3px] border border-[var(--acc-line)] px-[5px] py-px font-plexmono text-[10px] font-semibold tracking-[.08em] text-[var(--acc-text)]">
            {t('admin.brandTag')}
          </span>
        </div>
        <div className="grid gap-3.5 rounded-[9px] border border-k-line2 bg-k-panel p-5">{children}</div>
      </main>
    </div>
  );
}

const H1 = 'text-[18px] font-semibold tracking-[-.01em]';
const BODY = 'text-[12.5px] leading-[1.5] text-k-muted';
const ALERT = 'rounded-[5px] border border-k-crit/35 bg-k-crit/10 px-2.5 py-2 text-[12.5px] text-k-crit';

export function SignInPage({ setupNeeded }: { setupNeeded: boolean }) {
  const { t } = useLang();
  const { refresh } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api('/api/admin/login', { email, password });
    if (r.ok) return refresh();
    setBusy(false);
    setPassword('');
    setError(errorKey(r.error, r.status));
  };

  return (
    <ConsoleFrame>
      <div>
        <h1 className={H1}>{t('admin.signin.title')}</h1>
        <p className={BODY}>{t('admin.signin.body')}</p>
      </div>
      <form onSubmit={(e) => void submit(e)} className="grid gap-3" noValidate>
        <Field label={t('admin.email')}>
          {(id) => <input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} font-plexmono`} />}
        </Field>
        <Field label={t('admin.password')}>
          {(id, describedBy) => <PasswordInput id={id} describedBy={describedBy} value={password} onChange={setPassword} autoComplete="current-password" />}
        </Field>
        {error && (
          <p role="alert" className={ALERT}>
            {t(error)}
          </p>
        )}
        <Btn type="submit" variant="invert" disabled={busy || !email || !password} className="py-2 text-[13.5px]">
          {t('admin.signin.submit')}
        </Btn>
      </form>
      <p className={BODY}>{t('admin.signin.lockNote')}</p>
      {setupNeeded && (
        <Link to="/admin/setup" className="text-[12.5px] font-medium text-k-text underline decoration-k-line2 underline-offset-4 hover:decoration-k-text">
          {t('admin.signin.firstTime')}
        </Link>
      )}
    </ConsoleFrame>
  );
}

export function SetupPage() {
  const { t } = useLang();
  const { state, refresh } = useAdminSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ key: '', name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (state.status === 'loading') return <ConsoleFrame><p role="status" className={BODY}>{t('admin.loading')}</p></ConsoleFrame>;
  if (state.status === 'signedIn') return <Navigate to="/admin" replace />;
  if (!state.setupNeeded || !state.setupAvailable) {
    return (
      <ConsoleFrame>
        <h1 className={H1}>{state.setupNeeded ? t('admin.setup.title') : t('admin.setup.done')}</h1>
        <p className={BODY}>{state.setupNeeded ? t('admin.setup.unavailable') : t('admin.setup.doneBody')}</p>
        <Link to="/admin" className="text-[12.5px] font-medium text-k-text underline underline-offset-4">
          {t('admin.goSignIn')}
        </Link>
      </ConsoleFrame>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('admin.err.mismatch');
    if (form.password.length < 12) return setError('admin.err.weak_password');
    setBusy(true);
    setError(null);
    const r = await api('/api/admin/setup', { key: form.key, name: form.name, email: form.email, password: form.password });
    if (r.ok) {
      await refresh();
      navigate('/admin', { replace: true });
      return;
    }
    setBusy(false);
    setError(errorKey(r.error, r.status));
  };

  return (
    <ConsoleFrame>
      <div>
        <h1 className={H1}>{t('admin.setup.title')}</h1>
        <p className={BODY}>{t('admin.setup.body')}</p>
      </div>
      <form onSubmit={(e) => void submit(e)} className="grid gap-3" noValidate>
        <Field label={t('admin.setup.key')} hint={t('admin.setup.keyHint')}>
          {(id, d) => <PasswordInput id={id} describedBy={d} value={form.key} onChange={set('key')} autoComplete="off" />}
        </Field>
        <Field label={t('admin.name')}>
          {(id) => <input id={id} autoComplete="name" value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputClass} />}
        </Field>
        <Field label={t('admin.email')}>
          {(id) => <input id={id} type="email" autoComplete="username" value={form.email} onChange={(e) => set('email')(e.target.value)} className={`${inputClass} font-plexmono`} />}
        </Field>
        <Field label={t('admin.newPassword')} hint={t('admin.passwordHint')}>
          {(id, d) => <PasswordInput id={id} describedBy={d} value={form.password} onChange={set('password')} autoComplete="new-password" />}
        </Field>
        <Field label={t('admin.confirmPassword')}>
          {(id) => <PasswordInput id={id} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />}
        </Field>
        {error && (
          <p role="alert" className={ALERT}>
            {t(error)}
          </p>
        )}
        <Btn type="submit" variant="invert" disabled={busy} className="py-2 text-[13.5px]">
          {t('admin.setup.submit')}
        </Btn>
      </form>
    </ConsoleFrame>
  );
}

/** New password twice, checked here and on the server. Used forced (after a starting password) and on Account. */
export function PasswordChangeForm({ currentLabel, onDone }: { currentLabel: StringKey; onDone: () => void | Promise<void> }) {
  const { t } = useLang();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return setError('admin.err.mismatch');
    if (next.length < 12) return setError('admin.err.weak_password');
    setBusy(true);
    setError(null);
    const r = await api('/api/admin/password', { current, next });
    setBusy(false);
    if (!r.ok) return setError(errorKey(r.error, r.status));
    setCurrent('');
    setNext('');
    setConfirm('');
    await onDone();
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-3" noValidate>
      <Field label={t(currentLabel)}>
        {(id) => <PasswordInput id={id} value={current} onChange={setCurrent} autoComplete="current-password" />}
      </Field>
      <Field label={t('admin.newPassword')} hint={t('admin.passwordHint')}>
        {(id, d) => <PasswordInput id={id} describedBy={d} value={next} onChange={setNext} autoComplete="new-password" />}
      </Field>
      <Field label={t('admin.confirmPassword')}>
        {(id) => <PasswordInput id={id} value={confirm} onChange={setConfirm} autoComplete="new-password" />}
      </Field>
      {error && (
        <p role="alert" className={ALERT}>
          {t(error)}
        </p>
      )}
      <Btn type="submit" variant="primary" disabled={busy || !current || !next} className="w-fit">
        {t('admin.pw.submit')}
      </Btn>
    </form>
  );
}

export function ForcedPassword({ role }: { role: AdminRole }) {
  const { t } = useLang();
  const { refresh, signOut } = useAdminSession();
  return (
    <ConsoleFrame role={role}>
      <div>
        <h1 className={H1}>{t('admin.pw.forcedTitle')}</h1>
        <p className={BODY}>{t('admin.pw.forcedBody')}</p>
      </div>
      <PasswordChangeForm currentLabel="admin.pw.starting" onDone={refresh} />
      <button type="button" onClick={() => void signOut()} className="w-fit text-[12px] text-k-muted hover:text-k-text">
        {t('admin.signOut')}
      </button>
    </ConsoleFrame>
  );
}
