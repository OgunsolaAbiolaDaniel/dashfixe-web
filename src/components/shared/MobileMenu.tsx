import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Close, Menu } from '../icons';
import { useLang } from '../../i18n';
import LangToggle from './LangToggle';

export type MenuLink = { label: string; to: string; external?: boolean };

type Props = {
  links: MenuLink[];
  /** Rendered under the links: log in / sign up, or the account row. */
  actions?: ReactNode;
  /** Only render the trigger below this breakpoint class, e.g. "md:hidden". */
  className?: string;
};

/**
 * The hamburger and its sheet. Full-height on the right, ink overlay, closes on
 * Escape, overlay click, or following a link. Body scroll is locked while open.
 */
export default function MobileMenu({ links, actions, className = 'md:hidden' }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.menu')}
        aria-expanded={open}
        className="grid h-ctl w-ctl place-items-center rounded-well bg-well text-ink transition hover:bg-line"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[110] bg-ink/60 backdrop-blur-[4px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(360px,88vw)] flex-col bg-panel p-5 shadow-panel"
          >
            <div className="mb-6 flex items-center justify-between">
              <LangToggle />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('nav.close')}
                className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-well transition hover:bg-line"
              >
                <Close size={17} className="text-ink-60" />
              </button>
            </div>

            <nav className="flex flex-col">
              {links.map((l) =>
                l.external || l.to.startsWith('#') ? (
                  <a
                    key={l.to + l.label}
                    href={l.to}
                    onClick={() => setOpen(false)}
                    className="border-b border-line-rule py-4 text-[17px] font-bold text-ink transition hover:text-brand"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.to + l.label}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="border-b border-line-rule py-4 text-[17px] font-bold text-ink transition hover:text-brand"
                  >
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            {actions && <div className="mt-auto flex flex-col gap-2.5 pt-6">{actions}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
