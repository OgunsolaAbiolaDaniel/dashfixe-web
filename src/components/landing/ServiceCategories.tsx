import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    name: 'Plumbing',
    description: 'Fix leaks, clear drains, or install new fixtures.',
    illustration: '🔧',
  },
  {
    name: 'Electrical',
    description: 'Safe electrical repairs, wiring, and installations.',
    illustration: '⚡',
  },
  {
    name: 'Handyman',
    description: 'Furniture assembly, mounting, and general repairs.',
    illustration: '🔨',
  },
  {
    name: 'Painting',
    description: 'Interior and exterior painting, touch-ups, and finishes.',
    illustration: '🎨',
  },
  {
    name: 'Carpentry',
    description: 'Custom woodwork, door fitting, and furniture repair.',
    illustration: '🪵',
  },
  {
    name: 'Cleaning',
    description: 'Deep cleaning, end-of-tenancy, and post-renovation clean.',
    illustration: '🧹',
  },
];

export default function ServiceCategories() {
  return (
    <section className="bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <h2 className="font-garamond text-4xl sm:text-5xl text-df-black mb-10">
          Explore what you can do with Dashfixe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="relative bg-white rounded-2xl border border-df-border p-6 flex items-start justify-between gap-4 hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Left: text content */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <h3 className="font-manrope text-base font-bold text-df-black">{cat.name}</h3>
                <p className="font-manrope text-sm text-df-muted leading-relaxed">{cat.description}</p>
                <Link
                  to="/waitlist"
                  className="inline-block w-fit font-manrope text-xs font-semibold text-df-black border border-df-border rounded-lg px-4 py-2 hover:border-df-black transition-colors mt-1"
                >
                  Details
                </Link>
              </div>

              {/* Right: illustration */}
              <div className="text-5xl flex-shrink-0 select-none" aria-hidden>
                {cat.illustration}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
