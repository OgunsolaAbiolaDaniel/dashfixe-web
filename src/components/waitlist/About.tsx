export default function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-line-soft bg-page">
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)] py-[clamp(56px,7vw,96px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] items-center gap-[clamp(32px,5vw,64px)]">
          <div>
            <div className="mb-3.5 text-label text-ink-40">About</div>
            <h2 className="mb-[22px] text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.08] tracking-[-.035em] text-ink">
              Why we built Dashfixe
            </h2>
            <p className="mb-[18px] max-w-[520px] text-[clamp(15.5px,1.3vw,17px)] font-medium leading-[1.65] text-ink-60 [text-wrap:pretty]">
              Dashfixe started when our founder — a newcomer to Portugal — needed a tap fixed
              urgently. His usual contact was busy, and having no local network, he had no fallback.
              The problem wasn't a shortage of skilled workers — it was a discovery and access
              barrier. We built Dashfixe to bridge that gap.
            </p>
            <p className="text-[14.5px] font-bold text-ink-40">A project by Noxa Softwares.</p>
          </div>
          <div className="overflow-hidden rounded-card border border-line bg-canvas">
            <img
              src="https://images.pexels.com/photos/5691503/pexels-photo-5691503.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="A tradesperson at work"
              loading="lazy"
              className="block h-[clamp(240px,26vw,340px)] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
