import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPost, getPostComments } from "@/lib/posts";
import { deletePost, createComment, deleteComment } from "@/app/actions/posts";
import { PostCard } from "@/components/post-card";
import { timeAgo } from "@/lib/format";

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

  const comments = await getPostComments(id);
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

        {/* Comments */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">
            Comments
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                {comments.length}
              </span>
            )}
          </h2>

          {me ? (
            <form action={createComment} className="mt-4 flex gap-2">
              <input type="hidden" name="postId" value={post.id} />
              <input
                name="body"
                required
                maxLength={1000}
                placeholder="Add a comment…"
                className="flex-1 rounded-full border border-white/10 bg-neutral-950/50 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
              />
              <button className="rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white">
                Send
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              <Link href="/login" className="text-amber-300 hover:text-amber-200">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300/30 to-amber-500/10 text-xs font-semibold text-amber-200">
                  {(c.user.name || c.user.handle).trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/u/${c.user.handle}`}
                      className="text-sm font-semibold text-neutral-100 hover:text-white"
                    >
                      {c.user.name ?? `@${c.user.handle}`}
                    </Link>
                    <span className="text-xs text-neutral-600">{timeAgo(c.createdAt)}</span>
                    {me?.id === c.userId && (
                      <form action={deleteComment.bind(null, c.id)} className="ml-auto">
                        <button className="text-xs text-neutral-700 transition hover:text-rose-400">
                          delete
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-[15px] text-neutral-200">
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
