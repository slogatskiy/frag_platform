import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Годы из аргументов, напр: node prisma/scrape-new.mjs 2024 2025 2026
const YEARS = process.argv.slice(2).map(Number).filter((y) => y >= 1900 && y <= 2100);
if (!YEARS.length) {
  console.error("Usage: node prisma/scrape-new.mjs <year...>");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
const decode = (s) =>
  s
    .replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

// Карточка: <a href="...Perfumes/..."><img src="...perfumes/..._1200.jpg?..." alt="Name by Brand">
const CARD = /href="(https:\/\/www\.parfumo\.com\/Perfumes\/[^"]+)"><img src="(https:\/\/media\.parfumo\.com\/perfumes\/[^"?]+)[^"]*" alt="([^"]+)"/g;

async function fetchPage(year, page) {
  const url = `https://www.parfumo.com/Release_Years/${year}?current_page=${page}&v=grid&o=n_asc&g_f=1&g_m=1&g_u=1&y_0=${year}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(25000) });
  if (res.status === 403 || res.status === 429) return { blocked: true };
  if (!res.ok) return { cards: [] };
  const html = await res.text();
  if (html.includes("Just a moment")) return { blocked: true };
  const cards = [];
  let m;
  while ((m = CARD.exec(html))) {
    const [, purl, img, altRaw] = m;
    const alt = decode(altRaw);
    const idx = alt.lastIndexOf(" by ");
    if (idx < 1) continue;
    const name = alt.slice(0, idx).trim();
    const brand = alt.slice(idx + 4).trim();
    if (!name || !brand) continue;
    cards.push({ name, brand, img, purl });
  }
  return { cards };
}

const collected = new Map(); // slug -> {name, brand, img, year}
for (const year of YEARS) {
  let page = 1, prevFirst = null, blocked = 0;
  while (page <= 400) {
    const { cards, blocked: b } = await fetchPage(year, page);
    if (b) {
      blocked += 1;
      if (blocked >= 5) { console.log(`⛔ ${year}: блок, стоп`); break; }
      await sleep(3000);
      continue;
    }
    blocked = 0;
    if (!cards.length) break;
    if (cards[0].purl === prevFirst) break; // зациклились на последней странице
    prevFirst = cards[0].purl;
    for (const c of cards) {
      const slug = slugify(`${c.brand} ${c.name}`);
      if (slug && !collected.has(slug)) collected.set(slug, { ...c, year });
    }
    if (page % 10 === 0) console.log(`  ${year} page ${page}: собрано ${collected.size}`);
    page += 1;
    await sleep(800);
  }
  console.log(`✅ ${year}: всего собрано (накоплено) ${collected.size}`);
}

const all = [...collected.values()];
console.log(`Всего уникальных новинок: ${all.length}`);

// Бренды
const brandNames = [...new Set(all.map((x) => x.brand))];
for (let i = 0; i < brandNames.length; i += 500) {
  await prisma.brand.createMany({
    data: brandNames.slice(i, i + 500).map((name) => ({ name, slug: slugify(name) })),
    skipDuplicates: true,
  });
}
const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
const brandId = new Map(brands.map((b) => [b.name, b.id]));

// Ароматы (с фото!) — пропускаем существующие по slug
const data = [];
for (const x of all) {
  const bId = brandId.get(x.brand);
  if (!bId) continue;
  data.push({
    name: x.name,
    slug: slugify(`${x.brand} ${x.name}`),
    brandId: bId,
    releaseYear: x.year,
    imageUrl: x.img,
    notesTop: [], notesHeart: [], notesBase: [],
  });
}
let inserted = 0;
for (let i = 0; i < data.length; i += 500) {
  const res = await prisma.fragrance.createMany({ data: data.slice(i, i + 500), skipDuplicates: true });
  inserted += res.count;
}
console.log(`✅ Новинок добавлено (новых): ${inserted}. Всего в каталоге: ${await prisma.fragrance.count()}`);
await prisma.$disconnect();
