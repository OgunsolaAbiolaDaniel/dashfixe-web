const STEPS = [
  {
    number: 1,
    title: 'Snap',
    description: 'Take a quick photo or video of the issue. No need to know the technical terms.',
    visual: (
      <div className="rounded-xl border border-df-border bg-df-surface p-4 space-y-3">
        <div className="text-[10px] font-manrope font-semibold text-df-muted uppercase tracking-wide">Upload your issue</div>
        <div className="rounded-lg border-2 border-dashed border-df-border bg-df-cream flex flex-col items-center justify-center py-5 gap-2 cursor-pointer">
          <svg className="w-6 h-6 text-df-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-manrope text-[10px] text-df-muted">Drag a photo here or tap to upload</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-manrope text-df-muted">
          <svg className="w-3 h-3 text-df-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Location detected: Lisbon, PT
        </div>
      </div>
    ),
  },
  {
    number: 2,
    title: 'AI Diagnosis',
    description: 'Our system instantly analyses your upload to identify the probable cause and exactly which trade is needed.',
    visual: (
      <div className="rounded-xl border border-df-border bg-df-surface p-4 space-y-2.5">
        <div className="text-[10px] font-manrope font-semibold text-df-muted uppercase tracking-wide">Diagnosis result</div>
        {[
          { label: 'Issue detected', value: 'Leaking Joint', highlight: false },
          { label: 'Trade required', value: 'Plumber', highlight: true },
          { label: 'Confidence', value: '94%', highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-df-cream px-3 py-2 border border-df-border">
            <span className="font-manrope text-[10px] text-df-muted">{label}</span>
            <span className={`font-manrope text-[10px] font-semibold ${highlight ? 'text-df-primary' : 'text-df-black'}`}>{value}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: 3,
    title: 'Quote & Chat',
    description: 'Review clear, upfront pricing before you commit. Chat directly with the artisan — in your language.',
    visual: (
      <div className="rounded-xl border border-df-border bg-df-surface p-4 space-y-3">
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 rounded-full bg-df-primary flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">J</div>
          <div className="bg-df-cream border border-df-border rounded-2xl rounded-bl-sm px-3 py-2 font-manrope text-[10px] text-df-black">
            "I can be there in 20 mins."
          </div>
        </div>
        {[
          { label: 'Upfront quote', value: '€45 – €70' },
          { label: 'ETA', value: '~20 min', accent: true },
        ].map(({ label, value, accent }) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-df-cream px-3 py-2 border border-df-border">
            <span className="font-manrope text-[10px] text-df-muted">{label}</span>
            <span className={`font-manrope text-[10px] font-semibold ${accent ? 'text-df-primary' : 'text-df-black'}`}>{value}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: 4,
    title: 'Book & Fix',
    description: 'Tap to confirm. The artisan arrives, fixes the issue, and payment is handled securely in-app.',
    visual: (
      <div className="rounded-xl border border-df-border bg-df-surface p-4 space-y-3">
        <div className="rounded-lg bg-df-cream border border-df-border px-3 py-3 space-y-1.5">
          <div className="flex items-center gap-2 font-manrope text-[10px]">
            <span className="text-green-600 font-bold">✓</span>
            <span className="text-df-black font-semibold">Artisan confirmed</span>
          </div>
          <div className="font-manrope text-[10px] text-df-muted">João M. · ⭐ 4.9 · Plumber</div>
          <div className="font-manrope text-[10px] text-df-muted">
            Arriving in <span className="text-df-primary font-semibold">15 min</span>
          </div>
        </div>
        <button className="w-full rounded-lg bg-df-primary text-white font-manrope text-[10px] font-semibold py-2.5 hover:bg-df-primary-dark transition-colors">
          Start Request →
        </button>
        <p className="font-manrope text-[9px] text-df-muted text-center">Payment processed securely after job completion</p>
      </div>
    ),
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-df-cream py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] text-df-primary mb-4">
            The Process
          </p>
          <h2 className="font-garamond text-4xl sm:text-5xl text-df-black mb-4">
            Repair, completely reimagined.
          </h2>
          <p className="font-manrope text-base text-df-muted max-w-md mx-auto leading-relaxed">
            From problem to fixed — in four steps. No phone calls, no guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl border border-df-border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-df-primary flex items-center justify-center text-white font-manrope text-xs font-bold flex-shrink-0">
                  {step.number}
                </div>
                <h3 className="font-manrope text-sm font-semibold text-df-black">{step.title}</h3>
              </div>
              {step.visual}
              <p className="font-manrope text-xs text-df-muted leading-relaxed mt-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
