import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addToCollection } from "@/app/actions/collection";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { BottleThumb } from "@/components/bottle-thumb";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; sort?: string }>;

const PAGE_SIZE = 60;

export const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "name", label: "Name A–Z" },
  { key: "year_desc", label: "Newest" },
  { key: "year_asc", label: "Oldest" },
  { key: "price_desc", label: "Price high→low" },
];

function orderByFor(sort?: string) {
  switch (sort) {
    case "name":
      return [{ brand: { name: "asc" as const } }, { name: "asc" as const }];
    case "year_desc":
      return [{ releaseYear: { sort: "desc" as const, nulls: "last" as const } }, { name: "asc" as const }];
    case "year_asc":
      return [{ releaseYear: { sort: "asc" as const, nulls: "last" as const } }, { name: "asc" as const }];
    case "price_desc":
      return [{ retailPrice: { sort: "desc" as const, nulls: "last" as const } }, { name: "asc" as const }];
    default: // featured: сначала с фото, затем с ценой, затем по имени
      return [
        { imageUrl: { sort: "desc" as const, nulls: "last" as const } },
        { retailPrice: { sort: "desc" as const, nulls: "last" as const } },
        { name: "asc" as const },
      ];
  }
}

async function getFragrances(q?: string, sort?: string) {
  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { brand: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : undefined;

    const [list, total] = await Promise.all([
      prisma.fragrance.findMany({
        where,
        include: { brand: true },
        orderBy: orderByFor(sort),
        take: PAGE_SIZE,
      }),
      prisma.fragrance.count({ where }),
    ]);
    return { list, total };
  } catch {
    return null; // database not reachable (e.g. env not set on this host)
  }
}

const CONC_LABEL: Record<string, string> = {
  PARFUM: "Parfum",
  EDP: "Eau de Parfum",
  EDT: "Eau de Toilette",
  EDC: "Eau de Cologne",
  EXTRAIT: "Extrait",
  OTHER: "",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, sort } = await searchParams;
  const activeSort = sort ?? "featured";
  const fragrances = await getFragrances(q, activeSort);
  const sortHref = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (key !== "featured") p.set("sort", key);
    const s = p.toString();
    return s ? `/catalog?${s}` : "/catalog";
  };

  // Что уже в вишлисте текущего пользователя — чтобы залить сердечко.
  const me = await getCurrentUser().catch(() => null);
  const wishlistIds = me
    ? new Set(
        (
          await prisma.wishlistItem.findMany({
            where: { userId: me.id },
            select: { fragranceId: true },
          })
        ).map((w) => w.fragranceId)
      )
    : new Set<string>();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Catalog
        </h1>
        <p className="mt-3 max-w-md text-neutral-400">
          Find a fragrance and add it to your collection.
        </p>

        <form className="mt-8 max-w-xl" action="/catalog">
          {activeSort !== "featured" && (
            <input type="hidden" name="sort" value={activeSort} />
          )}
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600">
              ⌕
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search: Sauvage, Creed, Baccarat…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-4 text-neutral-100 placeholder:text-neutral-600 focus:border-white/25 focus:outline-none"
            />
          </div>
        </form>

        {/* Sort bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-600">Sort:</span>
          {SORT_OPTIONS.map((o) => (
            <Link
              key={o.key}
              href={sortHref(o.key)}
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

        {fragrances === null ? (
          <p className="mt-12 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5 text-sm text-amber-200/90">
            The database isn&apos;t connected on this environment yet. The
            catalog works locally.
          </p>
        ) : fragrances.list.length === 0 ? (
          <p className="mt-12 text-neutral-500">
            Nothing found{q ? ` for “${q}”` : ""}.
          </p>
        ) : (
          <>
            <div className="mt-8 text-sm text-neutral-500">
              {q
                ? `${fragrances.total.toLocaleString("en-US")} result${
                    fragrances.total === 1 ? "" : "s"
                  } for “${q}”${
                    fragrances.total > PAGE_SIZE ? ` · showing first ${PAGE_SIZE}` : ""
                  }`
                : `${fragrances.total.toLocaleString("en-US")} fragrances · search to narrow down`}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fragrances.list.map((f) => (
                <div
                  key={f.id}
                  className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <Link
                    href={`/fragrance/${f.slug}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wider text-amber-300/70">
                        {f.brand.name}
                      </div>
                      <div className="mt-1 font-display text-lg font-semibold leading-snug transition group-hover:text-white">
                        {f.name}
                      </div>
                    </div>
                    <BottleThumb
                      imageUrl={f.imageUrl}
                      brand={f.brand.name}
                      className="h-14 w-10 shrink-0"
                    />
                  </Link>

                  <div className="mt-2 flex items-center justify-between text-sm text-neutral-500">
                    <span>
                      {f.concentration ? CONC_LABEL[f.concentration] : ""}
                      {f.releaseYear ? ` · ${f.releaseYear}` : ""}
                    </span>
                    {f.retailPrice != null && (
                      <span
                        className={`font-medium ${
                          f.priceEstimated ? "text-neutral-400" : "text-emerald-300/90"
                        }`}
                        title={f.priceEstimated ? "Estimated price" : "Confirmed retail price"}
                      >
                        {f.priceEstimated ? "~" : ""}${Number(f.retailPrice).toFixed(0)}
                      </span>
                    )}
                  </div>

                  {f.notesTop.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.notesTop.slice(0, 3).map((n) => (
                        <Link
                          key={n}
                          href={`/discover?notes=${encodeURIComponent(n)}`}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400 transition hover:border-amber-400/40 hover:text-amber-200"
                        >
                          {n}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-2">
                    <form
                      className="flex-1"
                      action={async () => {
                        "use server";
                        await addToCollection(f.id);
                      }}
                    >
                      <button className="w-full rounded-full border border-white/12 py-2 text-sm font-medium text-neutral-300 transition group-hover:border-white/25 hover:bg-white/5">
                        + Add to collection
                      </button>
                    </form>
                    {(() => {
                      const wished = wishlistIds.has(f.id);
                      return (
                        <form
                          action={async () => {
                            "use server";
                            if (wished) await removeFromWishlist(f.id);
                            else await addToWishlist(f.id);
                          }}
                        >
                          <button
                            aria-label={wished ? "remove from wishlist" : "add to wishlist"}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              wished
                                ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300"
                                : "border-white/12 text-neutral-500 hover:border-white/25 hover:text-fuchsia-300"
                            }`}
                          >
                            {wished ? "♥" : "♡"}
                          </button>
                        </form>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
