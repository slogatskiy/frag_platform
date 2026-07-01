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
  { brand: "Dior", country: "France", name: "Sauvage", year: 2015, conc: "EDT", price: 115, vol: 100, top: ["Bergamot", "Pepper"], heart: ["Lavender", "Patchouli"], base: ["Ambroxan", "Cedar"] },
  { brand: "Creed", country: "France", name: "Aventus", year: 2010, conc: "EDP", price: 445, vol: 100, top: ["Pineapple", "Bergamot", "Blackcurrant"], heart: ["Birch", "Patchouli", "Rose"], base: ["Musk", "Oakmoss", "Vanilla"] },
  { brand: "Maison Francis Kurkdjian", country: "France", name: "Baccarat Rouge 540", year: 2015, conc: "EDP", price: 325, vol: 70, top: ["Saffron", "Jasmine"], heart: ["Amberwood", "Ambergris"], base: ["Cedar", "Fir resin"] },
  { brand: "Chanel", country: "France", name: "Bleu de Chanel", year: 2010, conc: "EDP", price: 135, vol: 100, top: ["Grapefruit", "Lemon", "Mint"], heart: ["Ginger", "Nutmeg", "Jasmine"], base: ["Incense", "Cedar", "Sandalwood"] },
  { brand: "Yves Saint Laurent", country: "France", name: "Y EDP", year: 2018, conc: "EDP", price: 120, vol: 100, top: ["Apple", "Ginger", "Bergamot"], heart: ["Sage", "Geranium"], base: ["Amberwood", "Cedar", "Vetiver"] },
  { brand: "Tom Ford", country: "USA", name: "Tobacco Vanille", year: 2007, conc: "EDP", price: 285, vol: 50, top: ["Tobacco", "Spices"], heart: ["Vanilla", "Cocoa", "Tobacco blossom"], base: ["Dried fruits", "Woody notes"] },
  { brand: "Parfums de Marly", country: "France", name: "Layton", year: 2016, conc: "EDP", price: 355, vol: 125, top: ["Apple", "Bergamot", "Lavender"], heart: ["Geranium", "Jasmine", "Violet"], base: ["Vanilla", "Sandalwood", "Patchouli"] },
  { brand: "Dior", country: "France", name: "Homme Intense", year: 2011, conc: "EDP", price: 125, vol: 100, top: ["Lavender"], heart: ["Iris", "Ambrette", "Patchouli"], base: ["Vetiver", "Cedar"] },
  { brand: "Giorgio Armani", country: "Italy", name: "Acqua di Gio Profumo", year: 2015, conc: "PARFUM", price: 140, vol: 75, top: ["Bergamot", "Marine notes"], heart: ["Geranium", "Sage", "Rosemary"], base: ["Patchouli", "Incense"] },
  { brand: "Jean Paul Gaultier", country: "France", name: "Le Male", year: 1995, conc: "EDT", price: 95, vol: 125, top: ["Mint", "Lavender", "Bergamot"], heart: ["Cinnamon", "Cumin", "Orange blossom"], base: ["Vanilla", "Sandalwood", "Amber"] },
  { brand: "Versace", country: "Italy", name: "Eros", year: 2012, conc: "EDT", price: 90, vol: 100, top: ["Mint", "Green apple", "Lemon"], heart: ["Tonka bean", "Amber", "Geranium"], base: ["Vanilla", "Cedar", "Oakmoss"] },
  { brand: "Xerjoff", country: "Italy", name: "Naxos", year: 2015, conc: "EDP", price: 260, vol: 100, top: ["Bergamot", "Lavender", "Lemon"], heart: ["Honey", "Tobacco", "Cinnamon"], base: ["Vanilla", "Tonka bean"] },

  { brand: "Dior", country: "France", name: "Sauvage Elixir", year: 2021, conc: "EXTRAIT", price: 165, vol: 60, top: ["Cinnamon", "Nutmeg", "Grapefruit"], heart: ["Lavender", "Licorice"], base: ["Amber", "Sandalwood", "Patchouli"] },
  { brand: "Chanel", country: "France", name: "Allure Homme Sport", year: 2004, conc: "EDT", price: 110, vol: 100, top: ["Orange", "Sea notes", "Aldehydes"], heart: ["Pepper", "Cedar", "Neroli"], base: ["Tonka bean", "White musk", "Vetiver"] },
  { brand: "Chanel", country: "France", name: "Coco Mademoiselle", year: 2001, conc: "EDP", price: 135, vol: 100, top: ["Orange", "Bergamot", "Mandarin"], heart: ["Rose", "Jasmine", "Litchi"], base: ["Patchouli", "Vetiver", "Vanilla"] },
  { brand: "Tom Ford", country: "USA", name: "Oud Wood", year: 2007, conc: "EDP", price: 260, vol: 50, top: ["Rosewood", "Cardamom", "Pepper"], heart: ["Oud", "Sandalwood", "Vetiver"], base: ["Tonka bean", "Vanilla", "Amber"] },
  { brand: "Tom Ford", country: "USA", name: "Lost Cherry", year: 2018, conc: "EDP", price: 355, vol: 50, top: ["Black cherry", "Liqueur", "Bitter almond"], heart: ["Turkish rose", "Jasmine"], base: ["Tonka bean", "Vanilla", "Sandalwood"] },
  { brand: "Tom Ford", country: "USA", name: "Tobacco Oud", year: 2013, conc: "EDP", price: 285, vol: 50, top: ["Tobacco", "Cardamom", "Coriander"], heart: ["Oud", "Sandalwood", "Cinnamon"], base: ["Amber", "Vanilla", "Incense"] },
  { brand: "Creed", country: "France", name: "Green Irish Tweed", year: 1985, conc: "EDP", price: 385, vol: 100, top: ["Lemon", "Verbena", "Iris"], heart: ["Violet leaf"], base: ["Sandalwood", "Ambergris"] },
  { brand: "Creed", country: "France", name: "Silver Mountain Water", year: 1995, conc: "EDP", price: 385, vol: 100, top: ["Bergamot", "Mandarin"], heart: ["Green tea", "Blackcurrant"], base: ["Galbanum", "Sandalwood", "Musk"] },
  { brand: "Parfums de Marly", country: "France", name: "Herod", year: 2012, conc: "EDP", price: 355, vol: 125, top: ["Cinnamon", "Pepper", "Osmanthus"], heart: ["Tobacco leaf", "Incense"], base: ["Vanilla", "Vetiver", "Cedar"] },
  { brand: "Parfums de Marly", country: "France", name: "Pegasus", year: 2011, conc: "EDP", price: 340, vol: 125, top: ["Bitter almond", "Bergamot", "Cumin"], heart: ["Heliotrope", "Jasmine", "Vanilla"], base: ["Sandalwood", "Amber", "Musk"] },
  { brand: "Parfums de Marly", country: "France", name: "Delina", year: 2017, conc: "EDP", price: 320, vol: 75, top: ["Litchi", "Rhubarb", "Bergamot"], heart: ["Turkish rose", "Peony", "Lily"], base: ["Vanilla", "Cashmeran", "Musk"] },
  { brand: "Maison Francis Kurkdjian", country: "France", name: "Grand Soir", year: 2016, conc: "EDP", price: 325, vol: 70, top: ["Amber", "Benzoin"], heart: ["Vanilla", "Tonka bean"], base: ["Cistus labdanum", "Cedar"] },
  { brand: "Maison Francis Kurkdjian", country: "France", name: "Oud Satin Mood", year: 2015, conc: "EDP", price: 375, vol: 70, top: ["Violet", "Oud"], heart: ["Rose", "Vanilla"], base: ["Benzoin", "Amber"] },
  { brand: "Yves Saint Laurent", country: "France", name: "La Nuit de L'Homme", year: 2009, conc: "EDT", price: 105, vol: 100, top: ["Cardamom", "Bergamot"], heart: ["Lavender", "Cedar", "Cumin"], base: ["Vetiver", "Tonka bean"] },
  { brand: "Yves Saint Laurent", country: "France", name: "Libre", year: 2019, conc: "EDP", price: 135, vol: 90, top: ["Lavender", "Mandarin", "Blackcurrant"], heart: ["Orange blossom", "Jasmine"], base: ["Vanilla", "Musk", "Cedar"] },
  { brand: "Giorgio Armani", country: "Italy", name: "Acqua di Gio", year: 1996, conc: "EDT", price: 95, vol: 100, top: ["Bergamot", "Neroli", "Green tangerine"], heart: ["Jasmine", "Rosemary", "Persimmon"], base: ["Patchouli", "Cedar", "Musk"] },
  { brand: "Giorgio Armani", country: "Italy", name: "Stronger With You", year: 2017, conc: "EDT", price: 95, vol: 100, top: ["Cardamom", "Pink pepper", "Violet"], heart: ["Sage", "Cinnamon", "Melon"], base: ["Vanilla", "Chestnut", "Amber"] },
  { brand: "Versace", country: "Italy", name: "Dylan Blue", year: 2016, conc: "EDT", price: 90, vol: 100, top: ["Bergamot", "Grapefruit", "Fig leaf"], heart: ["Violet leaf", "Papyrus", "Patchouli"], base: ["Musk", "Tonka bean", "Saffron"] },
  { brand: "Paco Rabanne", country: "Spain", name: "1 Million", year: 2008, conc: "EDT", price: 90, vol: 100, top: ["Grapefruit", "Mint", "Blood mandarin"], heart: ["Rose", "Cinnamon", "Spices"], base: ["Leather", "Amber", "Patchouli"] },
  { brand: "Paco Rabanne", country: "Spain", name: "Invictus", year: 2013, conc: "EDT", price: 88, vol: 100, top: ["Grapefruit", "Marine notes"], heart: ["Bay leaf", "Jasmine"], base: ["Guaiac wood", "Oakmoss", "Amber"] },
  { brand: "Jean Paul Gaultier", country: "France", name: "Ultra Male", year: 2015, conc: "EDT", price: 95, vol: 120, top: ["Blackcurrant", "Pear", "Bergamot"], heart: ["Lavender", "Cinnamon", "Mint"], base: ["Vanilla", "Amber", "Cedar"] },
  { brand: "Montblanc", country: "France", name: "Explorer", year: 2019, conc: "EDP", price: 80, vol: 100, top: ["Bergamot", "Pink pepper", "Clary sage"], heart: ["Vetiver", "Leather", "Patchouli"], base: ["Ambroxan", "Akigalawood", "Cacao"] },
  { brand: "Prada", country: "Italy", name: "L'Homme", year: 2016, conc: "EDT", price: 95, vol: 100, top: ["Neroli", "Black pepper", "Cardamom"], heart: ["Iris", "Geranium", "Amber"], base: ["Patchouli", "Cedar", "Sandalwood"] },
  { brand: "Initio", country: "France", name: "Oud for Greatness", year: 2018, conc: "EDP", price: 320, vol: 90, top: ["Saffron", "Nutmeg", "Lavender"], heart: ["Oud", "Patchouli"], base: ["Musk", "Marine notes"] },
  { brand: "Byredo", country: "Sweden", name: "Gypsy Water", year: 2008, conc: "EDP", price: 200, vol: 100, top: ["Bergamot", "Lemon", "Pepper", "Juniper"], heart: ["Incense", "Pine needles", "Orris"], base: ["Amber", "Sandalwood", "Vanilla"] },
  { brand: "Le Labo", country: "USA", name: "Santal 33", year: 2011, conc: "EDP", price: 220, vol: 50, top: ["Cardamom", "Iris", "Violet"], heart: ["Ambrox", "Sandalwood"], base: ["Leather", "Cedar", "Musk"] },
  { brand: "Amouage", country: "Oman", name: "Interlude Man", year: 2012, conc: "EDP", price: 340, vol: 100, top: ["Bergamot", "Oregano", "Pepper"], heart: ["Amber", "Incense", "Cistus"], base: ["Leather", "Oud", "Musk"] },
  { brand: "Nishane", country: "Turkey", name: "Hacivat", year: 2017, conc: "EXTRAIT", price: 245, vol: 100, top: ["Pineapple", "Grapefruit", "Bergamot"], heart: ["Cedar", "Patchouli", "Jasmine"], base: ["Oakmoss", "Musk", "Amber"] },
  { brand: "Mancera", country: "France", name: "Cedrat Boise", year: 2011, conc: "EDP", price: 130, vol: 120, top: ["Citron", "Bergamot", "Sicilian lemon"], heart: ["Patchouli", "Leather", "Spices"], base: ["Oakmoss", "White musk", "Amber"] },
  { brand: "Lattafa", country: "UAE", name: "Khamrah", year: 2022, conc: "EDP", price: 40, vol: 100, top: ["Cinnamon", "Nutmeg", "Bergamot"], heart: ["Dates", "Praline", "Tuberose"], base: ["Vanilla", "Tonka bean", "Benzoin"] },
  { brand: "Dior", country: "France", name: "Homme 2020", year: 2020, conc: "EDT", price: 105, vol: 100, top: ["Bergamot", "Pink pepper"], heart: ["Cashmere wood", "Iris"], base: ["Haitian vetiver", "White musk"] },
  { brand: "Chanel", country: "France", name: "Bleu de Chanel Parfum", year: 2018, conc: "PARFUM", price: 155, vol: 100, top: ["Grapefruit", "Lavender", "Cardamom"], heart: ["Nutmeg", "Jasmine"], base: ["Sandalwood", "Patchouli", "Tonka bean"] },
  { brand: "Tom Ford", country: "USA", name: "Noir Extreme", year: 2015, conc: "EDP", price: 165, vol: 100, top: ["Cardamom", "Nutmeg", "Saffron"], heart: ["Kulfi", "Orange blossom", "Rose"], base: ["Amber", "Sandalwood", "Vanilla"] },
  { brand: "Bvlgari", country: "Italy", name: "Man in Black", year: 2014, conc: "EDP", price: 100, vol: 100, top: ["Rum", "Spices", "Tobacco"], heart: ["Iris", "Leather", "Tuberose"], base: ["Benzoin", "Guaiac wood", "Amber"] },
  { brand: "Azzaro", country: "France", name: "The Most Wanted", year: 2021, conc: "EDP", price: 100, vol: 100, top: ["Ginger", "Cardamom"], heart: ["Toffee accord", "Amberwood"], base: ["Vetiver", "Woods"] },
  { brand: "Valentino", country: "Italy", name: "Uomo Born in Roma", year: 2019, conc: "EDT", price: 110, vol: 100, top: ["Ginger", "Bergamot", "Violet leaf"], heart: ["Sage", "Iris"], base: ["Vanilla", "Cedarwood", "Leather"] },
  { brand: "Carolina Herrera", country: "Spain", name: "Bad Boy", year: 2019, conc: "EDT", price: 95, vol: 100, top: ["Black pepper", "White pepper", "Bergamot"], heart: ["Cinnamon", "Sage"], base: ["Tonka bean", "Cacao", "Amberwood"] },
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
      retailPrice: f.price,
      retailVolume: f.vol,
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
        ...fields,
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
