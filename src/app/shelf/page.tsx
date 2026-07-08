import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { removeFromCollection, changeQuantity } from "@/app/actions/collection";
import { BottleThumb } from "@/components/bottle-thumb";

export const dynamic = "force-dynamic";

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "added", label: "Date added" },
  { key: "value", label: "Value" },
  { key: "name", label: "Name A–Z" },
  { key: "brand", label: "Brand" },
  { key: "year", label: "Newest" },
];

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { sort } = await searchParams;
  const activeSort = sort ?? "added";

  const items = await prisma.collectionItem.findMany({
    where: { userId: user.id },
    include: { fragrance: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Оценка стоимости: ритейл-цена × доля остатка.
  const valueOf = (retail: number | null, remainingPct: number) =>
    retail ? (retail * remainingPct) / 100 : 0;

  const totalValue = items.reduce(
    (sum, it) =>
      sum +
      valueOf(
        it.fragrance.retailPrice ? Number(it.fragrance.retailPrice) : null,
        it.remainingPct
      ) *
        it.quantity,
    0
  );

  const totalBottles = items.reduce((n, it) => n + it.quantity, 0);

  const itemValue = (it: (typeof items)[number]) =>
    valueOf(it.fragrance.retailPrice ? Number(it.fragrance.retailPrice) : null, it.remainingPct) *
    it.quantity;

  const sortedItems = [...items].sort((a, b) => {
    switch (activeSort) {
      case "value":
        return itemValue(b) - itemValue(a);
      case "name":
        return a.fragrance.name.localeCompare(b.fragrance.name);
      case "brand":
        return (
          a.fragrance.brand.name.localeCompare(b.fragrance.brand.name) ||
          a.fragrance.name.localeCompare(b.fragrance.name)
        );
      case "year":
        return (b.fragrance.releaseYear ?? 0) - (a.fragrance.releaseYear ?? 0);
      default: // added
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Header + valuation */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-sm text-neutral-500">@{user.handle}</div>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
              My Shelf
            </h1>
            <Link
              href={`/u/${user.handle}`}
              className="mt-2 inline-block text-sm text-amber-300/80 transition hover:text-amber-200"
            >
              View public page →
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-right">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Estimated value
            </div>
            <div className="mt-1 font-display text-3xl font-semibold">
              {fmtUsd(totalValue)}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {totalBottles} bottle{totalBottles === 1 ? "" : "s"} ·{" "}
              {items.length} unique
            </div>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="font-display text-2xl">Your shelf is empty</div>
            <p className="mx-auto mt-3 max-w-sm text-neutral-400">
              Add a few fragrances from the catalog and watch your shelf value
              appear.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-block rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <>
            {/* Sort bar */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-neutral-600">
                Sort:
              </span>
              {SORT_OPTIONS.map((o) => (
                <Link
                  key={o.key}
                  href={o.key === "added" ? "/shelf" : `/shelf?sort=${o.key}`}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    activeSort === o.key
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/25"
                  }`}
                >
                  {o.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedItems.map((it) => {
              const retail = it.fragrance.retailPrice
                ? Number(it.fragrance.retailPrice)
                : null;
              const value = valueOf(retail, it.remainingPct);
              return (
                <div
                  key={it.id}
                  className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-5"
                >
                  <div className="flex items-start gap-4">
                    <BottleThumb
                      imageUrl={it.fragrance.imageUrl}
                      brand={it.fragrance.brand.name}
                      className="h-20 w-16 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-amber-300/70">
                        {it.fragrance.brand.name}
                      </div>
                      <Link
                        href={`/fragrance/${it.fragrance.slug}`}
                        className="mt-1 block font-display text-lg font-semibold leading-snug transition hover:text-white"
                      >
                        {it.fragrance.name}
                      </Link>
                      <div className="mt-1 text-sm text-neutral-500">
                        {it.volumeMl ? `${it.volumeMl} ml` : "—"} ·{" "}
                        {it.remainingPct}% left
                      </div>
                    </div>
                  </div>

                  {/* remaining bar */}
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-400/80"
                      style={{ width: `${it.remainingPct}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{fmtUsd(value * it.quantity)}</div>
                      {it.quantity > 1 && (
                        <div className="text-xs text-neutral-500">
                          {fmtUsd(value)} each
                        </div>
                      )}
                    </div>

                    {/* quantity stepper */}
                    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                      <form
                        action={async () => {
                          "use server";
                          await changeQuantity(it.id, -1);
                        }}
                      >
                        <button
                          aria-label="decrease"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
                        >
                          −
                        </button>
                      </form>
                      <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                        {it.quantity}
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          await changeQuantity(it.id, 1);
                        }}
                      >
                        <button
                          aria-label="increase"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-neutral-100"
                        >
                          +
                        </button>
                      </form>
                    </div>
                  </div>

                  <form
                    className="mt-3"
                    action={async () => {
                      "use server";
                      await removeFromCollection(it.id);
                    }}
                  >
                    <button className="text-xs text-neutral-600 transition hover:text-red-400">
                      Remove entirely
                    </button>
                  </form>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
