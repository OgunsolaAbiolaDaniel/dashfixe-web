import wordmarkLight from '../../assets/dashfixe-wordmark-light.png';
import { link } from '../../routes';

const LINKS = [
  { href: link('privacy'), label: 'Privacy policy' },
  { href: link('terms'), label: 'Terms of service' },
  { href: link('cookies'), label: 'Cookie policy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[34px]">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <img src={wordmarkLight} alt="Dashfixe" className="block h-[18px] w-auto" />
            <span className="text-[13.5px] font-semibold text-onink">
              © 2026 Dashfixe. Built by Noxa Softwares.
            </span>
          </div>
          <nav className="flex flex-wrap gap-6">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13.5px] font-semibold text-onink transition hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
