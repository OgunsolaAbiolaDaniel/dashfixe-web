import { useLang } from '../../i18n';

/** The EN | PT segmented control from the design system. */
export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t('nav.language')} className={`flex rounded-xl bg-well p-[3px] ${className}`}>
      {(['EN', 'PT'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={
            'rounded-[9px] px-[13px] py-[7px] text-[13px] transition ' +
            (lang === code ? 'bg-panel font-bold text-ink shadow-card' : 'font-semibold text-ink-40 hover:text-ink-60')
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}
