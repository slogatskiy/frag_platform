"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

// Фото аромата с on-demand дозагрузкой: если фото нет — тихо тянет его
// с источника через /api/photo при первом показе карточки.
export function FragranceImage({
  fragranceId,
  imageUrl,
  brand,
  className = "",
}: {
  fragranceId: string;
  imageUrl: string | null;
  brand: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(imageUrl);

  useEffect(() => {
    if (url) return;
    let cancelled = false;
    fetch("/api/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.ok && d.url) setUrl(d.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fragranceId, url]);

  if (url) {
    return (
      <img
        src={url}
        alt={brand}
        className={`rounded-lg border border-white/10 object-cover ${className}`}
      />
    );
  }

  const initial = brand.trim().charAt(0).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] ${className}`}
    >
      <span className="font-display text-lg font-semibold text-neutral-400">{initial}</span>
    </div>
  );
}
