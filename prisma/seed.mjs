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
  { brand: "Dior", country: "France", name: "Sauvage", year: 2015, conc: "EDT", top: ["Бергамот", "Перец"], heart: ["Лаванда", "Пачули"], base: ["Амброксан", "Кедр"] },
  { brand: "Creed", country: "France", name: "Aventus", year: 2010, conc: "EDP", top: ["Ананас", "Бергамот", "Чёрная смородина"], heart: ["Берёза", "Пачули", "Роза"], base: ["Мускус", "Дубовый мох", "Ваниль"] },
  { brand: "Maison Francis Kurkdjian", country: "France", name: "Baccarat Rouge 540", year: 2015, conc: "EDP", top: ["Шафран", "Жасмин"], heart: ["Амбра", "Дерево"], base: ["Кедр", "Амбра"] },
  { brand: "Chanel", country: "France", name: "Bleu de Chanel", year: 2010, conc: "EDP", top: ["Грейпфрут", "Лимон", "Мята"], heart: ["Имбирь", "Мускатный орех", "Жасмин"], base: ["Ладан", "Кедр", "Сандал"] },
  { brand: "Yves Saint Laurent", country: "France", name: "Y EDP", year: 2018, conc: "EDP", top: ["Яблоко", "Имбирь", "Бергамот"], heart: ["Шалфей", "Герань"], base: ["Амбра", "Кедр", "Ветивер"] },
  { brand: "Tom Ford", country: "USA", name: "Tobacco Vanille", year: 2007, conc: "EDP", top: ["Табак", "Пряности"], heart: ["Ваниль", "Какао", "Табачный цвет"], base: ["Сухофрукты", "Древесина"] },
  { brand: "Parfums de Marly", country: "France", name: "Layton", year: 2016, conc: "EDP", top: ["Яблоко", "Бергамот", "Лаванда"], heart: ["Герань", "Жасмин", "Фиалка"], base: ["Ваниль", "Сандал", "Пачули"] },
  { brand: "Dior", country: "France", name: "Homme Intense", year: 2011, conc: "EDP", top: ["Лаванда"], heart: ["Ирис", "Амбра", "Пачули"], base: ["Ветивер", "Кедр"] },
  { brand: "Giorgio Armani", country: "Italy", name: "Acqua di Gio Profumo", year: 2015, conc: "PARFUM", top: ["Бергамот", "Морская нота"], heart: ["Герань", "Шалфей", "Розмарин"], base: ["Пачули", "Ладан"] },
  { brand: "Jean Paul Gaultier", country: "France", name: "Le Male", year: 1995, conc: "EDT", top: ["Мята", "Лаванда", "Бергамот"], heart: ["Корица", "Тмин", "Апельсиновый цвет"], base: ["Ваниль", "Сандал", "Амбра"] },
  { brand: "Versace", country: "Italy", name: "Eros", year: 2012, conc: "EDT", top: ["Мята", "Зелёное яблоко", "Лимон"], heart: ["Тонка", "Амбра", "Герань"], base: ["Ваниль", "Кедр", "Дубовый мох"] },
  { brand: "Xerjoff", country: "Italy", name: "Naxos", year: 2015, conc: "EDP", top: ["Бергамот", "Лаванда", "Лимон"], heart: ["Мёд", "Табак", "Корица"], base: ["Ваниль", "Тонка"] },
];

async function main() {
  for (const f of DATA) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(f.brand) },
      update: {},
      create: { name: f.brand, slug: slugify(f.brand), country: f.country },
    });

    const slug = slugify(`${f.brand} ${f.name}`);
    await prisma.fragrance.upsert({
      where: { slug },
      update: {},
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
