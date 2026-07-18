import type { Metadata } from "next";
import { getRecentNews } from "@/lib/news";
import { NewsCard } from "@/components/news-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Perfume News — Frag",
  description: "Latest from the fragrance world — new releases, reviews and stories.",
};

export default async function NewsPage() {
  const news = await getRecentNews(40);

  const [lead, ...rest] = news;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/70">
              The Fragrance Desk
            </div>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
              Perfume News
            </h1>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-neutral-500 sm:block">
            Fresh releases, reviews and stories from the perfume world.
          </p>
        </div>

        {news.length === 0 ? (
          <p className="mt-10 text-neutral-500">No news yet — check back soon.</p>
        ) : (
          <>
            <div className="mt-8">
              <NewsCard item={lead} featured />
            </div>
            {rest.length > 0 && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </div>
            )}
          </>
        )}

        <p className="mt-12 text-center text-xs text-neutral-600">
          Curated from Now Smell This, Bois de Jasmin & ÇaFleureBon.
        </p>
      </div>
    </main>
  );
}
