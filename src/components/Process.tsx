// src/components/Process.tsx
interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: '📷',
    title: 'Capture',
    description: 'Snap a quick photo of the issue. No long descriptions needed.',
  },
  {
    number: 2,
    icon: '✨',
    title: 'AI Match',
    description: 'Our system identifies the trade and finds an available pro nearby.',
  },
  {
    number: 3,
    icon: '💬',
    title: 'Quote & Chat',
    description: 'See the price upfront. Chat seamlessly in your preferred language.',
  },
  {
    number: 4,
    icon: '✅',
    title: 'Fix & Pay',
    description: 'Job done right. Pay securely in-app with no hidden fees.',
  },
];

export default function Process() {
  return (
    <section id="how-it-works" className="bg-white px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mb-4">
            Repair, reimagined.
          </h2>
          <p className="text-lg text-brand-slate">Four simple steps to a fixed home.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative bg-white p-8 rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="absolute -top-4 -left-4 w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-brand-navy border-4 border-white shadow-xs">
                {step.number}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">{step.title}</h3>
              <p className="text-brand-slate leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
