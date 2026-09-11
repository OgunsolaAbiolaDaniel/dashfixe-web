import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import mark from '../assets/dashfixe-mark.png';
import wordmark from '../assets/dashfixe-wordmark.png';
import LangToggle from '../components/shared/LangToggle';
import Rich from '../i18n/Rich';
import { api } from '../lib/api';
import { ROUTES, link } from '../routes';
import { useAuth } from '../auth';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * Log in / sign up as a page — ARCHITECTURE.md §5 rev 1.3. Phone-first, one
 * flow for both (first verified login IS sign-up, Uber-style), against the real
 * API: request-code → verify → httpOnly session cookie.
 *
 * `?next=` brings the visitor back to the commit point they came from. Without
 * an SMS provider configured the server returns the code and the page shows it,
 * clearly labelled as pilot behaviour.
 */
const ERRORS: Record<string, StringKey> = {
  invalid_phone: 'auth.err.invalid_phone',
  wrong_code: 'auth.err.wrong_code',
  code_expired: 'auth.err.code_expired',
  too_many_attempts: 'auth.err.too_many_attempts',
};

export default function LoginPage() {
  const { t } = useLang();
  const { signedIn, completeAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = useId();

  const nextRaw = params.get('next') ?? ROUTES.home;
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : ROUTES.home;

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Already in (or just verified): straight back to the commit point.
  useEffect(() => {
    if (signedIn) navigate(next, { replace: true });
  }, [signedIn, navigate, next]);

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    const r = await api<{ delivered: boolean; devCode?: string }>('/api/auth/request-code', { phone });
    setBusy(false);
    if (!r.ok) {
      setError(ERRORS[r.error] ?? 'form.error');
      return;
    }
    setDevCode(r.data.devCode ?? null);
    setCode('');
    setStep('code');
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const r = await api<{ phone: string }>('/api/auth/verify', { phone, code });
    setBusy(false);
    if (!r.ok) {
      setError(ERRORS[r.error] ?? 'form.error');
      return;
    }
    completeAuth(r.data.phone);
  };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="flex min-h-[69px] items-center justify-between gap-4 border-b border-line-soft bg-panel px-[clamp(16px,3vw,32px)] py-3">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2.5">
          <img src={mark} alt="" className="block h-7 w-auto" />
          <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
        </Link>
        <LangToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-[clamp(32px,8vh,72px)]">
        <div className="w-full max-w-[420px] rounded-card border border-line-soft bg-panel p-[clamp(22px,4vw,28px)] shadow-card">
          {step === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestCode();
              }}
            >
              <h1 className="mb-[7px] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink">
                {t('auth.title')}
              </h1>
              <p className="mb-[22px] text-[14.5px] font-medium leading-[1.5] text-ink-60">{t('auth.body')}</p>

              <label htmlFor={id} className="mb-[7px] block text-label text-ink-40">
                {t('auth.phone')}
              </label>
              <div className="flex h-12 items-center gap-3 rounded-input border border-line bg-page px-[15px]">
                <span className="flex-none text-[14.5px] font-bold text-ink-60">+351</span>
                <span className="block h-5 w-px flex-none bg-line" />
                <input
                  id={id}
                  type="tel"
                  autoFocus
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] font-semibold text-ink outline-offset-[6px] placeholder:text-ink-30"
                />
              </div>

              {error && <p className="mt-3 text-[13px] font-semibold text-warning">{t(error)}</p>}

              <button
                type="submit"
                disabled={busy}
                className="mt-[18px] h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                {busy ? t('form.sending') : t('auth.sendCode')}
              </button>

              <p className="mt-5 text-center text-[12.5px] font-semibold leading-[1.5] text-ink-40">
                <Rich
                  text={t('auth.legal')}
                  parts={{
                    terms: <Link to={link('terms')}>{t('auth.terms')}</Link>,
                    privacy: <Link to={link('privacy')}>{t('auth.privacyPolicy')}</Link>,
                  }}
                />
              </p>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <h1 className="mb-[7px] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink">
                {t('auth.codeTitle')}
              </h1>
              <p className="mb-4 text-[14.5px] font-medium leading-[1.5] text-ink-60">
                {t('auth.codeBody', { phone })}
              </p>

              {devCode && (
                <p className="mb-4 rounded-[13px] bg-warning-tint px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.5] text-warning">
                  {t('auth.pilot', { code: devCode })}
                </p>
              )}

              <label htmlFor={`${id}-code`} className="mb-[7px] block text-label text-ink-40">
                {t('auth.codeLabel')}
              </label>
              <input
                id={`${id}-code`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="h-[52px] w-full rounded-input border border-line bg-page px-[15px] text-center text-[22px] font-extrabold tracking-[.4em] text-ink placeholder:text-ink-30"
              />

              {error && <p className="mt-3 text-[13px] font-semibold text-warning">{t(error)}</p>}

              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="mt-[18px] h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                {busy ? t('form.sending') : t('auth.verify')}
              </button>

              <div className="mt-5 flex justify-center gap-5">
                <button type="button" onClick={() => void requestCode()} className="text-[13px] font-bold text-brand transition hover:text-brand-hover">
                  {t('auth.resend')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError(null);
                    setDevCode(null);
                  }}
                  className="text-[13px] font-bold text-ink-60 transition hover:text-ink"
                >
                  {t('auth.changePhone')}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
