"use client";

import { useState } from "react";
import { createPost } from "@/app/actions/posts";

// Форма создания поста об аромате: рейтинг 1–10 (опц.) + текст.
export function PostComposer({
  fragranceId,
  placeholder = "Share your impression — how does it wear, when do you reach for it?",
}: {
  fragranceId: string;
  placeholder?: string;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");

  const canPost = body.trim().length > 0 || rating != null;

  return (
    <form action={createPost} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <input type="hidden" name="fragranceId" value={fragranceId} />
      <input type="hidden" name="rating" value={rating ?? ""} />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs uppercase tracking-wide text-neutral-500">
          Rating
        </span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating((r) => (r === n ? null : n))}
            className={`h-8 w-8 rounded-full text-sm transition ${
              rating != null && n <= rating
                ? "bg-amber-400 font-semibold text-neutral-900"
                : "border border-white/10 text-neutral-400 hover:border-white/30"
            }`}
          >
            {n}
          </button>
        ))}
        {rating != null && (
          <button
            type="button"
            onClick={() => setRating(null)}
            className="ml-1 text-xs text-neutral-500 hover:text-neutral-300"
          >
            clear
          </button>
        )}
      </div>

      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canPost}
          className="rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </form>
  );
}
