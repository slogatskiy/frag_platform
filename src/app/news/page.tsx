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

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Perfume News</h1>
        <p className="mt-2 text-neutral-500">
          Fresh from the fragrance world — releases, reviews and stories.
        </p>

        {news.length === 0 ? (
          <p className="mt-10 text-neutral-500">No news yet — check back soon.</p>
        ) : (
          <div className="mt-8 flex flex-col gap-5">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-neutral-600">
          Curated from Now Smell This, Bois de Jasmin & ÇaFleureBon.
        </p>
      </div>
    </main>
  );
}
