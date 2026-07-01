import { prisma } from "@/lib/prisma";
import { addToCollection } from "@/app/actions/collection";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

async function getFragrances(q?: string) {
  try {
    return await prisma.fragrance.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { brand: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: { brand: true },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      take: 100,
    });
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
  const { q } = await searchParams;
  const fragrances = await getFragrances(q);

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

        {fragrances === null ? (
          <p className="mt-12 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5 text-sm text-amber-200/90">
            The database isn&apos;t connected on this environment yet. The
            catalog works locally.
          </p>
        ) : fragrances.length === 0 ? (
          <p className="mt-12 text-neutral-500">
            Nothing found{q ? ` for “${q}”` : ""}.
          </p>
        ) : (
          <>
            <div className="mt-8 text-sm text-neutral-500">
              {fragrances.length} fragrance
              {fragrances.length === 1 ? "" : "s"}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fragrances.map((f) => (
                <div
                  key={f.id}
                  className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-amber-300/70">
                        {f.brand.name}
                      </div>
                      <div className="mt-1 font-display text-lg font-semibold leading-snug">
                        {f.name}
                      </div>
                    </div>
                    <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-gradient-to-b from-white/10 to-transparent text-[10px] text-neutral-500">
                      ▢
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-neutral-500">
                    {f.concentration ? CONC_LABEL[f.concentration] : ""}
                    {f.releaseYear ? ` · ${f.releaseYear}` : ""}
                  </div>

                  {f.notesTop.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.notesTop.slice(0, 3).map((n) => (
                        <span
                          key={n}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  <form
                    className="mt-5"
                    action={async () => {
                      "use server";
                      await addToCollection(f.id);
                    }}
                  >
                    <button className="w-full rounded-full border border-white/12 py-2 text-sm font-medium text-neutral-300 transition group-hover:border-white/25 hover:bg-white/5">
                      + Add to collection
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
