import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/chrome/Header';
import { Chat, Mail, Phone } from '../components/icons';
import { useAuth } from '../auth';
import { api } from '../lib/api';
import { ROUTES, isTradeSlug } from '../routes';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * /ops — the founders' review of Dashfixe Pro applications (rev 2.8).
 *
 * For the team only: the server lets through a signed-in phone listed in
 * OPS_PHONES that has also entered OPS_PASSCODE (pilot login signs anyone in as
 * any number, so the phone alone proves nothing yet). Each application shows what
 * the applicant sent, one-tap Call / WhatsApp / Email, and the review: a private
 * note and new → called → approved or declined. Nothing here reaches the applicant.
 */
type Status = 'received' | 'called' | 'approved' | 'declined';
const STATUSES: Status[] = ['received', 'called', 'approved', 'declined'];

type Application = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  trade: string;
  reference?: string;
  createdAt: string;
  status: Status;
  note: string | null;
  reviewedAt: string | null;
  profile?: {
    trades: string[];
    experience: string;
    areas: string[];
    availability: string[];
    transport: boolean;
    licences: string[];
    insurance: boolean;
  };
};

/** "Report a problem" from a customer's job page (rev 2.9). */
type Report = {
  id: number;
  reference: string;
  phone: string;
  jobId: string;
  category: 'late' | 'price' | 'quality' | 'damage' | 'safety' | 'other';
  details: string | null;
  createdAt: string;
};

type View =
  | { kind: 'loading' }
  | { kind: 'off' }
  | { kind: 'denied' }
  | { kind: 'locked' }
  | { kind: 'error' }
  | { kind: 'list'; applications: Application[]; reports: Report[]; persistent: boolean };

type Section = 'applications' | 'reports';

const CARD = 'rounded-card border border-line-soft bg-panel p-[clamp(18px,3vw,26px)]';
const BTN = 'inline-flex h-10 items-center gap-2 rounded-btn px-4 text-[14px] font-bold transition disabled:opacity-60';

const PILL: Record<Status, string> = {
  received: 'bg-brand-tint text-brand-hover',
  called: 'bg-warning-tint text-warning',
  approved: 'bg-success-tint text-success',
  declined: 'bg-well text-ink-60',
};

const EXPERIENCE: Record<string, StringKey> = {
  '0-2': 'pro.apply.exp.a',
  '3-5': 'pro.apply.exp.b',
  '6-10': 'pro.apply.exp.c',
  '10+': 'pro.apply.exp.d',
};

function useWhen() {
  const { lang } = useLang();
  return (iso: string) =>
    new Intl.DateTimeFormat(lang === 'PT' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function StatusPill({ status }: { status: Status }) {
  const { t } = useLang();
  return <span className={`rounded-full px-3 py-1 text-[12px] font-extrabold ${PILL[status]}`}>{t(`ops.status.${status}`)}</span>;
}

function ApplicationCard({ app, onSaved }: { app: Application; onSaved: (next: Application) => void }) {
  const { t } = useLang();
  const when = useWhen();
  const [note, setNote] = useState(app.note ?? '');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const trade = (slug: string) => (isTradeSlug(slug) ? t(`trades.${slug}`) : slug);
  const p = app.profile;

  const save = async (status: Status) => {
    setBusy(true);
    setFailed(false);
    const r = await api<{ application: Application }>('/api/ops/applications/status', { id: app.id, status, note: note.trim() || null });
    setBusy(false);
    if (r.ok) onSaved(r.data.application);
    else setFailed(true);
  };

  const details: Array<[StringKey, string]> = p
    ? [
        ['ops.d.experience', EXPERIENCE[p.experience] ? t(EXPERIENCE[p.experience]!) : p.experience],
        ['ops.d.areas', p.areas.join(', ')],
        ['ops.d.hours', p.availability.map((a) => t(`pro.apply.av.${a}` as StringKey)).join(', ')],
        ['ops.d.licences', p.licences.filter((l) => l !== 'none').map((l) => t(`pro.apply.lic.${l}` as StringKey)).join(', ') || t('ops.none')],
        ['ops.transport', t(p.transport ? 'ops.yes' : 'ops.no')],
        ['ops.insurance', t(p.insurance ? 'ops.yes' : 'ops.no')],
      ]
    : [];

  return (
    <article className={CARD} aria-labelledby={`ops-app-${app.id}`}>
      <div className="mb-3 flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="mr-auto min-w-0">
          <h2 id={`ops-app-${app.id}`} className="text-[18px] font-extrabold tracking-[-.01em] text-ink">
            {app.fullName}
          </h2>
          <p className="mt-0.5 text-[13.5px] font-semibold text-ink-60">
            {trade(app.trade)}
            {p?.trades.length ? ` · ${t('ops.also', { trades: p.trades.map(trade).join(', ') })}` : ''}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      <p className="mb-4 text-[12.5px] font-semibold text-ink-40">
        {app.reference ? `${app.reference} · ` : ''}
        {t('ops.sent', { date: when(app.createdAt) })}
        {app.reviewedAt ? ` · ${t('ops.updated', { date: when(app.reviewedAt) })}` : ''}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <a href={`tel:${app.phone}`} className={`${BTN} bg-ink text-white hover:bg-ink-80 hover:text-white`}>
          <Phone size={15} />
          {t('ops.call')} {app.phone}
        </a>
        <a
          href={`https://wa.me/${app.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className={`${BTN} border border-line bg-panel text-ink hover:border-ink-30 hover:text-ink`}
        >
          <Chat size={15} />
          {t('ops.whatsapp')}
        </a>
        <a href={`mailto:${app.email}`} className={`${BTN} border border-line bg-panel text-ink hover:border-ink-30 hover:text-ink`}>
          <Mail size={15} />
          <span className="max-w-[220px] truncate">{app.email}</span>
        </a>
      </div>

      {p ? (
        <dl className="mb-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {details.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-[12px] font-semibold text-ink-40">{t(key)}</dt>
              <dd className="break-words text-[14px] font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mb-4 text-[13.5px] font-medium text-ink-60">{t('ops.shortForm')}</p>
      )}

      <label htmlFor={`ops-note-${app.id}`} className="mb-1.5 block text-label text-ink-40">
        {t('ops.note')}
      </label>
      <textarea
        id={`ops-note-${app.id}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={2}
        className="mb-3 block w-full resize-y rounded-input border border-line bg-page px-3.5 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-brand"
      />

      <div role="group" aria-label={t('ops.actions', { name: app.fullName })} className="flex flex-wrap items-center gap-2">
        {STATUSES.filter((s) => s !== app.status).map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => void save(s)}
            className={
              BTN +
              ' ' +
              (s === 'approved'
                ? 'bg-brand text-white hover:bg-brand-hover'
                : s === 'declined'
                  ? 'border border-line bg-panel text-ink-80 hover:border-ink-30'
                  : 'border border-line bg-panel text-ink hover:border-ink-30')
            }
          >
            {t(`ops.mark.${s}`)}
          </button>
        ))}
        {note.trim() !== (app.note ?? '') && (
          <button type="button" disabled={busy} onClick={() => void save(app.status)} className="px-2 text-[14px] font-bold text-brand transition hover:text-brand-hover">
            {t('ops.saveNote')}
          </button>
        )}
        {failed && (
          <span role="alert" className="text-[13px] font-semibold text-warning">
            {t('ops.saveErr')}
          </span>
        )}
      </div>
    </article>
  );
}

function ReportCard({ report }: { report: Report }) {
  const { t } = useLang();
  const when = useWhen();
  return (
    <article className={CARD} aria-labelledby={`ops-report-${report.id}`}>
      <div className="mb-1.5 flex flex-wrap items-start gap-x-4 gap-y-2">
        <h2 id={`ops-report-${report.id}`} className="mr-auto text-[17px] font-extrabold tracking-[-.01em] text-ink">
          {t(`report.cat.${report.category}`)}
        </h2>
        <span className={`rounded-full px-3 py-1 text-[12px] font-extrabold ${report.category === 'safety' ? PILL.called : PILL.received}`}>
          {report.reference}
        </span>
      </div>
      <p className="mb-3 text-[12.5px] font-semibold text-ink-40">
        {t('ops.reports.job', { id: report.jobId })} · {t('ops.sent', { date: when(report.createdAt) })}
      </p>
      <p className="mb-4 whitespace-pre-line text-[14.5px] font-medium leading-[1.55] text-ink-80">{report.details ?? t('ops.reports.noDetails')}</p>
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${report.phone}`} className={`${BTN} bg-ink text-white hover:bg-ink-80 hover:text-white`}>
          <Phone size={15} />
          {t('ops.call')} {report.phone}
        </a>
        <a
          href={`https://wa.me/${report.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className={`${BTN} border border-line bg-panel text-ink hover:border-ink-30 hover:text-ink`}
        >
          <Chat size={15} />
          {t('ops.whatsapp')}
        </a>
      </div>
    </article>
  );
}

function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const { t } = useLang();
  const [passcode, setPasscode] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className={`${CARD} mx-auto max-w-[440px]`}
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setWrong(false);
        void api('/api/ops/unlock', { passcode }).then((r) => {
          setBusy(false);
          if (r.ok) onUnlocked();
          else setWrong(true);
        });
      }}
    >
      <h1 className="mb-2 text-h3 text-ink">{t('ops.locked.title')}</h1>
      <p className="mb-5 text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('ops.locked.body')}</p>
      <label htmlFor="ops-passcode" className="mb-1.5 block text-label text-ink-40">
        {t('ops.passcode')}
      </label>
      <input
        id="ops-passcode"
        type="password"
        autoComplete="off"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        aria-invalid={wrong}
        aria-describedby={wrong ? 'ops-passcode-err' : undefined}
        className="mb-2 block h-12 w-full rounded-input border border-line bg-page px-[15px] text-[15px] font-semibold text-ink outline-none focus:border-brand"
      />
      {wrong && (
        <p id="ops-passcode-err" role="alert" className="mb-2 text-[13px] font-semibold text-warning">
          {t('ops.wrong')}
        </p>
      )}
      <button type="submit" disabled={busy || !passcode} className="mt-3 inline-flex h-ctl-lg w-full items-center justify-center rounded-btn bg-brand text-[15px] font-bold text-white transition hover:bg-brand-hover disabled:opacity-60">
        {t('ops.unlock')}
      </button>
    </form>
  );
}

function Notice({ title, body }: { title: StringKey; body: string }) {
  const { t } = useLang();
  return (
    <section className={`${CARD} mx-auto max-w-[520px]`}>
      <h1 className="mb-2 text-h3 text-ink">{t(title)}</h1>
      <p className="text-[14.5px] font-medium leading-[1.55] text-ink-60">{body}</p>
    </section>
  );
}

export default function OpsPage() {
  const { t } = useLang();
  const { signedIn, checking, phone } = useAuth();
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [section, setSection] = useState<Section>('applications');

  const load = useCallback(() => {
    void Promise.all([
      api<{ applications: Application[]; persistent: boolean }>('/api/ops/applications'),
      api<{ reports: Report[] }>('/api/ops/reports'),
    ]).then(([r, reports]) => {
      if (r.ok) {
        return setView({ kind: 'list', applications: r.data.applications, reports: reports.ok ? reports.data.reports : [], persistent: r.data.persistent });
      }
      if (r.error === 'ops_disabled') return setView({ kind: 'off' });
      if (r.error === 'not_ops') return setView({ kind: 'denied' });
      if (r.error === 'ops_locked') return setView({ kind: 'locked' });
      setView({ kind: 'error' });
    });
  }, []);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn, load]);

  if (checking) return null;
  if (!signedIn) return <Navigate to={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.ops)}`} replace />;

  const lock = () => void api('/api/ops/lock', {}).then(() => setView({ kind: 'locked' }));
  const replace = (next: Application) =>
    setView((v) => (v.kind === 'list' ? { ...v, applications: v.applications.map((a) => (a.id === next.id ? next : a)) } : v));

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Header layout="full" minimal surface="pro" />
      <main className="mx-auto w-full max-w-[920px] flex-1 px-[clamp(18px,4vw,40px)] py-[clamp(28px,5vw,56px)]">
        {view.kind === 'off' && <Notice title="ops.off.title" body={t('ops.off.body')} />}
        {view.kind === 'denied' && <Notice title="ops.denied.title" body={t('ops.denied.body', { phone: phone ?? '' })} />}
        {view.kind === 'locked' && <Unlock onUnlocked={load} />}
        {view.kind === 'error' && (
          <section className={`${CARD} mx-auto max-w-[520px]`}>
            <p role="alert" className="mb-3 text-[14.5px] font-semibold text-ink">
              {t('ops.loadErr')}
            </p>
            <button type="button" onClick={load} className="text-[14px] font-bold text-brand hover:text-brand-hover">
              {t('ops.retry')}
            </button>
          </section>
        )}
        {view.kind === 'list' && (
          <>
            <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3">
              <div className="mr-auto">
                <p className="mb-1.5 text-label text-brand-hover">{t('ops.kicker')}</p>
                <h1 className="text-h2 text-ink">{t(section === 'reports' ? 'ops.reports.title' : 'ops.title')}</h1>
                <p className="mt-1.5 max-w-[560px] text-lead text-ink-60">{t(section === 'reports' ? 'ops.reports.lead' : 'ops.lead')}</p>
              </div>
              <button type="button" onClick={lock} className="text-[14px] font-bold text-ink-60 transition hover:text-ink">
                {t('ops.lock')}
              </button>
            </div>

            <div role="group" aria-label={t('ops.show')} className="mb-5 inline-flex rounded-full bg-well p-1">
              {(
                [
                  ['applications', 'ops.title', view.applications.length],
                  ['reports', 'ops.reports.title', view.reports.length],
                ] as const
              ).map(([id, key, n]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={section === id}
                  onClick={() => setSection(id)}
                  className={
                    'inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-bold transition ' +
                    (section === id ? 'bg-panel text-ink shadow-sm' : 'text-ink-60 hover:text-ink')
                  }
                >
                  {t(key)}
                  <span className={section === id ? 'text-ink-60' : 'text-ink-40'}>{n}</span>
                </button>
              ))}
            </div>

            {!view.persistent && (
              <p role="note" className="mb-5 rounded-[14px] bg-warning-tint px-4 py-3 text-[13.5px] font-semibold text-warning">
                {t('ops.notSaved')}
              </p>
            )}

            {section === 'reports' && (
              <div className="flex flex-col gap-4">
                {view.reports.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
                {!view.reports.length && <p className={`${CARD} text-[14.5px] font-medium text-ink-60`}>{t('ops.reports.empty')}</p>}
              </div>
            )}

            {section === 'applications' && (
            <>
            <div role="group" aria-label={t('ops.filters')} className="mb-5 flex flex-wrap gap-2">
              {(['all', ...STATUSES] as const).map((s) => {
                const n = s === 'all' ? view.applications.length : view.applications.filter((a) => a.status === s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={filter === s}
                    onClick={() => setFilter(s)}
                    className={
                      'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition ' +
                      (filter === s ? 'border-brand bg-brand text-white' : 'border-line bg-panel text-ink-80 hover:border-ink-30')
                    }
                  >
                    {t(s === 'all' ? 'ops.filter.all' : `ops.status.${s}`)}
                    <span className={filter === s ? 'text-white/85' : 'text-ink-40'}>{n}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              {view.applications
                .filter((a) => filter === 'all' || a.status === filter)
                .map((a) => (
                  <ApplicationCard key={`${a.id}:${a.reviewedAt ?? ''}`} app={a} onSaved={replace} />
                ))}
              {!view.applications.some((a) => filter === 'all' || a.status === filter) && (
                <p className={`${CARD} text-[14.5px] font-medium text-ink-60`}>{t('ops.empty')}</p>
              )}
            </div>
            </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
