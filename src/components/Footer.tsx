// src/components/Footer.tsx
const LINKS = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

export default function Footer() {
  return (
    <footer className="bg-brand-navy py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-xl font-extrabold text-white">Dashfixe</span>
          <p className="text-sm text-slate-400">© 2026 Dashfixe. Built by Noxa Softwares.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
