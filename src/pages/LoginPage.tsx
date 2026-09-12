import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/chrome/Header';
import Rich from '../i18n/Rich';
import { api } from '../lib/api';
import { ROUTES, link } from '../routes';
import { useAuth } from '../auth';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * Log in / sign up as a page — ARCHITECTURE.md §5. Phone-first, one flow for
 * both (first verified login IS sign-up, Uber-style): request-code → verify →
 * httpOnly session cookie, then a one-time "what should we call you?".
 *
 * Pilot mode (no SMS provider configured): the server hands the code back, so
 * the page verifies it straight away — pressing Send code signs you in. The code
 * step only appears when a real text was sent. `?next=` returns the visitor to
 * the commit point they came from.
 */
const ERRORS: Record<string, StringKey> = {
  invalid_phone: 'auth.err.invalid_phone',
  wrong_code: 'auth.err.wrong_code',
  code_expired: 'auth.err.code_expired',
  too_many_attempts: 'auth.err.too_many_attempts',
  invalid_name: 'auth.err.invalid_name',
};

type Step = 'phone' | 'code' | 'name';

const CARD = 'w-full max-w-[420px] rounded-card border border-line-soft bg-panel p-[clamp(22px,4vw,28px)] shadow-card';
const H1 = 'mb-[7px] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink';
const BODY = 'text-[14.5px] font-medium leading-[1.5] text-ink-60';
const PRIMARY =
  'mt-[18px] h-ctl-lg w-full rounded-btn bg-brand text-[14.5px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60';

export default function LoginPage() {
  const { t } = useLang();
  const { signedIn, completeAuth, saveName } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = useId();

  const nextRaw = params.get('next') ?? ROUTES.home;
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : ROUTES.home;

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [pilot, setPilot] = useState(false);

  // Already in (or just verified and named): straight back to the commit point.
  useEffect(() => {
    if (signedIn && step !== 'name') navigate(next, { replace: true });
  }, [signedIn, step, navigate, next]);

  const verify = async (withCode: string) => {
    const r = await api<{ phone: string; name?: string | null }>('/api/auth/verify', { phone, code: withCode });
    if (!r.ok) {
      setError(ERRORS[r.error] ?? 'form.error');
      return;
    }
    // New customers get the one-time name step before leaving the page.
    if (!r.data.name) setStep('name');
    completeAuth(r.data.phone, r.data.name ?? null);
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    const r = await api<{ delivered: boolean; devCode?: string }>('/api/auth/request-code', { phone });
    if (!r.ok) {
      setBusy(false);
      setError(ERRORS[r.error] ?? 'form.error');
      return;
    }
    if (r.data.devCode) {
      // Pilot: no SMS was sent, so there is nothing for the customer to type.
      setPilot(true);
      await verify(r.data.devCode);
    } else {
      setCode('');
      setStep('code');
    }
    setBusy(false);
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    await verify(code);
    setBusy(false);
  };

  const submitName = async () => {
    setBusy(true);
    setError(null);
    const saved = await saveName(firstName);
    setBusy(false);
    if (!saved) {
      setError('auth.err.invalid_name');
      return;
    }
    navigate(next, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Header layout="full" minimal />

      <main className="flex flex-1 items-start justify-center px-5 py-[clamp(32px,8vh,72px)]">
        <div className={CARD}>
          {step === 'phone' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestCode();
              }}
            >
              <h1 className={H1}>{t('auth.title')}</h1>
              <p className={`mb-[22px] ${BODY}`}>{t('auth.body')}</p>

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
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] font-semibold text-ink outline-offset-[6px] placeholder:text-ink-30"
                />
              </div>

              {error && <p className="mt-3 text-[13px] font-semibold text-warning">{t(error)}</p>}

              <button type="submit" disabled={busy} className={PRIMARY}>
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
          )}

          {step === 'code' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitCode();
              }}
            >
              <h1 className={H1}>{t('auth.codeTitle')}</h1>
              <p className={`mb-4 ${BODY}`}>{t('auth.codeBody', { phone })}</p>

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

              <button type="submit" disabled={busy || code.length !== 6} className={PRIMARY}>
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
                  }}
                  className="text-[13px] font-bold text-ink-60 transition hover:text-ink"
                >
                  {t('auth.changePhone')}
                </button>
              </div>
            </form>
          )}

          {step === 'name' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitName();
              }}
            >
              {pilot && (
                <p className="mb-4 rounded-[13px] bg-warning-tint px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.5] text-warning">
                  {t('auth.pilotIn')}
                </p>
              )}
              <h1 className={H1}>{t('auth.nameTitle')}</h1>
              <p className={`mb-[22px] ${BODY}`}>{t('auth.nameBody')}</p>

              <label htmlFor={`${id}-name`} className="mb-[7px] block text-label text-ink-40">
                {t('auth.nameLabel')}
              </label>
              <input
                id={`${id}-name`}
                type="text"
                autoFocus
                required
                maxLength={40}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 w-full rounded-input border border-line bg-page px-[15px] text-[15px] font-semibold text-ink"
              />

              {error && <p className="mt-3 text-[13px] font-semibold text-warning">{t(error)}</p>}

              <button type="submit" disabled={busy || !firstName.trim()} className={PRIMARY}>
                {busy ? t('form.sending') : t('auth.nameSave')}
              </button>
              <button
                type="button"
                onClick={() => navigate(next, { replace: true })}
                className="mt-3 w-full text-center text-[13px] font-bold text-ink-60 transition hover:text-ink"
              >
                {t('auth.nameSkip')}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
