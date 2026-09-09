export default function AccountSplit({ onAuth }: { onAuth: () => void }) {
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-[1280px] px-[clamp(18px,4vw,40px)] pb-[clamp(56px,7vw,96px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-[clamp(28px,4vw,56px)]">
          <div>
            <h2 className="mb-[18px] text-[clamp(28px,3.6vw,44px)] font-extrabold leading-[1.06] tracking-[-.04em] text-ink [text-wrap:balance]">
              Log in to see your jobs
            </h2>
            <p className="mb-[30px] max-w-[400px] text-[17px] font-medium leading-[1.6] text-ink-60">
              Past visits, saved addresses, the artisans you liked, and every receipt in one place.
            </p>
            <div className="flex flex-wrap items-center gap-[26px]">
              <button
                type="button"
                onClick={onAuth}
                className="h-14 rounded-btn bg-ink px-[30px] text-base font-bold text-white transition hover:bg-ink-80"
              >
                Log in to your account
              </button>
              <button
                type="button"
                onClick={onAuth}
                className="border-b border-[#c8d1e0] pb-1 text-base font-semibold text-ink transition hover:border-ink"
              >
                Create an account
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-card bg-well">
            <img
              src="https://images.pexels.com/photos/5691503/pexels-photo-5691503.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt=""
              loading="lazy"
              className="block h-[clamp(260px,28vw,380px)] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
