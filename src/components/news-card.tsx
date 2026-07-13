/* eslint-disable @next/next/no-img-element */
import { timeAgo } from "@/lib/format";

export type NewsCardData = {
  title: string;
  url: string;
  source: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: Date;
};

export function NewsCard({ item }: { item: NewsCardData }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition hover:border-white/20"
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="max-h-64 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 font-medium text-amber-300">
            📰 {item.source}
          </span>
          <span className="text-neutral-600">{timeAgo(item.publishedAt)}</span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-neutral-100">
          {item.title}
        </h3>
        {item.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{item.summary}</p>
        )}
        <div className="mt-3 text-sm text-amber-300/80">Read on {item.source} ↗</div>
      </div>
    </a>
  );
}
