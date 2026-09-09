import mark from '../../assets/dashfixe-mark.png';
import wordmark from '../../assets/dashfixe-wordmark.png';
import type { Lang } from '../../types';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#clients', label: 'For clients' },
  { href: '#artisans', label: 'For artisans' },
  { href: '#about', label: 'About' },
];

type Props = { lang: Lang; onLang: (lang: Lang) => void };

export default function Navbar({ lang, onLang }: Props) {
  return (
    <header className="sticky top-0 z-[60] bg-panel border-b border-line-soft">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)]">
        <div className="flex flex-wrap items-center justify-between gap-x-[26px] gap-y-3 min-h-[72px] py-3">
          <a href="#top" className="flex flex-none items-center gap-2.5">
            <img src={mark} alt="" className="block h-[30px] w-auto" />
            <img src={wordmark} alt="Dashfixe" className="block h-[19px] w-auto" />
          </a>

          <nav className="flex flex-wrap items-center gap-6">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14.5px] font-semibold text-ink-60 transition hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-none items-center gap-3">
            <div className="flex rounded-xl bg-well p-[3px]">
              {(['EN', 'PT'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLang(code)}
                  aria-pressed={lang === code}
                  className={
                    'rounded-[9px] px-[13px] py-[7px] text-[13px] transition ' +
                    (lang === code
                      ? 'bg-panel font-bold text-ink shadow-card'
                      : 'font-semibold text-ink-40 hover:text-ink-60')
                  }
                >
                  {code}
                </button>
              ))}
            </div>

            <a
              href="#join"
              className="flex h-ctl items-center rounded-btn bg-brand px-5 text-[14.5px] font-bold text-white transition hover:bg-brand-hover hover:text-white"
            >
              Get early access
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
