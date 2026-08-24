// src/components/Navbar.tsx
interface NavbarProps {
  onOpenArtisanModal: () => void;
}

export default function Navbar({ onOpenArtisanModal }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Wordmark Logo */}
        <div className="flex items-center gap-2">
          <a href="#" className="text-xl font-extrabold tracking-tight text-brand-navy">
            Dashfixe
          </a>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full">
            Early Access
          </span>
        </div>

        {/* Anchor Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-slate">
          <a href="#how-it-works" className="hover:text-brand-navy transition-colors">
            How it Works
          </a>
          <a href="#for-clients" className="hover:text-brand-navy transition-colors">
            For Clients
          </a>
          <a href="#for-artisans" className="hover:text-brand-navy transition-colors">
            For Artisans
          </a>
          <a href="#about" className="hover:text-brand-navy transition-colors">
            About
          </a>
        </nav>

        {/* Right Actions: Language & CTA */}
        <div className="flex items-center gap-4">
          <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="px-2 py-1 bg-white text-slate-900 rounded-md shadow-xs font-bold">EN</span>
            <span className="px-2 py-1 hover:text-slate-700 cursor-pointer">PT</span>
          </div>

          <a
            href="#waitlist"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-hover text-white text-sm font-semibold transition-all shadow-xs"
          >
            Get Early Access
          </a>
        </div>

      </div>
    </header>
  );
}