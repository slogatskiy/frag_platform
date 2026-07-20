import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { costPerWear, fmtCostPerWear } from "@/lib/valuation";
import { BottleThumb } from "@/components/bottle-thumb";
import { ValueChart } from "@/components/value-chart";

export const dynamic = "force-dynamic";

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtMonth = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await prisma.collectionItem.findMany({
    where: { userId: user.id },
    include: { fragrance: { include: { brand: true } } },
    orderBy: { createdAt: "asc" },
  });

  const retailOf = (it: (typeof items)[number]) =>
    it.fragrance.retailPrice ? Number(it.fragrance.retailPrice) : null;
  const valueOf = (it: (typeof items)[number]) => {
    const r = retailOf(it);
    return r ? (r * it.remainingPct * it.quantity) / 100 : 0;
  };

  const totalValue = items.reduce((s, it) => s + valueOf(it), 0);
  const totalBottles = items.reduce((n, it) => n + it.quantity, 0);
  const priced = items.filter((it) => retailOf(it) != null);
  const avgBottle = totalBottles ? totalValue / totalBottles : 0;

  // Кумулятивная стоимость по датам добавления.
  let running = 0;
  const timeline = items.map((it) => {
    running += valueOf(it);
    return { label: fmtMonth(it.createdAt), v: Math.round(running) };
  });

  // Самый ценный флакон.
  const mostValuable = [...items].sort((a, b) => valueOf(b) - valueOf(a))[0];

  // Аллокация по брендам.
  const byBrand = new Map<string, number>();
  for (const it of items) {
    byBrand.set(it.fragrance.brand.name, (byBrand.get(it.fragrance.brand.name) ?? 0) + valueOf(it));
  }
  const brandRows = [...byBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const brandMax = Math.max(1, ...brandRows.map((r) => r[1]));

  // Cost-per-wear по каждому флакону.
  const cpwItems = items
    .map((it) => ({ it, cpw: costPerWear(retailOf(it), it.volumeMl ?? it.fragrance.retailVolume) }))
    .filter((x): x is { it: (typeof items)[number]; cpw: number } => x.cpw != null)
    .sort((a, b) => a.cpw - b.cpw);
  const bestValue = cpwItems[0];
  const mostPremium = cpwItems[cpwItems.length - 1];

  // Вкусовой профиль: топ-ноты по всей коллекции.
  const noteTally = new Map<string, number>();
  for (const it of items) {
    for (const n of [...it.fragrance.notesTop, ...it.fragrance.notesHeart, ...it.fragrance.notesBase]) {
      noteTally.set(n, (noteTally.get(n) ?? 0) + 1);
    }
  }
  const topNotes = [...noteTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const noteMax = Math.max(1, ...topNotes.map((r) => r[1]));

  if (items.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Your Portfolio</h1>
          <p className="mx-auto mt-3 max-w-md text-neutral-400">
            Track your collection like an asset — value over time, cost-per-wear, taste profile.
            Add a few bottles to bring it to life.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-block rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Browse catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/70">
          Collection portfolio
        </div>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
          {user.name ?? `@${user.handle}`}
        </h1>

        {/* Hero stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.1] to-transparent p-5 sm:col-span-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Total value</div>
            <div className="mt-1 font-display text-4xl font-semibold tabular-nums">{fmtUsd(totalValue)}</div>
            <div className="mt-1 text-xs text-neutral-500">
              across {totalBottles} bottle{totalBottles === 1 ? "" : "s"} · {items.length} unique
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Avg / bottle</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{fmtUsd(avgBottle)}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Priced</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {priced.length}/{items.length}
            </div>
          </div>
        </div>

        {/* Value over time */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Value over time
          </h2>
          <div className="mt-3">
            <ValueChart points={timeline} fmt={fmtUsd} />
          </div>
        </section>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {/* Brand allocation */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Allocation by house
            </h2>
            <div className="mt-4 space-y-3">
              {brandRows.map(([brand, val]) => (
                <div key={brand}>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-300">{brand}</span>
                    <span className="tabular-nums text-neutral-500">{fmtUsd(val)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400/70 to-amber-300"
                      style={{ width: `${(val / brandMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Taste profile */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Your taste profile
            </h2>
            {topNotes.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No notes data yet.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {topNotes.map(([note, count]) => (
                  <Link
                    key={note}
                    href={`/discover?note=${encodeURIComponent(note)}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300 transition hover:border-amber-300/40"
                    style={{ opacity: 0.55 + 0.45 * (count / noteMax) }}
                  >
                    {note} <span className="text-neutral-600">×{count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Highlights */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {mostValuable && (
            <HighlightCard
              label="Most valuable"
              value={fmtUsd(valueOf(mostValuable))}
              it={mostValuable}
            />
          )}
          {bestValue && (
            <HighlightCard
              label="Best value / wear"
              value={fmtCostPerWear(bestValue.cpw) + " / wear"}
              it={bestValue.it}
            />
          )}
          {mostPremium && mostPremium !== bestValue && (
            <HighlightCard
              label="Most premium / wear"
              value={fmtCostPerWear(mostPremium.cpw) + " / wear"}
              it={mostPremium.it}
            />
          )}
        </section>

        <div className="mt-10">
          <Link href="/shelf" className="text-sm text-amber-300/80 transition hover:text-amber-200">
            Manage bottles on your shelf →
          </Link>
        </div>
      </div>
    </main>
  );
}

function HighlightCard({
  label,
  value,
  it,
}: {
  label: string;
  value: string;
  it: {
    fragrance: { slug: string; name: string; imageUrl: string | null; brand: { name: string } };
  };
}) {
  return (
    <Link
      href={`/fragrance/${it.fragrance.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25"
    >
      <BottleThumb
        imageUrl={it.fragrance.imageUrl}
        brand={it.fragrance.brand.name}
        className="h-16 w-12 shrink-0"
      />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/70">
          {label}
        </div>
        <div className="mt-0.5 truncate font-display font-semibold leading-tight">
          {it.fragrance.name}
        </div>
        <div className="mt-0.5 text-sm tabular-nums text-neutral-400">{value}</div>
      </div>
    </Link>
  );
}
