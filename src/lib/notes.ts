// Популярные ноты (реальный топ из базы) — для селектора в Discover.
export const POPULAR_NOTES = [
  "Musk", "Bergamot", "Sandalwood", "Jasmine", "Amber", "Vanilla",
  "Patchouli", "Rose", "Vetiver", "Mandarin orange", "Lemon", "Cedarwood",
  "Tonka bean", "Lavender", "Orange blossom", "Iris", "Ylang-ylang",
  "Cardamom", "Violet", "Grapefruit", "Pink pepper", "Oakmoss", "Geranium",
  "Frankincense", "Leather", "Blackcurrant", "Peach", "Oud", "Cinnamon",
  "Neroli", "Nutmeg", "Saffron", "Ginger", "Tuberose", "Raspberry", "Peony",
];

// Разбор ноты из query-параметра (?notes=Vanilla,Oud)
export function parseNotes(param?: string): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

// Собрать query-строку с переключённой нотой (добавить/убрать).
export function toggleNoteHref(base: string, current: string[], note: string): string {
  const set = new Set(current);
  if (set.has(note)) set.delete(note);
  else set.add(note);
  const notes = [...set];
  return notes.length ? `${base}?notes=${encodeURIComponent(notes.join(","))}` : base;
}
