import { Link } from 'react-router-dom';

export default function LandingHero() {
  return (
    <section className="bg-df-cream px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left: copy + upload card */}
        <div className="space-y-8">
          <h1 className="font-garamond text-5xl sm:text-6xl lg:text-7xl text-df-black leading-[1.1]">
            When your usual<br />
            <em>person can't.</em>
          </h1>
          <p className="font-manrope text-base text-df-muted max-w-md leading-relaxed">
            Snap a photo of the problem. We instantly diagnose the issue and dispatch an available, vetted artisan to your door. No calling around, no waiting weeks.
          </p>

          {/* Photo upload card */}
          <div className="bg-white rounded-2xl border border-df-border shadow-sm p-5 max-w-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-manrope font-semibold text-df-muted uppercase tracking-wide">
              <span className="text-df-primary">📷</span>
              Drag a photo here or click to upload
            </div>
            <div className="rounded-xl border-2 border-dashed border-df-border bg-df-cream flex flex-col items-center justify-center py-8 gap-3 cursor-pointer hover:border-df-primary/50 transition-colors">
              <svg className="w-8 h-8 text-df-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-manrope text-xs text-df-muted">Drop your photo here</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-manrope text-df-muted">
              <svg className="w-3.5 h-3.5 text-df-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              See who's available near you
            </div>
            <Link
              to="/waitlist"
              className="block w-full text-center font-manrope text-sm font-semibold py-2.5 rounded-xl bg-df-primary text-white hover:bg-df-primary-dark transition-colors"
            >
              Get Early Access →
            </Link>
          </div>
        </div>

        {/* Right: phone mockup image */}
        <div className="flex justify-center lg:justify-end">
          <img
            src="/phone-screen.png"
            alt="Dashfixe app interface"
            className="w-64 md:w-72 rounded-[2.5rem] shadow-2xl border-4 border-df-black"
          />
        </div>

      </div>
    </section>
  );
}
