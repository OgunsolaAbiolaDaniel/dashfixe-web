// src/components/DualAudience.tsx
interface DualAudienceProps {
  onOpenArtisanModal: () => void;
}

const HOMEOWNER_POINTS = [
  {
    title: 'Your backup plan',
    description: "When your usual pro is busy or on holiday, we're here.",
  },
  {
    title: 'Clear, upfront pricing',
    description: 'No surprises. Know the cost before you commit.',
  },
  {
    title: 'No endless calling',
    description: 'Stop leaving voicemails. Get connected instantly.',
  },
];

const PRO_POINTS = [
  {
    title: 'Set your own rates',
    description: 'You control what you earn for every job.',
  },
  {
    title: 'No lead fees',
    description: 'Keep more of what you make. We only win when you win.',
  },
  {
    title: 'Work on your schedule',
    description: 'Toggle availability on or off with a single tap.',
  },
];

export default function DualAudience({ onOpenArtisanModal }: DualAudienceProps) {
  return (
    <section id="for-clients" className="bg-brand-alt px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* For Homeowners */}
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mb-8">
            🏠
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy mb-6">
            For Homeowners
          </h2>
          <ul className="space-y-5 grow mb-10">
            {HOMEOWNER_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <div>
                  <h4 className="font-semibold text-brand-navy mb-0.5">{point.title}</h4>
                  <p className="text-brand-slate text-sm">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href="#waitlist"
            className="w-full text-center px-6 py-3.5 rounded-lg bg-brand-blue hover:bg-brand-hover text-white font-semibold transition-all shadow-xs cursor-pointer"
          >
            Join the Waitlist
          </a>
        </div>

        {/* For Pros */}
        <div
          id="for-artisans"
          className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-2xl mb-8">
            🛠️
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy mb-6">For Pros</h2>
          <ul className="space-y-5 grow mb-10">
            {PRO_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <div>
                  <h4 className="font-semibold text-brand-navy mb-0.5">{point.title}</h4>
                  <p className="text-brand-slate text-sm">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenArtisanModal}
            className="w-full px-6 py-3.5 rounded-lg border-2 border-brand-blue text-brand-blue hover:bg-blue-50 font-semibold transition-all cursor-pointer"
          >
            Apply as a Pro
          </button>
        </div>
      </div>
    </section>
  );
}
