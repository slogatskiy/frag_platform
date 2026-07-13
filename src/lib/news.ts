import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";

// Живые RSS-ленты парфюм-блогов (проверены: отдают 200 + <item>).
const SOURCES = [
  { name: "Now Smell This", url: "https://nstperfume.com/feed/" },
  { name: "Bois de Jasmin", url: "https://boisdejasmin.com/feed/" },
  { name: "ÇaFleureBon", url: "https://www.cafleurebon.com/feed/" },
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

const firstImage = (html: string): string | null => {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
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
    const imageUrl = firstImage(contentHtml);
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
          update: {}, // не перезаписываем существующие
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
