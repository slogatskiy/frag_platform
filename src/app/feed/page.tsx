import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { getFeedPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { BottleThumb } from "@/components/bottle-thumb";
import { Avatar } from "@/components/avatar";
import { NewsCard } from "@/components/news-card";
import { getRecentNews } from "@/lib/news";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Activity = {
  kind: "collect" | "wish";
  createdAt: Date;
  user: { handle: string; name: string | null; avatarUrl: string | null };
  fragrance: { slug: string; name: string; imageUrl: string | null; brand: { name: string } };
};

function ActivityLine({ a }: { a: Activity }) {
  const who = a.user.name ?? `@${a.user.handle}`;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.015] px-4 py-3">
      <Link href={`/u/${a.user.handle}`}>
        <Avatar name={a.user.name} handle={a.user.handle} avatarUrl={a.user.avatarUrl} size="sm" />
      </Link>
      <Link href={`/fragrance/${a.fragrance.slug}`}>
        <BottleThumb
          imageUrl={a.fragrance.imageUrl}
          brand={a.fragrance.brand.name}
          className="h-12 w-10 shrink-0"
        />
      </Link>
      <div className="min-w-0 flex-1 text-sm text-neutral-300">
        <Link href={`/u/${a.user.handle}`} className="font-semibold text-neutral-100 hover:text-white">
          {who}
        </Link>{" "}
        <span className="text-neutral-400">{a.kind === "collect" ? "added" : "wants"}</span>{" "}
        <Link href={`/fragrance/${a.fragrance.slug}`} className="text-amber-200 hover:text-amber-100">
          {a.fragrance.name}
        </Link>
        <span className="text-neutral-500"> · {a.fragrance.brand.name}</span>
      </div>
      <span className="shrink-0 text-xs text-neutral-600">{timeAgo(a.createdAt)}</span>
    </div>
  );
}

export default async function FeedPage() {
  const me = await getCurrentUser().catch(() => null);
  if (!me) redirect("/login");

  const friendIds = await getFriendIds(me.id);
  const authorIds = [me.id, ...friendIds];

  const [posts, collects, wishes, news] = await Promise.all([
    getFeedPosts(me.id, friendIds),
    prisma.collectionItem.findMany({
      where: { userId: { in: authorIds } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { handle: true, name: true, avatarUrl: true } },
        fragrance: { select: { slug: true, name: true, imageUrl: true, brand: { select: { name: true } } } },
      },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: { in: authorIds } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { handle: true, name: true, avatarUrl: true } },
        fragrance: { select: { slug: true, name: true, imageUrl: true, brand: { select: { name: true } } } },
      },
    }),
    getRecentNews(15),
  ]);

  const activity: Activity[] = [
    ...collects.map((c) => ({ kind: "collect" as const, createdAt: c.createdAt, user: c.user, fragrance: c.fragrance })),
    ...wishes.map((w) => ({ kind: "wish" as const, createdAt: w.createdAt, user: w.user, fragrance: w.fragrance })),
  ];

  // Единый таймлайн: посты (богатые) + активность (лёгкая), свежее сверху.
  type Item = { t: number; node: React.ReactNode; key: string };
  const items: Item[] = [
    ...posts.map((p) => ({ t: p.createdAt.getTime(), key: `p-${p.id}`, node: <PostCard post={p} /> })),
    ...activity.map((a, i) => ({
      t: a.createdAt.getTime(),
      key: `a-${a.kind}-${i}-${a.createdAt.getTime()}`,
      node: <ActivityLine a={a} />,
    })),
    ...news.map((n) => ({
      t: n.publishedAt.getTime(),
      key: `n-${n.id}`,
      node: <NewsCard item={n} />,
    })),
  ].sort((x, y) => y.t - x.t);

  const empty = items.length === 0;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Feed</h1>
          <Link href="/catalog" className="text-sm text-neutral-500 transition hover:text-neutral-300">
            Browse catalog →
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          What you and your friends are wearing, wanting and thinking.
        </p>

        {/* Compose prompt */}
        <Link
          href="/catalog"
          className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.04]"
        >
          <Avatar name={me.name} handle={me.handle} avatarUrl={me.avatarUrl} size="sm" />
          <span className="text-sm text-neutral-500">
            Share your impression of a fragrance…
          </span>
          <span className="ml-auto rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-900">
            Post
          </span>
        </Link>

        {empty ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-neutral-300">Your feed is quiet for now.</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add friends, or post your first impression from any fragrance page.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/catalog" className="rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white">
                Explore fragrances
              </Link>
              <Link href="/friends" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-white/30">
                Find friends
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {items.map((it) => (
              <div key={it.key}>{it.node}</div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
