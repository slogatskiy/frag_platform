import Link from "next/link";

const FEATURES = [
  {
    title: "Portfolio dashboard",
    desc: "Your whole collection as an asset — total value, growth over time, and allocation across houses.",
    icon: "◈",
  },
  {
    title: "Cost-per-wear",
    desc: "The real price of pleasure — factoring in bottle size, what's left, and how often you reach for it.",
    icon: "◎",
  },
  {
    title: "Collector community",
    desc: "A social feed of impressions, ratings and daily wears — follow friends and compare shelves.",
    icon: "◔",
  },
  {
    title: "Your shelf, shared",
    desc: "A beautiful public page for your collection. Share the link, top the shelf leaderboard.",
    icon: "◐",
  },
];

const EXTRAS = [
  "59,000+ fragrances",
  "Discover by notes",
  "Scent of the day",
  "Quiz & battles",
  "Perfume news",
  "Real retail prices",
];

const PREVIEW_BOTTLES = [
  { brand: "Creed", name: "Aventus", value: "$340", cpw: "$1.90/wear" },
  { brand: "MFK", name: "Baccarat Rouge 540", value: "$310", cpw: "$3.10/wear" },
  { brand: "Dior", name: "Sauvage EDT", value: "$95", cpw: "$0.40/wear" },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_-10%,rgba(245,200,120,0.14),transparent),radial-gradient(50%_40%_at_85%_20%,rgba(160,120,255,0.10),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
          {/* Left: copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              For fragrance collectors
            </span>
            <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              How much is
              <br />
              <span className="italic bg-gradient-to-r from-amber-200 via-amber-100 to-fuchsia-200 bg-clip-text text-transparent">
                your shelf
              </span>{" "}
              worth?
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-neutral-400">
              Build your collection, discover its real market value, follow
              prices, and share your shelf with friends. Not just a catalog — a
              portfolio tracker for perfume.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/catalog"
                className="rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
              >
                Start your shelf
              </Link>
              <Link
                href="/catalog"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-neutral-200 transition hover:border-white/30"
              >
                Browse catalog
              </Link>
            </div>
          </div>

          {/* Right: portfolio preview card */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-500/10 to-fuchsia-500/10 blur-2xl" />
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-400">Your shelf</div>
                <div className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  +4.2% this month
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="font-display text-4xl font-semibold tracking-tight">
                  $6,240
                </div>
                <div className="text-sm text-neutral-500">47 bottles</div>
              </div>

              <div className="mt-6 space-y-2">
                {PREVIEW_BOTTLES.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-500">
                        {b.brand}
                      </div>
                      <div className="text-sm font-medium text-neutral-200">
                        {b.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{b.value}</div>
                      <div className="text-xs text-neutral-500">{b.cpw}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-xs text-neutral-600">
                Illustrative preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-200">
          Everything a collector actually wants
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="text-2xl text-amber-300/90">{f.icon}</div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {EXTRAS.map((e) => (
            <span
              key={e}
              className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-neutral-400"
            >
              {e}
            </span>
          ))}
        </div>
      </section>

      {/* Closing band */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            Your collection is worth more than you think.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-neutral-400">
            Start tracking it in minutes.
          </p>
          <Link
            href="/catalog"
            className="mt-8 inline-block rounded-full bg-neutral-100 px-7 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Start your shelf
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-neutral-600">
        Frag · a portfolio tracker for perfume · in development
      </footer>
    </main>
  );
}
