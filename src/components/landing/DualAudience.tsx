import { Link } from 'react-router-dom';

interface AudienceCardProps {
  eyebrow: string;
  headline: string;
  benefits: string[];
  cta: string;
  ctaTo: string;
  secondary?: { label: string; onClick?: () => void };
  dark?: boolean;
}

function AudienceCard({ eyebrow, headline, benefits, cta, ctaTo, secondary, dark }: AudienceCardProps) {
  return (
    <div className={`rounded-2xl p-8 md:p-10 flex flex-col gap-6 ${dark ? 'bg-df-black text-white' : 'bg-white border border-df-border text-df-black'}`}>
      <div>
        <p className={`font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] mb-3 ${dark ? 'text-df-primary' : 'text-df-primary'}`}>
          {eyebrow}
        </p>
        <h3 className={`font-garamond text-3xl sm:text-4xl leading-tight ${dark ? 'text-white' : 'text-df-black'}`}>
          {headline}
        </h3>
      </div>

      <ul className="space-y-3 flex-1">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-df-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className={`font-manrope text-sm leading-relaxed ${dark ? 'text-white/70' : 'text-df-muted'}`}>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          to={ctaTo}
          className={`flex-1 text-center font-manrope text-sm font-semibold py-3 rounded-xl transition-colors ${
            dark
              ? 'bg-df-primary text-white hover:bg-df-primary-dark'
              : 'bg-df-black text-white hover:bg-df-black/80'
          }`}
        >
          {cta}
        </Link>
        {secondary && (
          <button
            onClick={secondary.onClick}
            className={`flex-1 text-center font-manrope text-sm font-semibold py-3 rounded-xl border transition-colors ${
              dark
                ? 'border-white/20 text-white/70 hover:border-white hover:text-white'
                : 'border-df-border text-df-muted hover:border-df-black hover:text-df-black'
            }`}
          >
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}

interface DualAudienceProps {
  onOpenArtisanModal: () => void;
}

export default function DualAudience({ onOpenArtisanModal }: DualAudienceProps) {
  return (
    <section id="for-clients" className="bg-df-cream py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-garamond text-4xl sm:text-5xl text-df-black">
            Built for both sides.
          </h2>
          <p className="font-manrope text-base text-df-muted mt-3 max-w-md mx-auto">
            Whether you need it fixed or you do the fixing — Dashfixe works for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AudienceCard
            eyebrow="For Homeowners"
            headline="Your backup plan, when you need one."
            benefits={[
              'When your usual artisan is away or on holiday, we\'re here.',
              'See the real cost upfront — no surprises after the job.',
              'Stop leaving voicemails. Get connected instantly.',
            ]}
            cta="Join the Waitlist"
            ctaTo="/waitlist"
          />
          <AudienceCard
            eyebrow="For Artisans"
            headline="Set your own rates. Work on your schedule."
            benefits={[
              'We never send stock you can\'t fulfill — only real job matches.',
              'We only take a cut when you earn. No lead fees, ever.',
              'Toggle availability on or off with a single tap.',
            ]}
            cta="Apply as a Pro"
            ctaTo="/waitlist"
            secondary={{ label: 'Learn more', onClick: onOpenArtisanModal }}
            dark
          />
        </div>
      </div>
    </section>
  );
}
