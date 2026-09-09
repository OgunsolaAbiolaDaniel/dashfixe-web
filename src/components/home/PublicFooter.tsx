import { Link } from 'react-router-dom';
import wordmarkLight from '../../assets/dashfixe-wordmark-light.png';
import { ROUTES } from '../../routes';

const LINK = 'text-[13.5px] font-semibold text-onink transition hover:text-white';
const HEAD = 'mb-4 text-label text-onink-strong';

const SERVICES = ['Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Cleaning'];
const COMPANY = ['About Dashfixe', 'Coverage', 'Careers', 'Press', 'Contact'];
const ARTISANS = [
  'Apply to join',
  'How payouts work',
  'Vetting & licensing',
  'The artisan app',
  'Subcontracting',
];
const SUPPORT = ['Help centre', 'Safety', 'Cancellations', 'Report an issue'];

export default function PublicFooter() {
  return (
    <footer className="bg-ink">
      <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,32px)] pb-7 pt-[clamp(44px,5vw,64px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-x-6 gap-y-8 pb-9">
          <div>
            <img src={wordmarkLight} alt="Dashfixe" className="mb-4 block h-5 w-auto" />
            <p className="max-w-[220px] text-[13.5px] font-medium leading-[1.6] text-onink">
              Local artisans, matched on availability. Serviços locais. Rápidos. Confiáveis.
            </p>
          </div>

          <div>
            <div className={HEAD}>Services</div>
            <div className="flex flex-col gap-[11px]">
              {SERVICES.map((s) => (
                <a key={s} href="#trades" className={LINK}>{s}</a>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>Company</div>
            <div className="flex flex-col gap-[11px]">
              {COMPANY.map((s) => (
                <a key={s} href="#about" className={LINK}>{s}</a>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>For artisans</div>
            <div className="flex flex-col gap-[11px]">
              {ARTISANS.map((s) => (
                <Link key={s} to={ROUTES.artisans} className={LINK}>{s}</Link>
              ))}
            </div>
          </div>

          <div>
            <div className={HEAD}>Support</div>
            <div className="flex flex-col gap-[11px]">
              {SUPPORT.map((s) => (
                <a key={s} href={ROUTES.help} className={LINK}>{s}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 border-t border-white/10 pt-[26px]">
          <span className="text-[13.5px] font-semibold text-onink">
            © 2026 Dashfixe. Built by Noxa Softwares.
          </span>
          <div className="flex flex-wrap gap-[22px]">
            <a href="#privacy" className={LINK}>Privacy</a>
            <a href="#terms" className={LINK}>Terms</a>
            <a href="#cookies" className={LINK}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
