import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error("Usage: node prisma/import.mjs <path-to-parfumo.csv>");
  process.exit(1);
}

const na = (v) => (v == null || v === "NA" || v === "" ? null : v);
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);

const CONC = {
  "Eau de Toilette": "EDT",
  "Eau de Parfum": "EDP",
  "Eau de Cologne": "EDC",
  Cologne: "EDC",
  Parfum: "PARFUM",
  Perfume: "PARFUM",
  "Extrait de Parfum": "EXTRAIT",
  Extrait: "EXTRAIT",
};
const conc = (v) => (v && CONC[v] ? CONC[v] : null);

const notes = (v) => {
  const s = na(v);
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 15);
};

console.log("Reading CSV…");
const rows = parse(readFileSync(CSV_PATH), {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});
console.log(`Rows: ${rows.length}`);

// 1) Бренды
const brandNames = new Set();
for (const r of rows) {
  const b = na(r.Brand);
  if (b) brandNames.add(b);
}
console.log(`Unique brands: ${brandNames.size}`);

const brandData = [...brandNames].map((name) => ({ name, slug: slugify(name) }));
// уникальность slug среди брендов
const seenBrandSlug = new Set();
for (const b of brandData) {
  let s = b.slug || "brand";
  while (seenBrandSlug.has(s)) s = `${b.slug}-${Math.floor(seenBrandSlug.size)}`;
  b.slug = s;
  seenBrandSlug.add(s);
}

for (let i = 0; i < brandData.length; i += 1000) {
  await prisma.brand.createMany({
    data: brandData.slice(i, i + 1000),
    skipDuplicates: true,
  });
}
const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
const brandId = new Map(brands.map((b) => [b.name, b.id]));
console.log(`Brands in DB: ${brands.length}`);

// 2) Ароматы — детерминированный дедуп по порядку CSV (идемпотентно при дозаливке)
const baseCount = new Map();

const fragData = [];
for (const r of rows) {
  const name = na(r.Name);
  const brand = na(r.Brand);
  if (!name || !brand) continue;
  const bId = brandId.get(brand);
  if (!bId) continue;

  const base = slugify(`${brand} ${name}`);
  if (!base) continue;
  const n = (baseCount.get(base) ?? 0) + 1;
  baseCount.set(base, n);
  const slug = n === 1 ? base : `${base}-${n}`;

  const yr = na(r.Release_Year);
  const year = yr && /^\d{4}$/.test(yr) ? parseInt(yr, 10) : null;

  fragData.push({
    name,
    slug,
    brandId: bId,
    house: na(r.Perfumers),
    releaseYear: year,
    concentration: conc(na(r.Concentration)),
    notesTop: notes(r.Top_Notes),
    notesHeart: notes(r.Middle_Notes),
    notesBase: notes(r.Base_Notes),
  });
}

console.log(`Fragrances to insert: ${fragData.length}`);
let inserted = 0;
const BATCH = 5000;
for (let i = 0; i < fragData.length; i += BATCH) {
  const chunk = fragData.slice(i, i + BATCH);
  const res = await prisma.fragrance.createMany({
    data: chunk,
    skipDuplicates: true,
  });
  inserted += res.count;
  console.log(`  …${Math.min(i + BATCH, fragData.length)}/${fragData.length} (new: ${inserted})`);
}

const total = await prisma.fragrance.count();
console.log(`✅ Импорт готов. Вставлено новых: ${inserted}. Всего в каталоге: ${total}`);
await prisma.$disconnect();
