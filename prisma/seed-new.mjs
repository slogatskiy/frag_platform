// Кураторский сид заметных РЕАЛЬНЫХ релизов 2023–2025 (проверенные данные).
// Без фото (Parfumo анти-бот) и с оценочной ценой (priceEstimated=true).
// Безопасно: upsert по slug — существующие не дублируются.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
const brandSlug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// [brand, name, year, concentration, priceUsd, volume, top[], heart[], base[]]
const DATA = [
  ["Parfums de Marly", "Haltane", 2023, "EDP", 355, 125,
    ["Apple", "Cardamom", "Bergamot"], ["Cedar", "Geranium"], ["Tonka Bean", "Vanilla", "Amber", "Patchouli"]],
  ["Parfums de Marly", "Oajan", 2023, "EDP", 355, 125,
    ["Saffron", "Bergamot"], ["Rose", "Olibanum"], ["Oud", "Leather", "Amber", "Musk"]],
  ["Maison Francis Kurkdjian", "724", 2023, "EDP", 240, 70,
    ["Aldehydes", "Bergamot", "Jasmine"], ["Jasmine", "Sweet Pea"], ["Musk", "Moss", "Sandalwood"]],
  ["Kilian", "Sunkissed Goddess", 2024, "EDP", 260, 50,
    ["Coconut", "Bergamot"], ["Tiare", "Ylang-Ylang", "Orange Blossom"], ["Vanilla", "Sandalwood", "Musk"]],
  ["Chanel", "Comete", 2024, "EDP", 300, 75,
    ["Almond Blossom"], ["Heliotrope", "Iris"], ["White Musk", "Vanilla"]],
  ["Louis Vuitton", "Imagination", 2023, "EDP", 290, 100,
    ["Bergamot", "Ginger", "Neroli"], ["Black Tea"], ["Ambroxan", "Guaiac Wood"]],
  ["Prada", "Paradoxe Intense", 2023, "EDP", 135, 90,
    ["Neroli", "Bergamot"], ["Orange Blossom", "Jasmine"], ["Amber", "Musk", "Vanilla"]],
  ["Yves Saint Laurent", "MYSLF", 2023, "EDP", 130, 100,
    ["Bergamot"], ["Orange Blossom", "Ambrette"], ["Patchouli", "Woods", "Musk"]],
  ["Jean Paul Gaultier", "Le Male Elixir", 2023, "PARFUM", 110, 125,
    ["Lavender", "Mint"], ["Honey", "Cinnamon"], ["Tonka Bean", "Vanilla", "Benzoin"]],
  ["Lattafa", "Khamrah Qahwa", 2024, "EDP", 35, 100,
    ["Coffee", "Cinnamon", "Nutmeg"], ["Dates", "Praline", "Tuberose"], ["Vanilla", "Tonka Bean", "Amber"]],
  ["Creed", "Queen of Silk", 2023, "EDP", 465, 75,
    ["Pear", "Raspberry", "Bergamot"], ["Rose", "Peony", "Jasmine"], ["Patchouli", "Musk", "Sandalwood"]],
  ["Marc-Antoine Barrois", "Encelade", 2023, "EDP", 265, 100,
    ["Nutmeg", "Cinnamon", "Bergamot"], ["Metallic Notes", "Iris"], ["Leather", "Amber", "Musk", "Vetiver"]],
];

const CONC = { PARFUM: "PARFUM", EDP: "EDP", EDT: "EDT" };

let created = 0, skipped = 0;
for (const [brand, name, year, conc, price, vol, top, heart, base] of DATA) {
  const bslug = brandSlug(brand);
  const b = await prisma.brand.upsert({
    where: { slug: bslug },
    update: {},
    create: { name: brand, slug: bslug },
  });

  const slug = slugify(`${brand} ${name}`);
  const exists = await prisma.fragrance.findUnique({ where: { slug } });
  if (exists) { skipped++; continue; }

  await prisma.fragrance.create({
    data: {
      name, slug, brandId: b.id, releaseYear: year,
      concentration: CONC[conc] ?? "OTHER",
      retailPrice: price, retailVolume: vol, priceEstimated: true,
      notesTop: top, notesHeart: heart, notesBase: base,
    },
  });
  created++;
  console.log(`+ ${brand} — ${name} (${year})`);
}

console.log(`\nDone. Created ${created}, skipped (already existed) ${skipped}.`);
await prisma.$disconnect();
