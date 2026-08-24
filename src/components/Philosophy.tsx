// src/components/Philosophy.tsx
export default function Philosophy() {
  return (
    <section id="about" className="bg-brand-alt px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="text-4xl">💬</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy tracking-tight leading-tight">
          It's not a shortage of artisans. It's a failure of connection.
        </h2>
        <p className="text-lg sm:text-xl text-brand-slate leading-relaxed max-w-3xl mx-auto">
          You don't need a static list of phone numbers or endless web searches — you need the
          qualified professional who is available{' '}
          <span className="font-semibold text-brand-navy">right now</span>. We bridge the gap
          instantly.
        </p>
      </div>
    </section>
  );
}
