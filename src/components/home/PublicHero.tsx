import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, Clock, Crosshair, MapPin, Wrench } from '../icons';
import { exploreUrl, DEFAULT_ADDRESS, type When } from '../../search';
import { useAuth } from '../../auth';

const FIELD = 'flex h-[56px] items-center gap-[13px] rounded-input bg-well px-[18px]';
const INPUT =
  'min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-offset-8 placeholder:text-ink-30';
const ROUND_BTN =
  'grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-panel text-brand transition hover:bg-brand-tint';

/**
 * The composer. What is typed here carries into /explore — searching is browse-first
 * and needs no account, so only the photo attachment and the account link gate on auth.
 */
export default function PublicHero() {
  const navigate = useNavigate();
  const { requireAuth, gate } = useAuth();
  const [need, setNeed] = useState('');
  const [address, setAddress] = useState('');
  const [when, setWhen] = useState<When>('now');

  const search = () => navigate(exploreUrl({ need, address, when }));

  return (
    <section id="top" className="bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(36px,4vw,64px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(36px,4vw,64px)]">
          <div>
            <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
              <MapPin size={18} className="flex-none text-ink" />
              <span className="text-[14.5px] font-bold text-ink">Amora, PT</span>
              <button
                type="button"
                onClick={() => requireAuth()}
                className="text-[14.5px] font-semibold text-ink-60 underline underline-offset-4 transition hover:text-ink"
              >
                Change area
              </button>
            </div>

            <h1 className="mb-6 max-w-[12ch] text-display text-ink [text-wrap:balance]">
              Somebody good, close by
            </h1>

            <button
              type="button"
              onClick={() => setWhen(when === 'now' ? 'later' : 'now')}
              aria-label="Choose when"
              className="mb-4 flex h-ctl-lg items-center gap-[11px] rounded-full bg-well px-[18px] text-[14.5px] font-bold text-ink transition hover:bg-line"
            >
              <Clock size={19} />
              {when === 'now' ? 'Fix it now' : 'Book for later'}
              <ChevronDown size={17} />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
              className="flex max-w-[540px] flex-col gap-2.5"
            >
              <div className={FIELD}>
                <Wrench size={19} className="flex-none text-ink" />
                <input
                  type="text"
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  placeholder="What needs fixing?"
                  aria-label="What needs fixing"
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => gate(() => {})}
                  aria-label="Attach a photo"
                  className={ROUND_BTN}
                >
                  <Camera size={18} />
                </button>
              </div>
              <div className={FIELD}>
                <MapPin size={19} className="flex-none text-ink" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your address"
                  aria-label="Your address"
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => setAddress(DEFAULT_ADDRESS)}
                  aria-label="Use my location"
                  className={ROUND_BTN}
                >
                  <Crosshair size={18} />
                </button>
              </div>

              <div className="mt-[22px] flex flex-wrap items-center gap-[26px]">
                <button
                  type="submit"
                  className="flex h-[52px] items-center rounded-btn bg-ink px-[26px] text-[15px] font-bold text-white transition hover:bg-ink-80"
                >
                  See who's available
                </button>
                <button
                  type="button"
                  onClick={() => requireAuth()}
                  className="border-b border-[#c8d1e0] pb-1 text-[14.5px] font-semibold text-ink transition hover:border-ink"
                >
                  Log in to see your recent jobs
                </button>
              </div>
            </form>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-card bg-canvas">
              <img
                src="https://images.pexels.com/photos/1249610/pexels-photo-1249610.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt="An artisan at work"
                className="block h-[clamp(300px,34vw,480px)] w-full object-cover"
              />
            </div>
            <div className="relative z-[2] mx-[18px] -mt-14 flex flex-wrap items-center gap-4 rounded-[18px] bg-panel px-5 py-[18px] shadow-[0_18px_44px_-20px_rgba(15,27,61,.45)]">
              <span className="mr-auto text-[15.5px] font-bold text-ink">Not urgent?</span>
              <a
                href="#later"
                className="flex h-[46px] flex-none items-center rounded-full bg-well px-5 text-[15px] font-bold text-ink transition hover:bg-line hover:text-ink"
              >
                Book ahead
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
