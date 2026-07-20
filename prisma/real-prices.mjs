// Реальные ритейл-цены (кураторские) поверх эвристических оценок.
// Философия (как Vivino/LV.com): для известных флагманов берём НАСТОЯЩУЮ MSRP,
// снимаем флаг priceEstimated. Остальным оставляем оценку с честной меткой «est.».
//
// Матчинг устойчив к «грязным» именам в датасете (встроенный бренд/год/концентрация,
// арабица, фланкеры) — нормализуем обе стороны и матчим по базовому имени внутри бренда.
//
// Запуск:  node --env-file=.env prisma/real-prices.mjs           (применить)
//          node --env-file=.env prisma/real-prices.mjs --dry     (только отчёт, без записи)
//
// Расширять просто: добавляй дома/ароматы ниже. brandDefault — для домов с единой ценой.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

// price — USD MSRP, vol — мл к которым относится цена.
// Дома с единой ценой задают `brandDefault: { price, vol }` — применяется ко ВСЕМ
// ароматам бренда, кроме перечисленных в items (те переопределяют).
const DATA = [
  // ─────────── НИША: единая или почти единая цена ───────────
  {
    brand: "Louis Vuitton",
    // Вся линия Les Parfums 100ml = $330 (подтверждено покупкой юзера: Orage, Pacific Chill и т.д.).
    // Переопределяем ТОЛЬКО реально более дорогие, в которых уверен.
    brandDefault: { price: 330, vol: 100 },
    items: [
      { match: "ombre nomade", price: 370 },
      // Les Extraits de Parfum — премиум-линия ~$490
      { match: "symphony", price: 490 }, { match: "rhapsody", price: 490 },
      { match: "dancing blossom", price: 490 }, { match: "myriad", price: 490 },
      { match: "cosmic cloud", price: 490 }, { match: "stellar times", price: 490 },
    ],
  },
  {
    brand: "Creed",
    items: [
      { match: "aventus", price: 445, vol: 100 },
      { match: "aventus for her", price: 445, vol: 75 },
      { match: "absolu aventus", price: 495, vol: 75 },
      { match: "green irish tweed", price: 400, vol: 100 },
      { match: "silver mountain water", price: 400, vol: 100 },
      { match: "viking", price: 385, vol: 100 },
      { match: "viking cologne", price: 385, vol: 100 },
      { match: "royal oud", price: 415, vol: 100 },
      { match: "millesime imperial", price: 400, vol: 100 },
      { match: "himalaya", price: 340, vol: 100 },
      { match: "original vetiver", price: 340, vol: 100 },
      { match: "bois du portugal", price: 340, vol: 100 },
      { match: "original santal", price: 340, vol: 100 },
      { match: "erolfa", price: 340, vol: 100 },
      { match: "royal water", price: 340, vol: 100 },
    ],
  },
  {
    brand: "Maison Francis Kurkdjian",
    items: [
      { match: "baccarat rouge 540", price: 325, vol: 70 },
      { match: "grand soir", price: 265, vol: 70 },
      { match: "oud satin mood", price: 335, vol: 70 },
      { match: "gentle fluidity gold", price: 265, vol: 70 },
      { match: "gentle fluidity silver", price: 265, vol: 70 },
      { match: "aqua universalis", price: 205, vol: 70 },
      { match: "petit matin", price: 240, vol: 70 },
      { match: "amyris homme", price: 240, vol: 70 },
      { match: "oud", price: 290, vol: 70 },
    ],
  },
  {
    brand: "Parfums de Marly",
    // Мужская Royal Essence 125ml ~ $355; женская 75ml ~ $335. Задаём дефолт 125/$355,
    // женские флаконы переопределяем.
    brandDefault: { price: 355, vol: 125 },
    items: [
      { match: "layton", price: 355 }, { match: "herod", price: 355 },
      { match: "pegasus", price: 355 }, { match: "carlisle", price: 355 },
      { match: "percival", price: 340 }, { match: "greenley", price: 340 },
      { match: "haltane", price: 355 }, { match: "kalan", price: 355 },
      { match: "godolphin", price: 355 }, { match: "sedbury", price: 355 },
      { match: "delina", price: 335, vol: 75 }, { match: "delina exclusif", price: 360, vol: 75 },
      { match: "oriana", price: 335, vol: 75 }, { match: "valaya", price: 335, vol: 75 },
      { match: "cassili", price: 335, vol: 75 }, { match: "meliora", price: 335, vol: 75 },
      { match: "athalia", price: 335, vol: 75 },
    ],
  },
  {
    brand: "Tom Ford",
    items: [
      { match: "oud wood", price: 285, vol: 50 },
      { match: "tobacco vanille", price: 285, vol: 50 },
      { match: "tobacco oud", price: 285, vol: 50 },
      { match: "lost cherry", price: 355, vol: 50 },
      { match: "bitter peach", price: 355, vol: 50 },
      { match: "fucking fabulous", price: 355, vol: 50 },
      { match: "tuscan leather", price: 285, vol: 50 },
      { match: "black orchid", price: 150, vol: 50 },
      { match: "ombre leather", price: 200, vol: 100 },
      { match: "ombre leather parfum", price: 215, vol: 100 },
      { match: "noir extreme", price: 185, vol: 100 },
      { match: "neroli portofino", price: 240, vol: 50 },
      { match: "soleil blanc", price: 240, vol: 50 },
      { match: "grey vetiver", price: 150, vol: 100 },
    ],
  },

  // ─────────── ДИЗАЙНЕРЫ ───────────
  {
    brand: "Dior",
    items: [
      { match: "sauvage", price: 125, vol: 100 },
      { match: "sauvage parfum", price: 155, vol: 100 },
      { match: "sauvage elixir", price: 175, vol: 100 },
      { match: "dior homme", price: 120, vol: 100 },
      { match: "dior homme intense", price: 140, vol: 100 },
      { match: "dior homme sport", price: 115, vol: 100 },
      { match: "fahrenheit", price: 115, vol: 100 },
      { match: "homme cologne", price: 95, vol: 125 },
      { match: "j adore", price: 165, vol: 100 },
      { match: "miss dior", price: 155, vol: 100 },
      { match: "hypnotic poison", price: 120, vol: 100 },
      { match: "poison girl", price: 120, vol: 100 },
    ],
  },
  {
    brand: "Chanel",
    items: [
      { match: "bleu de chanel", price: 146, vol: 100 },
      { match: "coco mademoiselle", price: 165, vol: 100 },
      { match: "n 5", price: 175, vol: 100 },
      { match: "chance", price: 165, vol: 100 },
      { match: "allure homme sport", price: 120, vol: 100 },
      { match: "allure homme", price: 120, vol: 100 },
      { match: "egoiste", price: 120, vol: 100 },
      { match: "gabrielle", price: 165, vol: 100 },
    ],
  },
  {
    brand: "Yves Saint Laurent",
    items: [
      { match: "la nuit de l homme", price: 120, vol: 100 },
      { match: "y", price: 130, vol: 100 },
      { match: "y le parfum", price: 145, vol: 100 },
      { match: "libre", price: 150, vol: 90 },
      { match: "black opium", price: 155, vol: 90 },
      { match: "myslf", price: 130, vol: 100 },
      { match: "mon paris", price: 150, vol: 90 },
    ],
  },
  {
    brand: "Paco Rabanne",
    items: [
      { match: "1 million", price: 100, vol: 100 },
      { match: "invictus", price: 99, vol: 100 },
      { match: "phantom", price: 105, vol: 100 },
      { match: "pure xs", price: 100, vol: 100 },
      { match: "fame", price: 110, vol: 80 },
      { match: "lady million", price: 110, vol: 80 },
    ],
  },
  {
    brand: "Versace",
    items: [
      { match: "eros", price: 100, vol: 100 },
      { match: "eros flame", price: 105, vol: 100 },
      { match: "eros parfum", price: 120, vol: 100 },
      { match: "dylan blue", price: 95, vol: 100 },
      { match: "bright crystal", price: 92, vol: 90 },
      { match: "the dreamer", price: 85, vol: 100 },
    ],
  },
  {
    brand: "Giorgio Armani",
    items: [
      { match: "acqua di gio", price: 96, vol: 100 },
      { match: "acqua di gio profumo", price: 128, vol: 125 },
      { match: "acqua di gio profondo", price: 105, vol: 125 },
      { match: "stronger with you", price: 96, vol: 100 },
      { match: "code", price: 95, vol: 75 },
      { match: "my way", price: 132, vol: 90 },
    ],
  },
  {
    brand: "Prada",
    items: [
      { match: "l homme", price: 112, vol: 100 },
      { match: "luna rossa carbon", price: 110, vol: 100 },
      { match: "luna rossa ocean", price: 110, vol: 100 },
      { match: "paradoxe", price: 135, vol: 90 },
    ],
  },
  {
    brand: "Dolce & Gabbana",
    items: [
      { match: "light blue", price: 98, vol: 100 },
      { match: "the one", price: 102, vol: 100 },
      { match: "the one for men", price: 102, vol: 100 },
      { match: "k", price: 100, vol: 100 },
      { match: "the only one", price: 110, vol: 100 },
    ],
  },
  {
    brand: "Jean Paul Gaultier",
    items: [
      { match: "le male", price: 100, vol: 125 },
      { match: "le male elixir", price: 120, vol: 125 },
      { match: "le beau", price: 100, vol: 125 },
      { match: "scandal", price: 105, vol: 80 },
      { match: "ultra male", price: 105, vol: 125 },
    ],
  },
  {
    brand: "Carolina Herrera",
    items: [
      { match: "good girl", price: 132, vol: 80 },
      { match: "bad boy", price: 100, vol: 100 },
    ],
  },
  {
    brand: "Valentino",
    items: [
      { match: "uomo born in roma", price: 120, vol: 100 },
      { match: "donna born in roma", price: 130, vol: 100 },
      { match: "uomo born in roma coral fantasy", price: 120, vol: 100 },
    ],
  },
  {
    brand: "Mugler",
    items: [
      { match: "angel", price: 130, vol: 50 },
      { match: "alien", price: 150, vol: 90 },
      { match: "a men", price: 95, vol: 100 },
    ],
  },
  {
    brand: "Lancôme",
    items: [
      { match: "la vie est belle", price: 165, vol: 100 },
      { match: "idole", price: 130, vol: 75 },
    ],
  },
  {
    brand: "Viktor & Rolf",
    items: [
      { match: "spicebomb", price: 105, vol: 90 },
      { match: "spicebomb extreme", price: 115, vol: 90 },
      { match: "flowerbomb", price: 175, vol: 100 },
    ],
  },

  // ─────────── АРАБСКИЕ / БЮДЖЕТ (популярные) ───────────
  {
    brand: "Lattafa",
    items: [
      { match: "khamrah", price: 32, vol: 100 },
      { match: "khamrah qahwa", price: 35, vol: 100 },
      { match: "asad elixir", price: 35, vol: 100 },
    ],
  },
  {
    brand: "Armaf",
    items: [
      { match: "club de nuit intense man", price: 40, vol: 105 },
      { match: "club de nuit sillage", price: 55, vol: 105 },
      { match: "club de nuit milestone", price: 50, vol: 105 },
      { match: "club de nuit untold", price: 45, vol: 105 },
      { match: "ventana", price: 40, vol: 100 },
    ],
  },
];

// ── Нормализация имени: устойчива к встроенному бренду/году/концентрации/арабице ──
function stripAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function norm(name, brand = "") {
  let s = " " + stripAccents(name).toLowerCase() + " ";
  // концентрация как фраза
  s = s.replace(/\beau de (parfum|toilette|cologne)\b/g, " ");
  s = s.replace(/\b(edp|edt|edc|body spray|esprit de parfum)\b/g, " ");
  s = s.replace(/\b(19|20)\d{2}\b/g, " ");
  // убрать токены бренда
  for (const w of stripAccents(brand).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    s = s.replace(new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), " ");
  }
  // всё нелатинское/пунктуация → пробел (срезает арабицу)
  s = s.replace(/[^a-z0-9]+/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

async function run() {
  let totalMatched = 0;
  let totalUpdated = 0;
  const unmatched = [];

  for (const house of DATA) {
    const brand = await prisma.brand.findFirst({ where: { name: house.brand } });
    if (!brand) {
      console.log(`⚠️  Brand not found: ${house.brand}`);
      continue;
    }
    const frs = await prisma.fragrance.findMany({
      where: { brandId: brand.id },
      select: { id: true, name: true, popularity: true, retailPrice: true, priceEstimated: true },
    });
    // индекс: нормализованное имя → список ароматов (может быть несколько флаконов)
    const index = new Map();
    for (const f of frs) {
      const k = norm(f.name, house.brand);
      if (!index.has(k)) index.set(k, []);
      index.get(k).push(f);
    }

    // применяем явные items
    const explicit = new Set();
    for (const it of house.items ?? []) {
      const key = norm(it.match, house.brand);
      explicit.add(key);
      let cands = index.get(key);
      // Фолбэк: если точного нет — ищем имена, начинающиеся с ключа
      // (только для ключей из ≥2 слов, чтобы не ловить ложные совпадения).
      if ((!cands || cands.length === 0) && key.split(" ").length >= 2) {
        cands = [];
        for (const [k, arr] of index) if (k.startsWith(key + " ")) cands.push(...arr);
      }
      if (!cands || cands.length === 0) {
        unmatched.push(`${house.brand} — ${it.match}`);
        continue;
      }
      // при нескольких флаконах берём самый популярный
      cands.sort((a, b) => b.popularity - a.popularity);
      const target = cands[0];
      totalMatched++;
      const vol = it.vol ?? house.brandDefault?.vol ?? 100;
      if (!DRY) {
        await prisma.fragrance.update({
          where: { id: target.id },
          data: { retailPrice: it.price, retailVolume: vol, priceEstimated: false },
        });
      }
      totalUpdated++;
    }

    // brandDefault: всё остальное в бренде, что ещё оценочное
    if (house.brandDefault) {
      const { price, vol } = house.brandDefault;
      for (const f of frs) {
        const k = norm(f.name, house.brand);
        if (explicit.has(k)) continue; // уже задано явно выше
        // brandDefault авторитетен для этого бренда — перезаписываем и оценку,
        // и ранее ошибочно проставленную «реальную» цену.
        totalMatched++;
        if (!DRY) {
          await prisma.fragrance.update({
            where: { id: f.id },
            data: { retailPrice: price, retailVolume: vol, priceEstimated: false },
          });
        }
        totalUpdated++;
      }
    }
  }

  console.log(`\n${DRY ? "[DRY RUN] " : ""}Matched: ${totalMatched}, updated: ${totalUpdated}`);
  if (unmatched.length) {
    console.log(`\nUnmatched curated items (${unmatched.length}) — проверить имена в датасете:`);
    for (const u of unmatched) console.log("  · " + u);
  }
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
