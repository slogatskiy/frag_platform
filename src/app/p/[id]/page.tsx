import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPost } from "@/lib/posts";
import { deletePost } from "@/app/actions/posts";
import { PostCard } from "@/components/post-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id, null);
  if (!post) return { title: "Post — Frag" };

  const who = post.user.name ?? `@${post.user.handle}`;
  const rating = post.rating != null ? ` · ${post.rating}/10` : "";
  const title = `${who} on ${post.fragrance.name}${rating}`;
  const description =
    post.body?.slice(0, 200) ||
    `${post.fragrance.brand.name} — ${post.fragrance.name} on Frag`;
  // Фото поста в приоритете над фото флакона
  const ogImage = post.imageUrl ?? post.fragrance.imageUrl;

  return {
    title: `${title} — Frag`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser().catch(() => null);
  const post = await getPost(id, me?.id ?? null);
  if (!post) notFound();

  const mine = me?.handle === post.user.handle;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/feed" className="text-sm text-neutral-500 transition hover:text-neutral-300">
          ← Feed
        </Link>

        <div className="mt-6">
          <PostCard post={post} />
        </div>

        {mine && (
          <form action={deletePost.bind(null, post.id)} className="mt-4">
            <button className="text-sm text-neutral-600 transition hover:text-rose-400">
              Delete post
            </button>
          </form>
        )}

        {!me && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="font-display text-lg text-neutral-100">
              Track your collection on Frag
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              See what it&apos;s worth, share your take, follow friends&apos; shelves.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-neutral-100 px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Join free
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
