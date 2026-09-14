import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, ChevronLeft, Close, ImageIcon, MapPin, Plus, Send } from '../icons';
import { clockIn, formatEuro } from '../../lib/jobs';
import { payout, quote, recordPaid, type QuoteLine } from '../../lib/pro';
import { translate } from '../../i18n/strings';
import { useLang } from '../../i18n';
import { link } from '../../routes';
import { OFFER_SECONDS, PACE, type Stage } from './stages';

/**
 * One sample job, end to end, as the artisan sees it (designs/Dashfixe Artisan
 * App.dc.html, screens 02–09): the offer, the brief with the address masked, the
 * chat, the estimate builder (the core tool), approval unlocking the address, the
 * drive, an optional second estimate, and closing the job — which is what charges.
 *
 * Scripted: Sofia is a sample customer and her replies and approvals are timed.
 * The money is real arithmetic (lib/pro). Nothing leaves the browser.
 */
type Props = {
  stage: Stage;
  go: (stage: Stage) => void;
  /** The offer was declined or ran out. */
  onPass: (why: 'declined' | 'expired') => void;
  /** Paid: back to Today. */
  onDone: () => void;
};

type T = ReturnType<typeof useLang>['t'];
type Msg = { from: 'me' | 'them'; text: string };

const ADDRESS = 'Rua da Cooperativa 14';
const REPLIES = ['pro.chat.r1', 'pro.chat.r2'] as const;

let seq = 0;
const id = () => `l${++seq}`;

function baseLines(t: T): QuoteLine[] {
  return [
    { id: id(), kind: 'part', label: t('pro.est.l.cartridge'), detail: t('pro.est.d.van'), amount: 12.4 },
    { id: id(), kind: 'part', label: t('pro.est.l.silicone'), detail: t('pro.est.d.van'), amount: 3.2 },
    { id: id(), kind: 'labour', label: t('pro.est.l.labour'), detail: t('pro.est.d.hour'), amount: 28 },
    { id: id(), kind: 'callout', label: t('pro.est.l.callout'), detail: '1.4 km', amount: 6 },
  ];
}

function extraLines(t: T): QuoteLine[] {
  return [
    { id: id(), kind: 'part', label: t('pro.est.l.hose'), detail: '', amount: 8.9 },
    { id: id(), kind: 'labour', label: t('pro.est.l.labour15'), detail: '', amount: 7 },
  ];
}

const PRIMARY =
  'flex h-[58px] w-full items-center justify-center gap-2 rounded-[18px] bg-brand text-[17px] font-bold text-white shadow-brand transition hover:bg-brand-hover disabled:cursor-default disabled:opacity-50 disabled:shadow-none';
const CARD = 'rounded-[22px] border border-line-soft bg-panel';

export default function JobFlow({ stage, go, onPass, onDone }: Props) {
  const { t } = useLang();
  const [lines, setLines] = useState<QuoteLine[]>(() => baseLines(t));
  const [extra, setExtra] = useState<QuoteLine[]>(() => extraLines(t));
  const [note, setNote] = useState(() => t('pro.extra.note'));
  const [sent, setSent] = useState<'none' | 'base' | 'extra'>('none');
  const [extraOk, setExtraOk] = useState(false);
  const [times, setTimes] = useState<{ approved?: string; driving?: string; arrived?: string; paid?: string }>({});
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: 'them', text: t('pro.job.quote') }]);
  const [reply, setReply] = useState(0);
  const [typing, setTyping] = useState(false);
  const [checks, setChecks] = useState([false, false, false]);

  // Scripted replies and approvals; cleared if the walkthrough restarts mid-way.
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((n) => window.clearTimeout(n));
  }, []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const base = quote(lines);
  const add = quote(extra);
  const total = Math.round((base.total + (extraOk ? add.total : 0)) * 100) / 100;
  const final = payout(total);

  if (stage === 'offer') return <Offer net={base.net} onAccept={() => go('brief')} onPass={onPass} />;

  if (stage === 'brief') {
    return (
      <Screen
        top={<TopBar title={t('pro.brief.title')} chip={<Chip tone="success">{t('pro.brief.accepted')}</Chip>} />}
        footer={
          <button type="button" onClick={() => go('chat')} className={PRIMARY}>
            {t('pro.brief.message')}
          </button>
        }
      >
        <Photo />
        <h2 className="mb-2 mt-4 text-[26px] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">{t('pro.job.title')}</h2>
        <p className="mb-4 text-[15px] font-medium leading-[1.5] text-ink-60">“{t('pro.job.quote')}”</p>
        <div className={`${CARD} mb-4 overflow-hidden`}>
          <Row lead={<Avatar>SL</Avatar>} title="Sofia Lima" sub={t('pro.brief.jobs')} />
          <Row lead={<Well><MapPin size={17} /></Well>} title={t('pro.brief.area')} sub={t('pro.brief.masked')} />
          <Row lead={<Well><Check size={17} /></Well>} title={t('pro.brief.home')} sub={t('pro.brief.noCode')} last />
        </div>
        <p className="rounded-[18px] bg-brand-tint px-4 py-3.5 text-[13.5px] font-medium leading-[1.5] text-ink-80">{t('pro.brief.info')}</p>
      </Screen>
    );
  }

  if (stage === 'chat') {
    const next = REPLIES[reply];
    const send = () => {
      if (!next) return;
      setMsgs((m) => [...m, { from: 'me', text: t(next) }]);
      setReply((r) => r + 1);
      if (reply === 0) {
        setTyping(true);
        after(PACE.reply, () => {
          setTyping(false);
          setMsgs((m) => [...m, { from: 'them', text: t('pro.chat.a1') }]);
        });
      }
    };
    return (
      <Screen
        top={
          <TopBar
            onBack={() => go('brief')}
            title="Sofia Lima"
            sub={<span className="flex items-center gap-1.5 text-success"><i className="block h-1.5 w-1.5 rounded-full bg-success" />{t('pro.chat.online')}</span>}
          />
        }
        footer={
          <div className="flex flex-col gap-2.5">
            {next && !typing && (
              <div>
                <p className="mb-1.5 text-label text-ink-40">{t('pro.chat.suggested')}</p>
                <button
                  type="button"
                  onClick={send}
                  className="w-full rounded-[16px] border border-brand/30 bg-brand-tint px-4 py-3 text-left text-[14px] font-semibold leading-[1.45] text-brand-hover transition hover:bg-brand-tint-hover"
                >
                  {t(next)}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => go('estimate')}
              className="flex h-[52px] items-center justify-center gap-2 rounded-[16px] bg-ink text-[15.5px] font-bold text-white transition hover:bg-ink-80"
            >
              {t('pro.chat.build')}
            </button>
          </div>
        }
      >
        <ol aria-live="polite" className="flex flex-col gap-2.5">
          <li className="self-center rounded-full bg-canvas px-3.5 py-1.5 text-[12px] font-semibold text-ink-40">{t('pro.chat.today')}</li>
          <li className="self-start">
            <Photo small />
          </li>
          {msgs.map((m, i) => (
            <li
              key={i}
              className={
                'max-w-[82%] px-4 py-3 text-[15px] leading-[1.5] ' +
                (m.from === 'me'
                  ? 'self-end rounded-[20px_20px_6px_20px] bg-brand text-white'
                  : 'self-start rounded-[20px_20px_20px_6px] border border-line-soft bg-panel text-ink')
              }
            >
              {m.text}
            </li>
          ))}
          {typing && (
            <li className="self-start rounded-[20px_20px_20px_6px] border border-line-soft bg-panel px-4 py-3 text-[13px] font-semibold text-ink-40">
              {t('pro.chat.typing')}
            </li>
          )}
        </ol>
      </Screen>
    );
  }

  if (stage === 'estimate') {
    const waiting = sent === 'base';
    const ready = base.total > 0 && lines.every((l) => l.label.trim());
    return (
      <Screen
        top={
          <TopBar
            onBack={waiting ? undefined : () => go('chat')}
            title={t('pro.est.title')}
            chip={<Chip tone={waiting ? 'brand' : 'plain'}>{t(waiting ? 'pro.est.sent' : 'pro.est.draft')}</Chip>}
          />
        }
        footer={
          waiting ? (
            <p role="status" className="flex h-[58px] items-center justify-center gap-2.5 rounded-[18px] bg-brand-tint text-[14.5px] font-bold text-brand-hover">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              {t('pro.est.waiting')}
            </p>
          ) : (
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                setSent('base');
                after(PACE.approve, () => {
                  setSent('none');
                  setTimes((x) => ({ ...x, approved: clockIn(0) }));
                  go('approved');
                });
              }}
              className={PRIMARY}
            >
              {t('pro.est.send')}
            </button>
          )
        }
      >
        <LineEditor lines={lines} setLines={setLines} disabled={waiting} />
        <Totals q={base} />
      </Screen>
    );
  }

  if (stage === 'approved') {
    return (
      <Screen
        footer={
          <button
            type="button"
            onClick={() => {
              setTimes((x) => ({ ...x, driving: clockIn(0) }));
              go('driving');
            }}
            className={PRIMARY}
          >
            <Send size={18} />
            {t('pro.ok.drive')}
          </button>
        }
      >
        <BigCheck />
        <p className="mb-2.5 text-[12.5px] font-extrabold uppercase tracking-[.14em] text-success">{t('pro.ok.eyebrow')}</p>
        <h2 className="mb-2.5 text-[34px] font-extrabold leading-[1.05] tracking-[-.035em] text-ink">
          {t('pro.ok.locked', { total: formatEuro(base.total) })}
          <br />
          {t('pro.ok.go')}
        </h2>
        <p className="mb-5 text-[15.5px] font-medium leading-[1.5] text-ink-60">{t('pro.ok.body', { time: times.approved ?? '' })}</p>
        <Address />
        <Split pays={base.total} receive={base.net} />
      </Screen>
    );
  }

  if (stage === 'driving') {
    return (
      <Screen
        flush
        footer={
          <button
            type="button"
            onClick={() => {
              setTimes((x) => ({ ...x, arrived: clockIn(0) }));
              go('onsite');
            }}
            className="flex h-16 w-full items-center justify-center rounded-[20px] bg-ink text-[18px] font-extrabold text-white transition hover:bg-ink-80"
          >
            {t('pro.drive.arrived')}
          </button>
        }
      >
        <Route />
        <div className="relative z-[2] -mt-6 rounded-t-[28px] bg-page px-5 pt-5">
          <div className="mb-5 flex items-end gap-3">
            <span className="mr-auto">
              <span className="mb-1 block text-[12.5px] font-extrabold uppercase tracking-[.12em] text-brand">{t('pro.drive.to')}</span>
              <span className="block text-[30px] font-extrabold leading-none tracking-[-.03em] text-ink">6 min · 1.4 km</span>
            </span>
            <span className="whitespace-nowrap rounded-full bg-success-tint px-3.5 py-2 text-[14px] font-bold text-success">{formatEuro(base.net)}</span>
          </div>
          <ol className="flex flex-col gap-2.5">
            <Step done label={t('pro.drive.s1')} time={times.approved} />
            <Step done label={t('pro.drive.s2')} time={times.driving} />
            <Step label={t('pro.drive.s3')} />
          </ol>
        </div>
      </Screen>
    );
  }

  if (stage === 'onsite') {
    return (
      <Screen
        footer={
          <div className="flex flex-col gap-2.5">
            {!extraOk && (
              <button
                type="button"
                onClick={() => go('extra')}
                className="flex h-[52px] items-center justify-center rounded-[16px] border border-line bg-panel text-[15px] font-bold text-ink transition hover:bg-well"
              >
                {t('pro.site.extra')}
              </button>
            )}
            <button type="button" onClick={() => go('close')} className={PRIMARY}>
              {t('pro.site.finish')}
            </button>
          </div>
        }
      >
        <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[.14em] text-brand">{t('pro.site.eyebrow', { time: times.arrived ?? '' })}</p>
        <h2 className="mb-2 text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-ink">{t('pro.site.title')}</h2>
        <p className="mb-5 text-[15px] font-medium leading-[1.5] text-ink-60">{t('pro.site.body')}</p>
        {extraOk && (
          <p role="status" className="mb-4 flex items-center gap-2.5 rounded-[18px] border border-success/25 bg-success-tint px-4 py-3.5 text-[14px] font-bold text-success">
            <Check size={17} />
            {t('pro.site.extraOk', { total: formatEuro(total) })}
          </p>
        )}
        <div className={`${CARD} px-4 py-1`}>
          <Money label={t('pro.site.agreed')} value={formatEuro(base.total)} />
          {extraOk && <Money label={t('pro.site.second')} value={formatEuro(add.total)} />}
          <Money label={t('pro.close.total')} value={formatEuro(total)} strong />
        </div>
      </Screen>
    );
  }

  if (stage === 'extra') {
    const waiting = sent === 'extra';
    return (
      <Screen
        top={<TopBar onBack={waiting ? undefined : () => go('onsite')} title={t('pro.extra.bar')} />}
        footer={
          waiting ? (
            <p role="status" className="flex h-[58px] items-center justify-center gap-2.5 rounded-[18px] bg-brand-tint text-[14.5px] font-bold text-brand-hover">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              {t('pro.extra.waiting')}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={add.total <= 0}
                onClick={() => {
                  setSent('extra');
                  after(PACE.approve, () => {
                    setSent('none');
                    setExtraOk(true);
                    go('onsite');
                  });
                }}
                className={PRIMARY}
              >
                {t('pro.extra.send')}
              </button>
              <button type="button" onClick={() => go('close')} className="text-[15px] font-bold text-ink-60 transition hover:text-ink">
                {t('pro.extra.skip')}
              </button>
            </div>
          )
        }
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning-tint px-3.5 py-2 text-[13px] font-bold text-warning">
          {t('pro.extra.found')}
        </span>
        <h2 className="mb-2 text-[28px] font-extrabold leading-[1.1] tracking-[-.03em] text-ink">{t('pro.extra.title')}</h2>
        <p className="mb-4 text-[15px] font-medium leading-[1.5] text-ink-60">{t('pro.extra.body')}</p>
        <div className="mb-4 flex items-center gap-2.5">
          <PhotoTile label={t('pro.photo.add')} />
          <span className="flex-1 text-[13px] font-medium leading-[1.5] text-ink-60">{t('pro.extra.photoHint')}</span>
        </div>
        <label htmlFor="extra-note" className="mb-1.5 block text-label text-ink-40">
          {t('pro.extra.noteLabel')}
        </label>
        <textarea
          id="extra-note"
          rows={3}
          value={note}
          disabled={waiting}
          onChange={(e) => setNote(e.target.value)}
          className="mb-4 w-full resize-none rounded-[18px] border border-line bg-panel px-4 py-3 text-[15px] leading-[1.5] text-ink-80"
        />
        <LineEditor lines={extra} setLines={setExtra} disabled={waiting} />
        <div className="flex items-baseline rounded-[20px] bg-ink px-5 py-4">
          <span className="mr-auto">
            <span className="block text-[16px] font-bold text-white">{t('pro.extra.additional')}</span>
            <span className="mt-0.5 block text-[12.5px] text-onink">
              {t('pro.extra.becomes', { total: formatEuro(Math.round((base.total + add.total) * 100) / 100) })}
            </span>
          </span>
          <span className="text-[28px] font-extrabold tracking-[-.03em] text-white">{formatEuro(add.total)}</span>
        </div>
      </Screen>
    );
  }

  if (stage === 'close') {
    const items = ['pro.close.c1', 'pro.close.c2', 'pro.close.c3'] as const;
    const ready = checks.every(Boolean);
    return (
      <Screen
        footer={
          <div>
            {!ready && <p className="mb-2 text-center text-[12.5px] font-semibold text-ink-40">{t('pro.close.hint')}</p>}
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                recordPaid({ initials: 'SL', title: { EN: translate('EN', 'pro.job.title'), PT: translate('PT', 'pro.job.title') }, total });
                setTimes((x) => ({ ...x, paid: clockIn(0) }));
                go('paid');
              }}
              className="flex h-[60px] w-full items-center justify-center rounded-[18px] bg-success text-[17px] font-extrabold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-50"
            >
              {t('pro.close.charge')}
            </button>
          </div>
        }
      >
        <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[.14em] text-brand">{t('pro.close.eyebrow')}</p>
        <h2 className="mb-4 text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-ink">{t('pro.close.title')}</h2>
        <p className="mb-2.5 text-label text-ink-40">{t('pro.close.proof')}</p>
        <div className="mb-5 flex gap-2.5">
          <PhotoTile label={t('pro.close.before')} />
          <PhotoTile label={t('pro.close.after')} />
        </div>
        <p className="mb-2.5 text-label text-ink-40">{t('pro.close.checklist')}</p>
        <div className={`${CARD} mb-5 overflow-hidden`}>
          {items.map((key, i) => (
            <label key={key} className={'flex cursor-pointer items-center gap-3 px-4 py-3.5' + (i < items.length - 1 ? ' border-b border-line-rule' : '')}>
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] border-2 border-line text-white transition peer-checked:border-success peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40"
              >
                {checks[i] && <Check size={15} strokeWidth={3} />}
              </span>
              <span className={'text-[15px] font-semibold ' + (checks[i] ? 'text-ink' : 'text-ink-60')}>{t(key)}</span>
            </label>
          ))}
        </div>
        <div className="rounded-[22px] bg-ink p-[18px]">
          <div className="mb-2 flex text-[13.5px] text-onink">
            <span className="mr-auto">{t('pro.close.total')}</span>
            <span className="font-semibold text-white">{formatEuro(total)}</span>
          </div>
          <div className="mb-3 flex text-[13.5px] text-onink">
            <span className="mr-auto">{t('pro.close.commission')}</span>
            <span className="font-semibold text-white">{formatEuro(-final.commission)}</span>
          </div>
          <div className="flex items-baseline border-t border-white/15 pt-3">
            <span className="mr-auto text-[16px] font-bold text-white">{t('pro.close.payout')}</span>
            <span className="text-[28px] font-extrabold tracking-[-.03em] text-success-bright">{formatEuro(final.net)}</span>
          </div>
        </div>
      </Screen>
    );
  }

  // paid
  return (
    <Screen
      footer={
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={onDone} className={PRIMARY}>
            {t('pro.paid.back')}
          </button>
          <Link to={link('artisanApply')} className="text-[15px] font-bold text-brand transition hover:text-brand-hover">
            {t('fa.hero.apply')}
          </Link>
        </div>
      }
    >
      <BigCheck />
      <p className="mb-2.5 text-[12.5px] font-extrabold uppercase tracking-[.14em] text-success">{t('pro.paid.eyebrow', { time: times.paid ?? '' })}</p>
      <h2 className="mb-2.5 text-[34px] font-extrabold leading-[1.05] tracking-[-.035em] text-ink">{t('pro.paid.title', { net: formatEuro(final.net) })}</h2>
      <p className="mb-5 text-[15.5px] font-medium leading-[1.5] text-ink-60">{t('pro.paid.body')}</p>
      <Split pays={total} receive={final.net} />
    </Screen>
  );
}

/** Screen 02 — the offer: one decision, with the take-home stated before accepting. */
function Offer({ net, onAccept, onPass }: { net: number; onAccept: () => void; onPass: Props['onPass'] }) {
  const { t } = useLang();
  const [left, setLeft] = useState(OFFER_SECONDS);
  useEffect(() => {
    const tick = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    const expire = window.setTimeout(() => onPass('expired'), OFFER_SECONDS * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(expire);
    };
  }, [onPass]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#070d22] text-white">
      <span aria-hidden="true" className="absolute -left-28 -top-32 h-[400px] w-[420px] rounded-full bg-[radial-gradient(circle,#2563eb_0%,rgba(37,99,235,0)_68%)] blur-[40px]" />
      <span aria-hidden="true" className="absolute -bottom-20 -right-36 h-[360px] w-[380px] rounded-full bg-[radial-gradient(circle,#16a34a_0%,rgba(22,163,74,0)_66%)] opacity-70 blur-[48px]" />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6 pt-7">
        <p className="mb-2.5 text-center text-[12.5px] font-extrabold uppercase tracking-[.16em] text-brand-on-dark">{t('pro.offer.eyebrow')}</p>
        <h2 className="mb-6 text-center text-[34px] font-extrabold leading-[1.05] tracking-[-.035em]">{t('pro.job.title')}</h2>
        <div className="mb-3.5 rounded-[26px] border border-white/20 bg-white/10 p-4 backdrop-blur-[18px]">
          <div className="mb-3.5 grid h-[130px] place-items-center rounded-[18px] bg-white/10 text-[12.5px] font-semibold text-white/75">
            <span className="flex items-center gap-2">
              <ImageIcon size={17} />
              {t('pro.photo.sample')}
            </span>
          </div>
          <p className="text-[15px] leading-[1.5]">“{t('pro.job.quote')}”</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['pro.offer.home', 'pro.offer.floor'] as const).map((k) => (
              <span key={k} className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold">
                {t(k)}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-5 flex gap-2.5">
          <Tile value="6 min" label={t('pro.offer.drive')} />
          <Tile value="~1 h" label={t('pro.offer.work')} />
          <Tile value={formatEuro(net)} label={t('pro.offer.keep')} green />
        </div>
        <div className="mt-auto">
          <div aria-hidden="true" className="mb-2 h-[5px] overflow-hidden rounded-full bg-white/15">
            <div className="h-[5px] rounded-full bg-success-bright transition-[width] duration-1000 ease-linear" style={{ width: `${(left / OFFER_SECONDS) * 100}%` }} />
          </div>
          <p className="mb-4 text-center text-[13px] font-semibold text-white/75">{t('pro.offer.expires', { s: left })}</p>
          <button
            type="button"
            onClick={onAccept}
            className="flex h-16 w-full items-center justify-center rounded-[20px] bg-success-bright text-[19px] font-extrabold text-[#04301e] shadow-[0_14px_34px_-12px_rgba(52,211,153,.8)] transition hover:brightness-105"
          >
            {t('pro.offer.accept')}
          </button>
          <button type="button" onClick={() => onPass('declined')} className="mt-3 w-full py-2 text-[16px] font-bold text-white/75 transition hover:text-white">
            {t('pro.offer.decline')}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Screen 05 — the estimate builder: every line editable, parts and labour addable. */
function LineEditor({ lines, setLines, disabled }: { lines: QuoteLine[]; setLines: (fn: (l: QuoteLine[]) => QuoteLine[]) => void; disabled: boolean }) {
  const { t } = useLang();
  const kind = { part: 'pro.est.k.part', labour: 'pro.est.k.labour', callout: 'pro.est.k.callout' } as const;
  const patch = (lineId: string, p: Partial<QuoteLine>) => setLines((ls) => ls.map((l) => (l.id === lineId ? { ...l, ...p } : l)));

  return (
    <fieldset disabled={disabled} className="mb-4">
      <legend className="sr-only">{t('pro.est.title')}</legend>
      <ul className={`${CARD} mb-3 overflow-hidden`}>
        {lines.map((l, i) => {
          const name = l.label.trim() || t(l.kind === 'labour' ? 'pro.est.addLabour' : 'pro.est.addPart');
          return (
            <li key={l.id} className={'flex items-center gap-2.5 px-3.5 py-3' + (i < lines.length - 1 ? ' border-b border-line-rule' : '')}>
              <span
                aria-hidden="true"
                className={
                  'grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] text-[11px] font-extrabold ' +
                  (l.kind === 'part' ? 'bg-brand-tint text-brand' : 'bg-well text-ink-60')
                }
              >
                {t(kind[l.kind])}
              </span>
              <span className="min-w-0 flex-1">
                <input
                  value={l.label}
                  onChange={(e) => patch(l.id, { label: e.target.value })}
                  placeholder={t('pro.est.itemPh')}
                  aria-label={t('pro.est.item')}
                  className="w-full min-w-0 rounded-md bg-transparent text-[15px] font-semibold text-ink placeholder:text-ink-30"
                />
                {l.detail && <span className="mt-px block truncate text-[12.5px] font-medium text-ink-40">{l.detail}</span>}
              </span>
              <span className="flex flex-none items-center rounded-[10px] bg-well pl-2">
                <span aria-hidden="true" className="text-[14px] font-bold text-ink-60">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  defaultValue={l.amount ? l.amount.toFixed(2) : ''}
                  onChange={(e) => patch(l.id, { amount: Number.parseFloat(e.target.value) || 0 })}
                  aria-label={t('pro.est.amount', { item: name })}
                  className="w-[70px] bg-transparent py-1.5 pr-2 text-right text-[15px] font-bold tabular-nums text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </span>
              <button
                type="button"
                onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                aria-label={t('pro.est.remove', { item: name })}
                className="grid h-8 w-8 flex-none place-items-center rounded-[10px] text-ink-40 transition hover:bg-well hover:text-ink"
              >
                <Close size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2.5">
        {(['part', 'labour'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLines((ls) => [...ls, { id: id(), kind: k, label: k === 'labour' ? t('pro.est.l.labour') : '', detail: '', amount: 0 }])}
            className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[15px] border-[1.5px] border-dashed border-line text-[14px] font-bold text-ink-60 transition hover:border-brand hover:text-brand"
          >
            <Plus size={15} strokeWidth={2.4} />
            {t(k === 'part' ? 'pro.est.addPart' : 'pro.est.addLabour')}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Subtotal, IVA and what the customer pays — then, beside it, what the artisan keeps. */
function Totals({ q }: { q: ReturnType<typeof quote> }) {
  const { t } = useLang();
  return (
    <>
      <div className={`${CARD} mb-3 px-[18px] py-4`}>
        <div className="mb-2 flex text-[14px] font-medium text-ink-60">
          <span className="mr-auto">{t('pro.est.subtotal')}</span>
          <span className="font-semibold text-ink">{formatEuro(q.subtotal)}</span>
        </div>
        <div className="mb-3 flex text-[14px] font-medium text-ink-60">
          <span className="mr-auto">{t('pro.est.iva')}</span>
          <span className="font-semibold text-ink">{formatEuro(q.iva)}</span>
        </div>
        <div className="flex items-baseline border-t border-line-rule pt-3">
          <span className="mr-auto text-[16px] font-bold text-ink">{t('pro.est.pays')}</span>
          <span className="text-[26px] font-extrabold tracking-[-.03em] text-ink">{formatEuro(q.total)}</span>
        </div>
      </div>
      <div className="rounded-[20px] border border-success/25 bg-success-tint px-[17px] py-[15px]">
        <div className="mb-1.5 flex text-[13.5px] font-medium text-success">
          <span className="mr-auto">{t('pro.est.commission')}</span>
          <span className="font-bold">{formatEuro(-q.commission)}</span>
        </div>
        <div className="flex items-baseline">
          <span className="mr-auto text-[15.5px] font-bold text-[#14532d]">{t('pro.est.receive')}</span>
          <span className="text-[22px] font-extrabold tracking-[-.02em] text-[#14532d]">{formatEuro(q.net)}</span>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] font-medium leading-[1.5] text-ink-40">{t('pro.est.rate')}</p>
    </>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function Screen({ top, footer, flush, children }: { top?: ReactNode; footer?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {top}
      <div className={'min-h-0 flex-1 overflow-y-auto' + (flush ? '' : ' px-5 pb-5 pt-4')}>{children}</div>
      {footer && <div className="flex-none border-t border-line-rule bg-panel px-5 pb-5 pt-4">{footer}</div>}
    </section>
  );
}

function TopBar({ title, sub, chip, onBack }: { title: string; sub?: ReactNode; chip?: ReactNode; onBack?: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex flex-none items-center gap-3 border-b border-line-rule bg-panel px-4 py-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('pro.back')}
          className="grid h-10 w-10 flex-none place-items-center rounded-[14px] border border-line-soft bg-panel text-ink transition hover:bg-well"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <span className="mr-auto min-w-0">
        <span className="block truncate text-[17px] font-bold text-ink">{title}</span>
        {sub && <span className="mt-px block text-[12.5px] font-semibold">{sub}</span>}
      </span>
      {chip}
    </div>
  );
}

function Chip({ tone, children }: { tone: 'success' | 'brand' | 'plain'; children: ReactNode }) {
  const tones = { success: 'bg-success-tint text-success', brand: 'bg-brand-tint text-brand-hover', plain: 'bg-well text-ink-60' };
  return <span className={`flex-none rounded-full px-3 py-1.5 text-[12px] font-bold ${tones[tone]}`}>{children}</span>;
}

function Row({ lead, title, sub, last }: { lead: ReactNode; title: string; sub: string; last?: boolean }) {
  return (
    <div className={'flex items-center gap-3 px-4 py-3.5' + (last ? '' : ' border-b border-line-rule')}>
      {lead}
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-ink">{title}</span>
        <span className="mt-px block text-[12.5px] font-medium text-ink-40">{sub}</span>
      </span>
    </div>
  );
}

const Avatar = ({ children }: { children: ReactNode }) => (
  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[13px] bg-avatar text-[12px] font-extrabold text-brand">{children}</span>
);
const Well = ({ children }: { children: ReactNode }) => (
  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[13px] bg-well text-ink-60">{children}</span>
);

function Photo({ small }: { small?: boolean }) {
  const { t } = useLang();
  return (
    <div
      className={
        'grid place-items-center bg-avatar text-[12.5px] font-semibold text-ink-60 ' +
        (small ? 'h-[110px] w-[170px] rounded-[20px_20px_20px_6px]' : 'h-[160px] rounded-[22px]')
      }
    >
      <span className="flex items-center gap-2">
        <ImageIcon size={17} />
        {t('pro.photo.sample')}
      </span>
    </div>
  );
}

function Tile({ value, label, green }: { value: string; label: string; green?: boolean }) {
  return (
    <div
      className={
        'flex-1 rounded-[20px] border p-3.5 text-center backdrop-blur-[12px] ' +
        (green ? 'border-success-bright/35 bg-success-bright/20 text-[#a7f3cf]' : 'border-white/15 bg-white/10 text-white')
      }
    >
      <div className="text-[19px] font-extrabold">{value}</div>
      <div className={'mt-0.5 text-[11.5px] font-semibold ' + (green ? '' : 'text-white/75')}>{label}</div>
    </div>
  );
}

const BigCheck = () => (
  <span className="mb-6 mt-4 grid h-[78px] w-[78px] place-items-center rounded-[28px] bg-success-tint text-success">
    <Check size={36} strokeWidth={2.4} />
  </span>
);

function Money({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={'flex items-baseline py-3' + (strong ? ' border-t border-line-rule' : '')}>
      <span className={'mr-auto text-[14.5px] ' + (strong ? 'font-bold text-ink' : 'font-medium text-ink-60')}>{label}</span>
      <span className={strong ? 'text-[22px] font-extrabold tracking-[-.02em] text-ink' : 'text-[15px] font-bold text-ink'}>{value}</span>
    </div>
  );
}

/** Both numbers side by side, so nothing is ambiguous on arrival. */
function Split({ pays, receive }: { pays: number; receive: number }) {
  const { t } = useLang();
  return (
    <div className="flex gap-2.5">
      <div className={`${CARD} flex-1 p-4`}>
        <div className="text-[12px] font-semibold text-ink-40">{t('pro.est.pays')}</div>
        <div className="mt-1 text-[22px] font-extrabold tracking-[-.02em] text-ink">{formatEuro(pays)}</div>
      </div>
      <div className="flex-1 rounded-[22px] border border-success/25 bg-success-tint p-4">
        <div className="text-[12px] font-semibold text-success">{t('pro.est.receive')}</div>
        <div className="mt-1 text-[22px] font-extrabold tracking-[-.02em] text-[#14532d]">{formatEuro(receive)}</div>
      </div>
    </div>
  );
}

/** The unlocked address, with the two things a driver needs. */
function Address() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const full = `${ADDRESS}, 2º Esq, Amora`;
  return (
    <div className={`${CARD} mb-3.5 p-[18px]`}>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[15px] bg-ink text-white">
          <MapPin size={19} />
        </span>
        <span>
          <span className="block text-[16.5px] font-bold text-ink">{ADDRESS}</span>
          <span className="mt-px block text-[13px] font-medium text-ink-40">2º Esq · Amora · 1.4 km</span>
        </span>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(full);
            setCopied(true);
          }}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[15px] bg-well text-[14.5px] font-bold text-ink transition hover:bg-line"
        >
          {copied && <Check size={15} />}
          {t(copied ? 'pro.ok.copied' : 'pro.ok.copy')}
        </button>
        <a
          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(full)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 flex-1 items-center justify-center rounded-[15px] bg-ink text-[14.5px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
        >
          {t('pro.ok.maps')}
        </a>
      </div>
    </div>
  );
}

function Step({ label, time, done }: { label: string; time?: string; done?: boolean }) {
  return (
    <li
      className={
        'flex items-center gap-3 rounded-[20px] px-4 py-3.5 ' +
        (done ? 'border border-line-soft bg-panel' : 'border-[1.5px] border-dashed border-line bg-panel/60')
      }
    >
      <span
        className={
          'grid h-10 w-10 flex-none place-items-center rounded-[14px] ' + (done ? 'bg-success-tint text-success' : 'bg-well text-ink-40')
        }
      >
        {done ? <Check size={18} strokeWidth={2.4} /> : <MapPin size={18} />}
      </span>
      <span className={'mr-auto text-[15.5px] font-bold ' + (done ? 'text-ink' : 'text-ink-60')}>{label}</span>
      {time && <span className="text-[13px] font-medium text-ink-40">{time}</span>}
    </li>
  );
}

/** A photo slot: tap to take or pick one; it previews in place. */
function PhotoTile({ label }: { label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <label className="relative grid h-[92px] min-w-[92px] flex-1 cursor-pointer place-items-center overflow-hidden rounded-[18px] border-[1.5px] border-dashed border-line bg-panel text-[12px] font-bold text-ink-60 transition hover:border-brand hover:text-brand">
      {url ? (
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1">
          <Camera size={19} />
          {label}
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setUrl(URL.createObjectURL(f));
        }}
      />
    </label>
  );
}

/** Screen 07's map: a drawn route from the artisan to the customer (illustrative). */
function Route() {
  return (
    <div aria-hidden="true" className="relative h-[240px] overflow-hidden bg-[#e9eef7]">
      <svg viewBox="0 0 390 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <path d="M0 170 L130 188 L260 178 L390 198 L390 240 L0 240 Z" fill="#cfe0ef" />
        <g fill="#dde4f0">
          <rect x="18" y="20" width="86" height="52" rx="4" />
          <rect x="120" y="14" width="70" height="42" rx="4" />
          <rect x="206" y="20" width="58" height="52" rx="4" />
          <rect x="280" y="12" width="92" height="46" rx="4" />
          <rect x="22" y="90" width="72" height="56" rx="4" />
          <rect x="112" y="72" width="78" height="44" rx="4" />
          <rect x="208" y="90" width="64" height="56" rx="4" />
          <rect x="290" y="74" width="82" height="52" rx="4" />
        </g>
        <g stroke="#f6f8fc" fill="none" strokeLinecap="round">
          <path d="M0 82 H390" strokeWidth="13" />
          <path d="M0 156 H390" strokeWidth="10" />
          <path d="M100 0 V240" strokeWidth="11" />
          <path d="M274 0 V240" strokeWidth="9" />
          <path d="M192 56 V200" strokeWidth="7" />
        </g>
        <path d="M300 50 L274 50 L274 156 L192 156 L192 186" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute left-[70%] top-[21%] grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-brand text-[11px] font-extrabold text-white shadow-marker">
        TF
      </span>
      <span className="absolute left-[49%] top-[70%] grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-full place-items-center rounded-full border-[3px] border-white bg-ink text-white shadow-marker">
        <MapPin size={15} />
      </span>
    </div>
  );
}
