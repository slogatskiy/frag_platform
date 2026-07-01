import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
    return null; // база недоступна (например, не заданы env на хостинге)
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const fragrances = await getFragrances(q);

  return (
    <main className="flex-1 bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← на главную
          </Link>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Каталог ароматов</h1>
        <p className="mt-2 text-neutral-400">
          Найди аромат и добавь его в свою коллекцию.
        </p>

        <form className="mt-6" action="/catalog">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Поиск: Sauvage, Creed, Baccarat…"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          />
        </form>

        {fragrances === null ? (
          <p className="mt-10 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-300">
            База пока не подключена на этом окружении. Локально каталог работает.
          </p>
        ) : fragrances.length === 0 ? (
          <p className="mt-10 text-neutral-500">Ничего не найдено{q ? ` по «${q}»` : ""}.</p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fragrances.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 transition hover:border-neutral-700"
              >
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {f.brand.name}
                </div>
                <div className="mt-1 text-lg font-semibold">{f.name}</div>
                <div className="mt-1 text-sm text-neutral-500">
                  {f.concentration}
                  {f.releaseYear ? ` · ${f.releaseYear}` : ""}
                </div>
                {f.notesTop.length > 0 && (
                  <div className="mt-3 text-xs text-neutral-500">
                    {f.notesTop.slice(0, 3).join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
