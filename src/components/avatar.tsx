/* eslint-disable @next/next/no-img-element */

// Единая аватарка на весь проект. Если есть загруженное фото — показываем его,
// иначе генерим красивый детерминированный градиент из хэндла + инициал.
// Раньше инициалы рисовались по-разному в 4 местах — теперь один источник правды.

// Палитра приятных градиентов (from → to). Выбор детерминирован по строке.
const GRADIENTS = [
  "from-amber-300 to-orange-500",
  "from-rose-300 to-fuchsia-500",
  "from-violet-300 to-indigo-500",
  "from-sky-300 to-blue-500",
  "from-emerald-300 to-teal-500",
  "from-lime-300 to-green-500",
  "from-pink-300 to-rose-500",
  "from-cyan-300 to-sky-500",
  "from-fuchsia-300 to-purple-500",
  "from-yellow-300 to-amber-500",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  name,
  handle,
  avatarUrl,
  size = "md",
  className = "",
}: {
  name?: string | null;
  handle: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dims = SIZES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? handle}
        className={`${dims} shrink-0 rounded-full border border-white/15 object-cover ${className}`}
      />
    );
  }

  const initial = (name || handle).trim().charAt(0).toUpperCase() || "?";
  const gradient = GRADIENTS[hash(handle) % GRADIENTS.length];

  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-display font-semibold text-neutral-950/80 shadow-inner ring-1 ring-white/20 ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
