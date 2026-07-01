import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Небольшой стартовый сид популярных ароматов.
// Позже заменим/дополним скрейпером крупной БД.
const DATA = [
  { brand: "Dior", country: "France", name: "Sauvage", year: 2015, conc: "EDT", top: ["Bergamot", "Pepper"], heart: ["Lavender", "Patchouli"], base: ["Ambroxan", "Cedar"] },
  { brand: "Creed", country: "France", name: "Aventus", year: 2010, conc: "EDP", top: ["Pineapple", "Bergamot", "Blackcurrant"], heart: ["Birch", "Patchouli", "Rose"], base: ["Musk", "Oakmoss", "Vanilla"] },
  { brand: "Maison Francis Kurkdjian", country: "France", name: "Baccarat Rouge 540", year: 2015, conc: "EDP", top: ["Saffron", "Jasmine"], heart: ["Amberwood", "Ambergris"], base: ["Cedar", "Fir resin"] },
  { brand: "Chanel", country: "France", name: "Bleu de Chanel", year: 2010, conc: "EDP", top: ["Grapefruit", "Lemon", "Mint"], heart: ["Ginger", "Nutmeg", "Jasmine"], base: ["Incense", "Cedar", "Sandalwood"] },
  { brand: "Yves Saint Laurent", country: "France", name: "Y EDP", year: 2018, conc: "EDP", top: ["Apple", "Ginger", "Bergamot"], heart: ["Sage", "Geranium"], base: ["Amberwood", "Cedar", "Vetiver"] },
  { brand: "Tom Ford", country: "USA", name: "Tobacco Vanille", year: 2007, conc: "EDP", top: ["Tobacco", "Spices"], heart: ["Vanilla", "Cocoa", "Tobacco blossom"], base: ["Dried fruits", "Woody notes"] },
  { brand: "Parfums de Marly", country: "France", name: "Layton", year: 2016, conc: "EDP", top: ["Apple", "Bergamot", "Lavender"], heart: ["Geranium", "Jasmine", "Violet"], base: ["Vanilla", "Sandalwood", "Patchouli"] },
  { brand: "Dior", country: "France", name: "Homme Intense", year: 2011, conc: "EDP", top: ["Lavender"], heart: ["Iris", "Ambrette", "Patchouli"], base: ["Vetiver", "Cedar"] },
  { brand: "Giorgio Armani", country: "Italy", name: "Acqua di Gio Profumo", year: 2015, conc: "PARFUM", top: ["Bergamot", "Marine notes"], heart: ["Geranium", "Sage", "Rosemary"], base: ["Patchouli", "Incense"] },
  { brand: "Jean Paul Gaultier", country: "France", name: "Le Male", year: 1995, conc: "EDT", top: ["Mint", "Lavender", "Bergamot"], heart: ["Cinnamon", "Cumin", "Orange blossom"], base: ["Vanilla", "Sandalwood", "Amber"] },
  { brand: "Versace", country: "Italy", name: "Eros", year: 2012, conc: "EDT", top: ["Mint", "Green apple", "Lemon"], heart: ["Tonka bean", "Amber", "Geranium"], base: ["Vanilla", "Cedar", "Oakmoss"] },
  { brand: "Xerjoff", country: "Italy", name: "Naxos", year: 2015, conc: "EDP", top: ["Bergamot", "Lavender", "Lemon"], heart: ["Honey", "Tobacco", "Cinnamon"], base: ["Vanilla", "Tonka bean"] },
];

async function main() {
  for (const f of DATA) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(f.brand) },
      update: {},
      create: { name: f.brand, slug: slugify(f.brand), country: f.country },
    });

    const slug = slugify(`${f.brand} ${f.name}`);
    const fields = {
      notesTop: f.top,
      notesHeart: f.heart,
      notesBase: f.base,
    };
    await prisma.fragrance.upsert({
      where: { slug },
      update: fields,
      create: {
        name: f.name,
        slug,
        brandId: brand.id,
        releaseYear: f.year,
        concentration: f.conc,
        notesTop: f.top,
        notesHeart: f.heart,
        notesBase: f.base,
      },
    });
  }
  const count = await prisma.fragrance.count();
  console.log(`✅ Сид готов. Ароматов в каталоге: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
