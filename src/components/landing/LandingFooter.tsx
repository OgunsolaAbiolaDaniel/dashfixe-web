import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="bg-df-black px-4 sm:px-6 lg:px-8 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <span className="font-garamond text-xl text-white">Dashfixe</span>
            <p className="font-manrope text-xs text-white/40 leading-relaxed max-w-[180px]">
              Professional repair services, on demand. Launching in Portugal.
            </p>
          </div>

          {[
            {
              heading: 'Product',
              links: ['How it Works', 'For Clients', 'For Artisans', 'Pricing'],
            },
            {
              heading: 'Company',
              links: ['About', 'Blog', 'Careers', 'Press'],
            },
            {
              heading: 'Legal',
              links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
            },
          ].map(({ heading, links }) => (
            <div key={heading} className="space-y-3">
              <div className="font-manrope text-xs font-semibold uppercase tracking-widest text-white/40">
                {heading}
              </div>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-manrope text-xs text-white/60 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-manrope text-xs text-white/30">
            © 2024 Dashfixe. All rights reserved.
          </p>
          <Link
            to="/waitlist"
            className="font-manrope text-xs font-semibold text-df-primary hover:text-white transition-colors"
          >
            Join the waitlist →
          </Link>
        </div>
      </div>
    </footer>
  );
}
