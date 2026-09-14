import { Component, type ErrorInfo, type ReactNode } from 'react';
import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import { useLang } from '../../i18n';

type Props = {
  children: ReactNode;
  /** Changing this (the pathname) clears a caught error — navigating away recovers. */
  resetKey: string;
};
type State = { error: Error | null; key: string };

/**
 * The safety net under every route (docs/ARCHITECTURE.md §8). A render error
 * anywhere below — or a lazy chunk that fails to load after a deploy — shows a
 * calm "reload" screen instead of a blank white page. Deliberately depends on
 * as little as possible (no header, no auth) so it still renders when those broke.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[dashfixe] page crashed', error, info.componentStack);
  }

  render() {
    return this.state.error ? <CrashScreen /> : this.props.children;
  }
}

function CrashScreen() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-5 text-center" role="alert">
      <a href="/" className="mb-8 flex items-center gap-2.5">
        <img src={mark} alt="" className="block h-7 w-auto" />
        <img src={wordmark} alt="Dashfixe" className="block h-[17px] w-auto" />
      </a>
      <div className="w-full max-w-[420px] rounded-card border border-line-soft bg-panel p-7 shadow-card">
        <h1 className="mb-2 text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-ink">{t('error.title')}</h1>
        <p className="mb-6 text-[14.5px] font-medium leading-[1.55] text-ink-60">{t('error.body')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-ctl rounded-btn bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover"
          >
            {t('error.reload')}
          </button>
          {/* A full navigation, not a router link: the app state that broke is left behind. */}
          <a
            href="/"
            className="flex h-ctl items-center rounded-btn border border-line bg-panel px-5 text-[14.5px] font-bold text-ink transition hover:bg-well hover:text-ink"
          >
            {t('error.home')}
          </a>
        </div>
      </div>
    </div>
  );
}
