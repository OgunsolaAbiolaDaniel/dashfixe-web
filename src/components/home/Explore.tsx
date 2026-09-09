import { CalendarCheck, Receipt, Reroute, Wrench } from '../icons';

const CARDS = [
  {
    Icon: Wrench,
    title: 'Fix now',
    body: 'Describe the problem and get matched with an artisan who is free right now.',
    href: null,
  },
  {
    Icon: CalendarCheck,
    title: 'Book ahead',
    body: 'Pick a date and a window, and hold an artisan for the day that suits you.',
    href: '#later',
  },
  {
    Icon: Receipt,
    title: 'Upfront estimate',
    body: 'See materials and labour itemised, and approve the total before anyone travels.',
    href: null,
  },
  {
    Icon: Reroute,
    title: 'Repeat a job',
    body: 'Liked who came last time? Send them straight back, at the same agreed rate.',
    href: null,
  },
];

const PILL =
  'mt-auto flex h-[46px] items-center self-start rounded-full bg-panel px-[22px] text-[15px] font-bold text-ink transition hover:bg-line hover:text-ink';

export default function Explore({ onAuth }: { onAuth: () => void }) {
  return (
    <section id="explore" className="scroll-mt-[88px] bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(56px,7vw,96px)] pt-[clamp(24px,3vw,40px)]">
        <h2 className="mb-[34px] text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.06] tracking-[-.04em] text-ink">
          Explore what you can do with Dashfixe
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
          {CARDS.map(({ Icon, title, body, href }) => (
            <article key={title} className="flex flex-col rounded-[20px] bg-well p-7">
              <div className="mb-[26px] flex items-start gap-5">
                <div className="min-w-0">
                  <h3 className="mb-2.5 text-2xl font-extrabold tracking-[-.03em] text-ink">{title}</h3>
                  <p className="text-[15.5px] font-medium leading-[1.55] text-ink-60 [text-wrap:pretty]">{body}</p>
                </div>
                <span className="grid h-[76px] w-[76px] flex-none place-items-center rounded-full bg-panel">
                  <Icon size={34} strokeWidth={1.6} className="text-brand" />
                </span>
              </div>
              {href ? (
                <a href={href} className={PILL}>Details</a>
              ) : (
                <button type="button" onClick={onAuth} className={PILL}>Details</button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
