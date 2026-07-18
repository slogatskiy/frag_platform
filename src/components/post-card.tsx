/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BottleThumb } from "@/components/bottle-thumb";
import { Avatar } from "@/components/avatar";
import { LikeButton } from "@/components/like-button";
import { timeAgo } from "@/lib/format";

export type PostCardData = {
  id: string;
  createdAt: Date;
  rating: number | null;
  body: string;
  imageUrl: string | null;
  user: { handle: string; name: string | null; avatarUrl: string | null };
  fragrance: {
    slug: string;
    name: string;
    imageUrl: string | null;
    brand: { name: string };
  };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Link href={`/u/${post.user.handle}`}>
          <Avatar
            name={post.user.name}
            handle={post.user.handle}
            avatarUrl={post.user.avatarUrl}
            size="md"
          />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/u/${post.user.handle}`}
            className="text-sm font-semibold text-neutral-100 transition hover:text-white"
          >
            {post.user.name ?? `@${post.user.handle}`}
          </Link>
          <div className="text-xs text-neutral-500">{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {/* Fragrance + body */}
      <Link
        href={`/fragrance/${post.fragrance.slug}`}
        className="mt-4 flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15"
      >
        <BottleThumb
          imageUrl={post.fragrance.imageUrl}
          brand={post.fragrance.brand.name}
          className="h-20 w-16 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-amber-300/70">
            {post.fragrance.brand.name}
          </div>
          <div className="font-display text-lg font-semibold leading-tight text-neutral-100">
            {post.fragrance.name}
          </div>
          {post.rating != null && (
            <div className="mt-1 inline-flex items-center gap-1 text-sm">
              <span className="font-semibold text-amber-300">{post.rating}</span>
              <span className="text-neutral-600">/10</span>
            </div>
          )}
        </div>
      </Link>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.fragrance.name}
          className="mt-3 max-h-[32rem] w-full rounded-2xl border border-white/10 object-cover"
        />
      )}

      {post.body && (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200">
          {post.body}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <LikeButton
          postId={post.id}
          initialLiked={post.likedByMe}
          initialCount={post.likeCount}
        />
        <Link
          href={`/p/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-neutral-400 transition hover:border-white/25 hover:text-neutral-200"
        >
          <span>💬</span>
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
          <span className="text-neutral-500">Comment</span>
        </Link>
        <Link
          href={`/p/${post.id}`}
          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-neutral-400 transition hover:border-white/25 hover:text-neutral-200"
        >
          Share ↗
        </Link>
      </div>
    </article>
  );
}
