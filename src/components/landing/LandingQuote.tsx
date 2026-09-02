export default function LandingQuote() {
  return (
    <section className="bg-df-surface-warm py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <svg className="w-8 h-8 text-df-primary/40 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <blockquote className="font-garamond text-2xl sm:text-3xl md:text-4xl text-df-black leading-snug italic">
          "It's not a shortage of artisans. It's a failure of connection. When an emergency strikes, you don't need a list of phone numbers — you need the person who is available right now."
        </blockquote>
        <p className="font-manrope text-sm text-df-muted font-medium tracking-wide uppercase">
          The Dashfixe Philosophy
        </p>
      </div>
    </section>
  );
}
