import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POPULAR_NOTES, parseNotes, toggleNoteHref } from "@/lib/notes";
import { saveFavoriteNotes } from "@/app/actions/notes";
import { BottleThumb } from "@/components/bottle-thumb";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  concentration: string | null;
  releaseYear: number | null;
  price: number | null;
  matches: number;
};

async function match(selected: string[]): Promise<Row[]> {
  if (!selected.length) return [];
  const arr = Prisma.sql`ARRAY[${Prisma.join(selected)}]::text[]`;
  return prisma.$queryRaw<Row[]>`
    SELECT f.slug, f.name, f."imageUrl" AS "imageUrl", f.concentration::text AS concentration,
           f."releaseYear" AS "releaseYear", f."retailPrice"::float8 AS price, b.name AS brand,
           cardinality(ARRAY(
             SELECT DISTINCT unnest(f."notesTop"||f."notesHeart"||f."notesBase")
             INTERSECT SELECT unnest(${arr})
           ))::int AS matches
    FROM "Fragrance" f JOIN "Brand" b ON b.id = f."brandId"
    WHERE (f."notesTop"||f."notesHeart"||f."notesBase") && ${arr}
    ORDER BY matches DESC, (f."imageUrl" IS NOT NULL) DESC, f."retailPrice" DESC NULLS LAST
    LIMIT 60`;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ notes?: string }>;
}) {
  const { notes: notesParam } = await searchParams;
  const me = await getCurrentUser().catch(() => null);

  // Если ноты не заданы в URL — берём любимые из профиля.
  const selected =
    notesParam !== undefined
      ? parseNotes(notesParam)
      : me?.favoriteNotes ?? [];

  const results = await match(selected);
  const csv = selected.join(",");
  const isFav =
    me != null &&
    selected.length > 0 &&
    selected.length === (me.favoriteNotes?.length ?? 0) &&
    selected.every((n) => me.favoriteNotes.includes(n));

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Discover by notes
        </h1>
        <p className="mt-3 max-w-lg text-neutral-400">
          Pick the notes you love — we&apos;ll match fragrances that have the most
          of them.
        </p>

        {/* Note selector */}
        <div className="mt-8 flex flex-wrap gap-2">
          {POPULAR_NOTES.map((n) => {
            const active = selected.includes(n);
            return (
              <Link
                key={n}
                href={toggleNoteHref("/discover", selected, n)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                    : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25"
                }`}
              >
                {active ? "✓ " : ""}
                {n}
              </Link>
            );
          })}
        </div>

        {/* Selected + save */}
        {selected.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/discover?notes="
              className="text-sm text-neutral-500 transition hover:text-neutral-300"
            >
              Clear all
            </Link>
            {me && !isFav && (
              <form
                action={async () => {
                  "use server";
                  await saveFavoriteNotes(csv);
                }}
              >
                <button className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-neutral-200 transition hover:border-white/30">
                  ★ Save as my favorite notes
                </button>
              </form>
            )}
            {me && isFav && (
              <span className="text-sm text-amber-300/80">★ Saved to your profile</span>
            )}
            {!me && (
              <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-300">
                Sign in to save favorites
              </Link>
            )}
          </div>
        )}

        {/* Results */}
        {selected.length === 0 ? (
          <p className="mt-12 text-neutral-500">
            Select a few notes above to see your matches.
          </p>
        ) : results.length === 0 ? (
          <p className="mt-12 text-neutral-500">No matches. Try other notes.</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <Link
                key={r.slug}
                href={`/fragrance/${r.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <BottleThumb
                  imageUrl={r.imageUrl}
                  brand={r.brand}
                  className="h-16 w-12 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-amber-300/70">
                    {r.brand}
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold leading-snug transition group-hover:text-white">
                    {r.name}
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                    {r.matches} of your {selected.length} notes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
