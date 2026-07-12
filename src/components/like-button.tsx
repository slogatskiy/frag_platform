"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/posts";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  function onClick() {
    // Оптимистично
    setLiked((v) => !v);
    setCount((c) => c + (liked ? -1 : 1));
    startTransition(async () => {
      try {
        await toggleLike(postId);
      } catch {
        // откат при ошибке
        setLiked((v) => !v);
        setCount((c) => c + (liked ? 1 : -1));
      }
    });
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
          : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
      }`}
      aria-pressed={liked}
    >
      <span>{liked ? "♥" : "♡"}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
