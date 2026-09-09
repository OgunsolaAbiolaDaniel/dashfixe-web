import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Wrench } from '../icons';
import { ROUTES } from '../../routes';

const CARD =
  'flex items-center gap-6 rounded-[20px] bg-panel p-[clamp(24px,3vw,36px)] text-left transition hover:bg-brand-tint';

export default function Apps({ onAuth }: { onAuth: () => void }) {
  return (
    <section className="bg-page">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,6vw,88px)]">
        <h2 className="mb-[30px] text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.06] tracking-[-.04em] text-ink">
          It's easier in the apps
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          <button type="button" onClick={onAuth} className={CARD}>
            <span className="grid h-[84px] w-[84px] flex-none place-items-center rounded-card bg-well">
              <Phone size={38} className="text-ink" />
            </span>
            <span className="mr-auto min-w-0">
              <span className="block text-[22px] font-extrabold tracking-[-.03em] text-ink">
                Get the Dashfixe app
              </span>
              <span className="mt-[5px] block text-[15.5px] font-semibold text-ink-60">
                Ships with the pilot
              </span>
            </span>
            <ArrowRight size={24} className="flex-none text-ink" />
          </button>

          <Link to={ROUTES.artisans} className={CARD + ' hover:text-ink'}>
            <span className="grid h-[84px] w-[84px] flex-none place-items-center rounded-card bg-well">
              <Wrench size={38} strokeWidth={1.5} className="text-ink" />
            </span>
            <span className="mr-auto min-w-0">
              <span className="block text-[22px] font-extrabold tracking-[-.03em] text-ink">
                Get the Artisan app
              </span>
              <span className="mt-[5px] block text-[15.5px] font-semibold text-ink-60">
                For the pilot cohort
              </span>
            </span>
            <ArrowRight size={24} className="flex-none text-ink" />
          </Link>
        </div>
      </div>
    </section>
  );
}
