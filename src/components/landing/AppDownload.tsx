const APPS = [
  {
    label: 'Download the Dashfixe app',
    sub: 'Scan to download',
  },
  {
    label: 'Download the Artisan app',
    sub: 'Scan to download',
  },
];

function QRCode() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="8" fill="#221F1C"/>
      {/* Top-left finder */}
      <rect x="8" y="8" width="20" height="20" rx="2" fill="white"/>
      <rect x="12" y="12" width="12" height="12" rx="1" fill="#221F1C"/>
      {/* Top-right finder */}
      <rect x="44" y="8" width="20" height="20" rx="2" fill="white"/>
      <rect x="48" y="12" width="12" height="12" rx="1" fill="#221F1C"/>
      {/* Bottom-left finder */}
      <rect x="8" y="44" width="20" height="20" rx="2" fill="white"/>
      <rect x="12" y="48" width="12" height="12" rx="1" fill="#221F1C"/>
      {/* Data dots */}
      <rect x="36" y="36" width="6" height="6" rx="1" fill="white"/>
      <rect x="44" y="36" width="6" height="6" rx="1" fill="white"/>
      <rect x="52" y="36" width="6" height="6" rx="1" fill="white"/>
      <rect x="60" y="36" width="6" height="6" rx="1" fill="white"/>
      <rect x="36" y="44" width="6" height="6" rx="1" fill="white"/>
      <rect x="52" y="44" width="6" height="6" rx="1" fill="white"/>
      <rect x="36" y="52" width="6" height="6" rx="1" fill="white"/>
      <rect x="44" y="52" width="6" height="6" rx="1" fill="white"/>
      <rect x="60" y="52" width="6" height="6" rx="1" fill="white"/>
      <rect x="36" y="60" width="6" height="6" rx="1" fill="white"/>
      <rect x="52" y="60" width="6" height="6" rx="1" fill="white"/>
      <rect x="60" y="60" width="6" height="6" rx="1" fill="white"/>
    </svg>
  );
}

export default function AppDownload() {
  return (
    <section className="bg-df-cream py-16 px-4 sm:px-6 lg:px-8 border-t border-df-border">
      <div className="max-w-7xl mx-auto">

        <h2 className="font-garamond text-4xl sm:text-5xl text-df-black mb-10">
          It's easier in the apps
        </h2>

        <div className="flex flex-col sm:flex-row gap-8">
          {APPS.map((app) => (
            <a
              key={app.label}
              href="#"
              className="group flex items-center gap-5 bg-white rounded-2xl border border-df-border px-6 py-5 hover:shadow-md transition-shadow flex-1 max-w-sm"
            >
              <QRCode />
              <div className="flex-1">
                <div className="font-manrope text-sm font-semibold text-df-black group-hover:underline leading-snug">
                  {app.label}
                </div>
                <div className="font-manrope text-xs text-df-muted mt-1">{app.sub}</div>
              </div>
              <svg className="w-4 h-4 text-df-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
