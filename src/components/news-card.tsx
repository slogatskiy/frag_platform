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

// Детерминированный «настроенческий» градиент по источнику — для фолбэка и акцента.
const SOURCE_TINT: Record<string, string> = {
  "Now Smell This": "from-amber-500/25 to-rose-500/10",
  "Bois de Jasmin": "from-emerald-500/25 to-teal-500/10",
  "ÇaFleureBon": "from-fuchsia-500/25 to-violet-500/10",
};
function tint(source: string) {
  return SOURCE_TINT[source] ?? "from-amber-500/20 to-fuchsia-500/10";
}

// «featured» — крупная первая карточка (для верха ленты новостей).
export function NewsCard({
  item,
  featured = false,
}: {
  item: NewsCardData;
  featured?: boolean;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/25 hover:bg-white/[0.04]"
    >
      <div className="relative">
        {item.imageUrl ? (
          <div
            className={`relative w-full overflow-hidden ${
              featured ? "aspect-[16/9]" : "aspect-[2/1]"
            }`}
          >
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            {/* градиент снизу — чтобы даже мыльные RSS-превью выглядели как обложка */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
          </div>
        ) : (
          // Нет фото — рисуем аккуратную «обложку» из градиента источника.
          <div
            className={`relative w-full bg-gradient-to-br ${tint(item.source)} ${
              featured ? "aspect-[16/9]" : "aspect-[2/1]"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-5xl font-semibold text-white/25">
                {item.source.charAt(0)}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
          </div>
        )}

        {/* Источник — бейдж поверх картинки */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-neutral-950/70 px-3 py-1 text-xs font-medium text-amber-200 backdrop-blur-md ring-1 ring-white/10">
            {item.source}
          </span>
        </div>
      </div>

      <div className={featured ? "p-6" : "p-5"}>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{timeAgo(item.publishedAt)}</span>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-600">Article</span>
        </div>
        <h3
          className={`mt-2 font-display font-semibold leading-snug text-neutral-50 transition group-hover:text-white ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {item.title}
        </h3>
        {item.summary && (
          <p
            className={`mt-2 text-sm leading-relaxed text-neutral-400 ${
              featured ? "line-clamp-3" : "line-clamp-2"
            }`}
          >
            {item.summary}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-300/80 transition group-hover:gap-2 group-hover:text-amber-200">
          Read on {item.source}
          <span aria-hidden>↗</span>
        </div>
      </div>
    </a>
  );
}
