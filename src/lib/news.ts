import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";

// Живые RSS-ленты парфюм-блогов (проверены: отдают 200 + <item>).
const SOURCES = [
  { name: "Now Smell This", url: "https://nstperfume.com/feed/" },
  { name: "Bois de Jasmin", url: "https://boisdejasmin.com/feed/" },
  { name: "ÇaFleureBon", url: "https://www.cafleurebon.com/feed/" },
  { name: "Kafkaesque", url: "https://kafkaesqueblog.com/feed/" },
  { name: "The Perfume Society", url: "https://perfumesociety.org/feed/" },
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const parser = new XMLParser({ ignoreAttributes: true, textNodeName: "_text" });

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Мусорные картинки, которые нельзя ставить обложкой: аватары/гравотары,
// эмодзи, трекинг-пиксели, иконки плагинов/шаринга, svg, feedburner.
const BAD_IMAGE =
  /(gravatar|avatar|\/emoji\/|s\.w\.org|feedburner|feedburner|\/plugins\/|sharedaddy|twemoji|1x1|spacer|pixel|blank\.gif|doubleclick|stat\?|\.svg(\?|$)|badge|button)/i;

// Апгрейд до полного размера: срезаем WP-суффикс -150x150 и resize-параметры.
const upsizeImage = (u: string): string =>
  u
    .replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp|gif))/i, "$1")
    .replace(/([?&])(?:w|h|resize|fit|crop|quality|strip)=[^&]*/gi, "$1")
    .replace(/[?&]+$/, "");

// Берём ПЕРВУЮ пригодную картинку (не мусор), апскейлим.
const pickImage = (html: string): string | null => {
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const m of matches) {
    const raw = m[1];
    if (!raw || raw.startsWith("data:")) continue;
    if (BAD_IMAGE.test(raw)) continue;
    return upsizeImage(raw);
  }
  return null;
};

const asText = (v: unknown): string =>
  v == null ? "" : typeof v === "object" && "_text" in (v as object) ? String((v as { _text: unknown })._text ?? "") : String(v);

type RssItem = {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  description?: unknown;
  "content:encoded"?: unknown;
};

async function fetchSource(source: { name: string; url: string }) {
  const res = await fetch(source.url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const doc = parser.parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  const out = [];
  for (const it of items) {
    const title = stripHtml(asText(it.title));
    const url = asText(it.link).trim();
    const pub = asText(it.pubDate);
    if (!title || !url) continue;
    const publishedAt = pub ? new Date(pub) : new Date();
    if (isNaN(publishedAt.getTime())) continue;
    const contentHtml = asText(it["content:encoded"]) || asText(it.description);
    const summary = stripHtml(asText(it.description)).slice(0, 260);
    const imageUrl = pickImage(contentHtml);
    out.push({ title, url, source: source.name, summary, imageUrl, publishedAt });
  }
  return out;
}

// Тянет все ленты, апсертит по url. Возвращает число новых.
export async function ingestNews(): Promise<{ added: number; total: number }> {
  let added = 0;
  let total = 0;
  for (const source of SOURCES) {
    let items: Awaited<ReturnType<typeof fetchSource>> = [];
    try {
      items = await fetchSource(source);
    } catch {
      continue;
    }
    for (const it of items) {
      total++;
      try {
        const r = await prisma.newsItem.upsert({
          where: { url: it.url },
          // обновляем картинку/саммари (логика извлечения улучшилась) —
          // заголовок/дату/источник не трогаем.
          update: { imageUrl: it.imageUrl, summary: it.summary },
          create: it,
        });
        // upsert не говорит, создал ли; считаем «новыми» по свежести создания
        if (Date.now() - r.createdAt.getTime() < 5000) added++;
      } catch {
        /* skip bad item */
      }
    }
  }
  return { added, total };
}

export async function getRecentNews(take = 30) {
  return prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take,
  });
}
