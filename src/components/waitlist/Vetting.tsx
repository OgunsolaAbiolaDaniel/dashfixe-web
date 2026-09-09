import { Euro, IdCard, Shield } from '../icons';

const ITEMS = [
  {
    Icon: IdCard,
    title: 'Identity, always',
    body: 'Every artisan is identity-checked before they can take a single job.',
  },
  {
    Icon: Shield,
    title: 'Certified where the law says so',
    body: 'Electricians hold TRE-SP under Lei 14/2015. Gas technicians hold TG or IRG under Lei 15/2015. No exceptions.',
  },
  {
    Icon: Euro,
    title: 'Paid per completed job',
    body: 'Payment happens in the app when the work is done. Artisans never buy leads.',
  },
];

export default function Vetting() {
  return (
    <section className="border-t border-line-soft bg-panel">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[clamp(56px,7vw,88px)]">
        <div className="mb-10 max-w-[560px]">
          <div className="mb-3 text-label text-ink-40">Vetting</div>
          <h2 className="text-[clamp(28px,3.2vw,40px)] font-extrabold leading-[1.08] tracking-[-.035em] text-ink">
            Checked to the standard the trade demands.
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-6">
          {ITEMS.map(({ Icon, title, body }) => (
            <div key={title}>
              <span className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-well bg-brand-tint">
                <Icon size={21} className="text-brand" />
              </span>
              <h3 className="mb-2 text-section text-ink">{title}</h3>
              <p className="text-[14.5px] font-medium leading-[1.6] text-ink-60 [text-wrap:pretty]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
