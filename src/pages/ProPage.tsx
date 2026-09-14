import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/chrome/Header';
import JobFlow from '../components/pro/JobFlow';
import ProTabs from '../components/pro/ProTabs';
import { Check } from '../components/icons';
import { PACE, stepOf, type Stage } from '../components/pro/stages';
import { resetPro, usePro } from '../lib/pro';
import { useLang } from '../i18n';
import { link } from '../routes';

/**
 * /pro — the artisan app, as a walkthrough (designs/Dashfixe Artisan App.dc.html).
 *
 * The other half of the marketplace: what a pilot artisan will use. Go online,
 * take a sample job, price it before driving, do it, close it, and see the
 * payout. Public (it's a recruiting tool as much as a product), noindex (it's
 * sample data), and it never sends anything — the ribbon says so on every screen.
 *
 * Phones get the app full-screen; desktop shows it at phone width beside a short
 * explainer that tracks which of the design's four chapters you're in.
 */
const STEPS = ['pro.step1', 'pro.step2', 'pro.step3', 'pro.step4'] as const;

export default function ProPage() {
  const { t } = useLang();
  const pro = usePro();
  const [now] = useState(() => Date.now());
  const [stage, setStage] = useState<Stage>('home');
  const [finished, setFinished] = useState(false);
  const [passes, setPasses] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [run, setRun] = useState(0);

  // Online and idle: an offer arrives (sooner the first time than after a pass).
  useEffect(() => {
    if (!pro.online || stage !== 'home' || finished) return;
    const id = window.setTimeout(
      () => {
        setNotice(null);
        setStage('offer');
      },
      passes ? PACE.again : PACE.offer,
    );
    return () => window.clearTimeout(id);
  }, [pro.online, stage, finished, passes]);

  const reset = () => {
    resetPro();
    setStage('home');
    setFinished(false);
    setPasses(0);
    setNotice(null);
    setRun((r) => r + 1);
  };

  const step = stepOf(stage, finished);

  return (
    <div className="min-h-screen bg-canvas">
      <Header minimal />
      <main className="lg:mx-auto lg:flex lg:max-w-[1120px] lg:items-start lg:justify-center lg:gap-[clamp(40px,6vw,96px)] lg:px-10 lg:py-10">
        <aside className="lg:sticky lg:top-[108px] lg:max-w-[440px] lg:flex-1 lg:pt-8">
          <p className="mb-3 hidden text-label text-brand lg:block">{t('pro.eyebrow')}</p>
          <h1 className="sr-only lg:not-sr-only lg:mb-4 lg:block lg:text-display lg:text-ink">{t('fa.hero.title')}</h1>
          <p className="mb-7 hidden max-w-[420px] text-lead text-ink-60 lg:block">{t('pro.intro')}</p>
          <ol className="mb-7 hidden flex-col gap-2 lg:flex">
            {STEPS.map((key, i) => (
              <li
                key={key}
                aria-current={step === i ? 'step' : undefined}
                className={
                  'flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-[15px] font-bold transition ' +
                  (step === i ? 'bg-panel text-ink shadow-card' : step > i ? 'text-ink-80' : 'text-ink-60')
                }
              >
                <span
                  className={
                    'grid h-7 w-7 flex-none place-items-center rounded-full text-[12.5px] font-extrabold ' +
                    (step > i ? 'bg-success text-white' : step === i ? 'bg-brand text-white' : 'bg-well text-ink-60')
                  }
                >
                  {step > i ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                {t(key)}
              </li>
            ))}
          </ol>
          <div className="hidden flex-wrap items-center gap-3 lg:flex">
            <Link
              to={link('artisanApply')}
              className="flex h-ctl items-center rounded-btn bg-ink px-5 text-[14.5px] font-bold text-white transition hover:bg-ink-80 hover:text-white"
            >
              {t('fa.hero.apply')}
            </Link>
            <button type="button" onClick={reset} className="h-ctl rounded-btn px-4 text-[14.5px] font-bold text-ink-60 transition hover:bg-well hover:text-ink">
              {t('pro.restart')}
            </button>
          </div>
        </aside>

        {/* The app: full screen on a phone, a phone-sized device on desktop. */}
        <div className="lg:w-[400px] lg:flex-none">
          <div className="flex h-[calc(100dvh-69px)] flex-col overflow-hidden bg-page lg:h-[min(800px,calc(100dvh-140px))] lg:min-h-[620px] lg:rounded-[44px] lg:border-[10px] lg:border-ink lg:shadow-panel">
            <p className="flex-none bg-warning-tint px-4 py-1.5 text-center text-[12px] font-bold text-warning">{t('pro.ribbon')}</p>
            {stage === 'home' ? (
              <ProTabs key={run} now={now} finished={finished} notice={notice} onReset={reset} />
            ) : (
              <JobFlow
                key={run}
                stage={stage}
                go={setStage}
                onPass={(why) => {
                  setPasses((p) => p + 1);
                  setNotice(t(why === 'expired' ? 'pro.offer.expired' : 'pro.offer.passed'));
                  setStage('home');
                }}
                onDone={() => {
                  setFinished(true);
                  setStage('home');
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
