/* eslint-disable @next/next/no-img-element */

// Миниатюра флакона: реальное фото, если есть, иначе аккуратный плейсхолдер.
export function BottleThumb({
  imageUrl,
  brand,
  className = "",
}: {
  imageUrl?: string | null;
  brand: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
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
      <span className="font-display text-lg font-semibold text-neutral-400">
        {initial}
      </span>
    </div>
  );
}
