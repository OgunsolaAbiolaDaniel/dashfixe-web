import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarketingShell from '../components/chrome/MarketingShell';
import { ChevronLeft } from '../components/icons';
import { ROUTES, TRADE_SLUGS, link, type TradeSlug } from '../routes';
import { useLang } from '../i18n';
import { api } from '../lib/api';
import { saveApplication } from '../lib/proApplication';
import type { StringKey } from '../i18n/strings';

/**
 * /pro/apply — the Dashfixe Pro application (rev 2.3): four short steps (about
 * you, your work, where and when, papers), a review with Edit links, then
 * POST /api/artisans/apply with the profile and consent. The reference that
 * comes back opens the applicant's status page (/pro/application).
 *
 * Each step checks itself before moving on; errors sit under the field and
 * focus jumps to the first one.
 */
const AREAS = ['Amora', 'Seixal', 'Corroios', 'Arrentela', 'Paio Pires', 'Fernão Ferro', 'Cruz de Pau'];
const EXPERIENCE: Array<[string, StringKey]> = [
  ['0-2', 'pro.apply.exp.a'],
  ['3-5', 'pro.apply.exp.b'],
  ['6-10', 'pro.apply.exp.c'],
  ['10+', 'pro.apply.exp.d'],
];
const AVAILABILITY: Array<[string, StringKey]> = [
  ['weekdays', 'pro.apply.av.weekdays'],
  ['evenings', 'pro.apply.av.evenings'],
  ['weekends', 'pro.apply.av.weekends'],
];
const LICENCES: Array<[string, StringKey]> = [
  ['dgeg', 'pro.apply.lic.dgeg'],
  ['gas', 'pro.apply.lic.gas'],
  ['none', 'pro.apply.lic.none'],
];
const STEPS: StringKey[] = ['pro.apply.s1', 'pro.apply.s2', 'pro.apply.s3', 'pro.apply.s4'];

type Draft = {
  fullName: string;
  phone: string;
  email: string;
  trade: TradeSlug | '';
  trades: string[];
  experience: string;
  areas: string[];
  availability: string[];
  transport: boolean | null;
  licences: string[];
  insurance: boolean | null;
  consent: boolean;
};
type Errors = Partial<Record<keyof Draft, StringKey>>;

const EMPTY: Draft = {
  fullName: '',
  phone: '',
  email: '',
  trade: '',
  trades: [],
  experience: '',
  areas: [],
  availability: [],
  transport: null,
  licences: [],
  insurance: null,
  consent: false,
};

function validate(step: number, d: Draft): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!d.fullName.trim()) e.fullName = 'pro.apply.err.name';
    if (d.phone.replace(/\D/g, '').length < 9) e.phone = 'pro.apply.err.phone';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = 'pro.apply.err.email';
  }
  if (step === 1) {
    if (!d.trade) e.trade = 'pro.apply.err.trade';
    if (!d.experience) e.experience = 'pro.apply.err.experience';
  }
  if (step === 2) {
    if (!d.areas.length) e.areas = 'pro.apply.err.areas';
    if (!d.availability.length) e.availability = 'pro.apply.err.availability';
    if (d.transport === null) e.transport = 'pro.apply.err.transport';
  }
  if (step === 3) {
    if (d.insurance === null) e.insurance = 'pro.apply.err.insurance';
    if (!d.consent) e.consent = 'pro.apply.err.consent';
  }
  return e;
}

const INPUT =
  'h-12 w-full rounded-input border border-line bg-page px-[15px] text-[15px] font-semibold text-ink placeholder:text-ink-30 aria-[invalid=true]:border-warning';

export default function ProApplyPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0–3: the steps; 4: review
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const card = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggle = (k: 'trades' | 'areas' | 'availability', v: string) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v]);
  // "None yet" and a licence can't both be true.
  const toggleLicence = (v: string) =>
    set('licences', v === 'none' ? (d.licences.includes('none') ? [] : ['none']) : d.licences.includes(v) ? d.licences.filter((x) => x !== v) : [...d.licences.filter((x) => x !== 'none'), v]);

  const go = (n: number) => {
    setStep(n);
    setErrors({});
    card.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  };

  const next = () => {
    const e = validate(step, d);
    const first = Object.keys(e)[0];
    if (first) {
      setErrors(e);
      document.getElementById(`apply-${first}`)?.focus();
      return;
    }
    go(step + 1);
  };

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    const r = await api<{ ok: true; reference: string }>('/api/artisans/apply', {
      fullName: d.fullName.trim(),
      phone: d.phone,
      email: d.email.trim(),
      trade: d.trade,
      consent: true,
      profile: {
        trades: d.trades,
        experience: d.experience,
        areas: d.areas,
        availability: d.availability,
        transport: !!d.transport,
        licences: d.licences,
        insurance: !!d.insurance,
      },
    });
    setBusy(false);
    if (!r.ok) {
      setFailed(true);
      return;
    }
    saveApplication({
      reference: r.data.reference,
      submittedAt: new Date().toISOString(),
      fullName: d.fullName.trim(),
      trade: d.trade,
      phone: d.phone.trim(),
      areas: d.areas,
    });
    navigate(ROUTES.proApplication);
  };

  const err = (k: keyof Draft) => (errors[k] ? t(errors[k]!) : undefined);
  const yesNo = (v: boolean | null) => (v === null ? '—' : t(v ? 'pro.apply.yes' : 'pro.apply.no'));
  const labelOf = (list: Array<[string, StringKey]>, v: string) => t(list.find(([x]) => x === v)?.[1] ?? 'pro.apply.none');
  const tradeName = (s: string) => t(`trades.${s as TradeSlug}` as const);

  return (
    <MarketingShell surface="pro">
      <section className="bg-page">
        <div className="mx-auto max-w-[680px] px-[clamp(18px,4vw,40px)] py-[clamp(32px,5vw,64px)]">
          <Link to={ROUTES.pro} className="mb-5 inline-flex items-center gap-1 text-[13.5px] font-bold text-ink-60 transition hover:text-ink">
            <ChevronLeft size={15} />
            {t('pro.apply.back')}
          </Link>
          <h1 className="mb-2 text-h2 text-ink">{t('pro.apply.title')}</h1>
          <p className="mb-7 text-lead text-ink-60">{t('pro.apply.lead')}</p>

          <p className="mb-2 text-[13px] font-bold text-ink-60">
            {step < 4 ? `${t('pro.apply.stepOf', { n: step + 1, total: 4 })} · ${t(STEPS[step]!)}` : t('pro.apply.review')}
          </p>
          <div aria-hidden="true" className="mb-5 grid grid-cols-4 gap-1.5">
            {STEPS.map((s, i) => (
              <span key={s} className={'h-1.5 rounded-full ' + (i < step ? 'bg-success' : i === step ? 'bg-brand' : 'bg-line')} />
            ))}
          </div>

          <div ref={card} className="scroll-mt-[100px] rounded-card border border-line-soft bg-panel p-[clamp(20px,4vw,32px)] shadow-card">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 4) next();
                else void submit();
              }}
            >
              <h2 className="mb-5 text-h3 text-ink">{step < 4 ? t(STEPS[step]!) : t('pro.apply.review')}</h2>

              {step === 0 && (
                <>
                  <Field id="apply-fullName" label={t('fa.apply.name')} error={err('fullName')}>
                    <input
                      id="apply-fullName"
                      autoComplete="name"
                      value={d.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      placeholder={t('fa.apply.name.ph')}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'apply-fullName-err' : undefined}
                      className={INPUT}
                    />
                  </Field>
                  <Field id="apply-phone" label={t('fa.apply.phone')} error={err('phone')}>
                    <input
                      id="apply-phone"
                      type="tel"
                      autoComplete="tel"
                      value={d.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="+351 ..."
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'apply-phone-err' : undefined}
                      className={INPUT}
                    />
                  </Field>
                  <Field id="apply-email" label={t('fa.apply.email')} error={err('email')}>
                    <input
                      id="apply-email"
                      type="email"
                      autoComplete="email"
                      value={d.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="name@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'apply-email-err' : undefined}
                      className={INPUT}
                    />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Chips
                    id="apply-trade"
                    type="radio"
                    legend={t('pro.apply.trade')}
                    error={err('trade')}
                    options={TRADE_SLUGS.map((s) => ({ value: s, label: tradeName(s) }))}
                    isOn={(v) => d.trade === v}
                    onToggle={(v) => {
                      set('trade', v as TradeSlug);
                      setD((x) => ({ ...x, trade: v as TradeSlug, trades: x.trades.filter((tr) => tr !== v) }));
                    }}
                  />
                  <Chips
                    id="apply-trades"
                    type="checkbox"
                    legend={t('pro.apply.others')}
                    options={TRADE_SLUGS.filter((s) => s !== d.trade).map((s) => ({ value: s, label: tradeName(s) }))}
                    isOn={(v) => d.trades.includes(v)}
                    onToggle={(v) => toggle('trades', v)}
                  />
                  <Chips
                    id="apply-experience"
                    type="radio"
                    legend={t('pro.apply.experience')}
                    error={err('experience')}
                    options={EXPERIENCE.map(([value, key]) => ({ value, label: t(key) }))}
                    isOn={(v) => d.experience === v}
                    onToggle={(v) => set('experience', v)}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <Chips
                    id="apply-areas"
                    type="checkbox"
                    legend={t('pro.apply.areas')}
                    error={err('areas')}
                    options={AREAS.map((a) => ({ value: a, label: a }))}
                    isOn={(v) => d.areas.includes(v)}
                    onToggle={(v) => toggle('areas', v)}
                  />
                  <Chips
                    id="apply-availability"
                    type="checkbox"
                    legend={t('pro.apply.availability')}
                    error={err('availability')}
                    options={AVAILABILITY.map(([value, key]) => ({ value, label: t(key) }))}
                    isOn={(v) => d.availability.includes(v)}
                    onToggle={(v) => toggle('availability', v)}
                  />
                  <Chips
                    id="apply-transport"
                    type="radio"
                    legend={t('pro.apply.transport')}
                    error={err('transport')}
                    options={[
                      { value: 'yes', label: t('pro.apply.yes') },
                      { value: 'no', label: t('pro.apply.no') },
                    ]}
                    isOn={(v) => (d.transport === null ? false : d.transport === (v === 'yes'))}
                    onToggle={(v) => set('transport', v === 'yes')}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <Chips
                    id="apply-licences"
                    type="checkbox"
                    legend={t('pro.apply.licences')}
                    options={LICENCES.map(([value, key]) => ({ value, label: t(key) }))}
                    isOn={(v) => d.licences.includes(v)}
                    onToggle={toggleLicence}
                  />
                  <Chips
                    id="apply-insurance"
                    type="radio"
                    legend={t('pro.apply.insurance')}
                    error={err('insurance')}
                    options={[
                      { value: 'yes', label: t('pro.apply.yes') },
                      { value: 'no', label: t('pro.apply.no') },
                    ]}
                    isOn={(v) => (d.insurance === null ? false : d.insurance === (v === 'yes'))}
                    onToggle={(v) => set('insurance', v === 'yes')}
                  />
                  <label className="flex cursor-pointer items-start gap-3 rounded-[16px] bg-page p-4">
                    <input
                      id="apply-consent"
                      type="checkbox"
                      checked={d.consent}
                      onChange={(e) => set('consent', e.target.checked)}
                      aria-invalid={!!errors.consent}
                      aria-describedby={errors.consent ? 'apply-consent-err' : undefined}
                      className="mt-0.5 h-5 w-5 flex-none accent-brand"
                    />
                    <span className="text-[14px] font-medium leading-[1.5] text-ink-80">
                      {t('pro.apply.consent')}{' '}
                      <Link to={link('privacy')} className="font-bold text-brand underline">
                        {t('pro.apply.consentLink')}
                      </Link>
                    </span>
                  </label>
                  {errors.consent && (
                    <p id="apply-consent-err" className="mt-2 text-[13px] font-semibold text-warning">
                      {t(errors.consent)}
                    </p>
                  )}
                </>
              )}

              {step === 4 && (
                <dl className="divide-y divide-line-rule">
                  {(
                    [
                      ['fa.apply.name', d.fullName, 0],
                      ['fa.apply.phone', d.phone, 0],
                      ['fa.apply.email', d.email, 0],
                      ['pro.apply.trade', d.trade ? tradeName(d.trade) : '—', 1],
                      ['pro.apply.others', d.trades.map(tradeName).join(', ') || '—', 1],
                      ['pro.apply.experience', labelOf(EXPERIENCE, d.experience), 1],
                      ['pro.apply.areas', d.areas.join(', '), 2],
                      ['pro.apply.availability', d.availability.map((v) => labelOf(AVAILABILITY, v)).join(', '), 2],
                      ['pro.apply.transport', yesNo(d.transport), 2],
                      ['pro.apply.licences', d.licences.map((v) => labelOf(LICENCES, v)).join(', ') || '—', 3],
                      ['pro.apply.insurance', yesNo(d.insurance), 3],
                    ] as Array<[StringKey, string, number]>
                  ).map(([key, value, at]) => (
                    <div key={key} className="flex items-baseline gap-3 py-3">
                      <dt className="w-[38%] flex-none text-[13px] font-semibold text-ink-40">{t(key)}</dt>
                      <dd className="min-w-0 flex-1 break-words text-[14.5px] font-semibold text-ink">{value}</dd>
                      <button
                        type="button"
                        onClick={() => go(at)}
                        aria-label={`${t('pro.apply.edit')}: ${t(key)}`}
                        className="flex-none text-[13px] font-bold text-brand transition hover:text-brand-hover"
                      >
                        {t('pro.apply.edit')}
                      </button>
                    </div>
                  ))}
                </dl>
              )}

              {failed && (
                <p role="alert" className="mt-4 text-[13px] font-semibold text-warning">
                  {t('form.error')}
                </p>
              )}

              <div className="mt-7 flex items-center gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => go(step - 1)}
                    className="h-ctl-lg rounded-btn border border-line bg-panel px-5 text-[15px] font-bold text-ink transition hover:bg-well"
                  >
                    {t('pro.apply.backBtn')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="ml-auto h-ctl-lg flex-1 rounded-btn bg-brand px-8 text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-hover disabled:opacity-60 sm:flex-none"
                >
                  {step < 4 ? t('pro.apply.continue') : busy ? t('form.sending') : t('pro.apply.send')}
                </button>
              </div>
            </form>
          </div>
          <p className="mt-4 text-center text-[12.5px] font-semibold text-ink-40">{t('fa.apply.micro')}</p>
        </div>
      </section>
    </MarketingShell>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="mb-[18px]">
      <label htmlFor={id} className="mb-[7px] block text-label text-ink-40">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] font-semibold text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

/** A group of choices as chips: real radios or checkboxes, styled. */
function Chips({
  id,
  legend,
  error,
  type,
  options,
  isOn,
  onToggle,
}: {
  id: string;
  legend: string;
  error?: string;
  type: 'radio' | 'checkbox';
  options: Array<{ value: string; label: string }>;
  isOn: (v: string) => boolean;
  onToggle: (v: string) => void;
}) {
  return (
    <fieldset className="mb-6" aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-2.5 text-label text-ink-40">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label key={o.value} className="cursor-pointer">
            <input
              id={i === 0 ? id : undefined}
              type={type}
              name={id}
              value={o.value}
              checked={isOn(o.value)}
              onChange={() => onToggle(o.value)}
              className="peer sr-only"
            />
            <span className="inline-flex h-10 items-center rounded-full border border-line bg-panel px-4 text-[14px] font-semibold text-ink-80 transition hover:border-ink-30 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-2 text-[13px] font-semibold text-warning">
          {error}
        </p>
      )}
    </fieldset>
  );
}
