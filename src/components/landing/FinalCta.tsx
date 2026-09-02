import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FinalCta() {
  const [email, setEmail] = useState('');

  return (
    <section className="bg-df-cream py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-df-border">
      <div className="max-w-2xl mx-auto text-center">

        <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] text-df-primary mb-4">
          Early Access
        </p>

        <h2 className="font-garamond text-4xl sm:text-5xl text-df-black leading-tight mb-4">
          Be first in line when we<br />
          <em>launch in Portugal.</em>
        </h2>

        <p className="font-manrope text-base text-df-muted mb-10 max-w-md mx-auto leading-relaxed">
          We're building the waitlist now. Join early and be the first to know when Dashfixe opens in your area.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 text-sm font-manrope text-df-black bg-white border border-df-border rounded-xl focus:outline-none focus:border-df-primary transition-colors placeholder:text-df-muted/60"
          />
          <Link
            to={`/waitlist${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="px-6 py-3 font-manrope text-sm font-semibold bg-df-primary text-white rounded-xl hover:bg-df-primary-dark transition-colors text-center whitespace-nowrap"
          >
            Join the Waitlist
          </Link>
        </div>

        <p className="font-manrope text-xs text-df-muted/70">
          No spam. No cost. Just early access.
        </p>

      </div>
    </section>
  );
}
