import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CSV_PATH = process.argv[2];
const LIMIT = parseInt(process.argv[3] ?? "250", 10);
const CONCURRENCY = 6;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const na = (v) => (v == null || v === "NA" || v === "" ? null : v);
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

// slug -> parfumo URL (тот же детерминированный слаг, что при импорте)
console.log("Reading CSV for URL map…");
const rows = parse(readFileSync(CSV_PATH), {
  columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true,
});
const baseCount = new Map();
const meta = []; // {slug, url, rating}
for (const r of rows) {
  const name = na(r.Name), brand = na(r.Brand), url = na(r.URL);
  if (!name || !brand) continue;
  const base = slugify(`${brand} ${name}`);
  if (!base) continue;
  const n = (baseCount.get(base) ?? 0) + 1;
  baseCount.set(base, n);
  const slug = n === 1 ? base : `${base}-${n}`;
  if (url) meta.push({ slug, url, rating: parseFloat(na(r.Rating_Count)) || 0 });
}
// приоритет — самые популярные (по числу оценок)
meta.sort((a, b) => b.rating - a.rating);
console.log(`URLs mapped: ${meta.length}`);

// Слаги ароматов без фото (одним запросом)
const missing = new Map(
  (
    await prisma.fragrance.findMany({
      where: { imageUrl: null },
      select: { id: true, slug: true },
    })
  ).map((f) => [f.slug, f.id])
);

const work = [];
for (const m of meta) {
  const id = missing.get(m.slug);
  if (id) work.push({ id, slug: m.slug, url: m.url });
  if (work.length >= LIMIT) break;
}
const urlBySlug = new Map(work.map((w) => [w.slug, w.url]));
console.log(`Fetching images for ${work.length} fragrances (most popular first)…`);

async function fetchImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  return m ? m[1] : null;
}

let ok = 0, fail = 0, done = 0;
async function worker(items) {
  for (const t of items) {
    try {
      const img = await fetchImage(urlBySlug.get(t.slug));
      if (img) {
        await prisma.fragrance.update({ where: { id: t.id }, data: { imageUrl: img } });
        ok += 1;
      } else fail += 1;
    } catch {
      fail += 1;
    }
    done += 1;
    if (done % 25 === 0) console.log(`  …${done}/${work.length} (ok:${ok} fail:${fail})`);
  }
}

// делим работу на CONCURRENCY воркеров
const buckets = Array.from({ length: CONCURRENCY }, () => []);
work.forEach((t, i) => buckets[i % CONCURRENCY].push(t));
await Promise.all(buckets.map(worker));

console.log(`✅ Done. Images set: ${ok}, failed: ${fail}`);
await prisma.$disconnect();
