import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-df-cream/90 backdrop-blur-sm border-b border-df-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="font-garamond text-xl font-semibold text-df-black">Dashfixe</span>
            <span className="hidden sm:inline-block text-[10px] font-manrope font-semibold uppercase tracking-widest text-df-primary border border-df-primary/40 rounded-full px-2 py-0.5">
              Beta
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {['How it Works', 'For Clients', 'For Artisans', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="font-manrope text-sm text-df-muted hover:text-df-black transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-manrope font-semibold text-df-muted">
              <button className="hover:text-df-black transition-colors">EN</button>
              <span className="text-df-border">|</span>
              <button className="hover:text-df-black transition-colors">PT</button>
            </div>
            <Link
              to="/waitlist"
              className="font-manrope text-sm font-semibold px-4 py-2 rounded-lg bg-df-primary text-white hover:bg-df-primary-dark transition-colors"
            >
              Get Early Access
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-df-muted hover:text-df-black"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-df-border space-y-3">
            {['How it Works', 'For Clients', 'For Artisans', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMenuOpen(false)}
                className="block font-manrope text-sm text-df-muted hover:text-df-black py-1"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
