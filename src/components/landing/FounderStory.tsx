export default function FounderStory() {
  return (
    <section className="bg-df-black py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] text-df-primary mb-6">
          Our Story
        </p>

        <h2 className="font-garamond text-4xl sm:text-5xl text-white leading-tight mb-10">
          We built this because<br />
          <em>we needed it ourselves.</em>
        </h2>

        <div className="space-y-6 font-manrope text-base text-white/60 leading-relaxed max-w-2xl">
          <p>
            In Portugal, finding a reliable repair professional is a phone call to a contact saved under "canalizador do meu pai" — a plumber someone's father vouched for years ago. When that person is busy or retired, you're on your own.
          </p>
          <p>
            We watched neighbours leave voicemails that were never returned. We saw landlords waiting two weeks for a simple fix. We heard artisans complain about slow months and unpredictable income.
          </p>
          <p>
            Dashfixe exists to close that gap — connecting the people who need things fixed with the people who fix them, without the friction that wastes everyone's time.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-df-primary/20 border border-df-primary/40 flex items-center justify-center">
            <span className="font-garamond text-sm text-df-primary">A</span>
          </div>
          <div>
            <p className="font-manrope text-sm font-semibold text-white">Abiola Ogunsola</p>
            <p className="font-manrope text-xs text-white/40">Founder, Dashfixe</p>
          </div>
        </div>

      </div>
    </section>
  );
}
