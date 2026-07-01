import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const CSV_PATH = process.argv[2];
const OUT_PATH = process.argv[3];
if (!CSV_PATH || !OUT_PATH) {
  console.error("Usage: node prisma/gen-copy.mjs <in.csv> <out.csv>");
  process.exit(1);
}

const na = (v) => (v == null || v === "NA" || v === "" ? null : v);
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

const CONC = {
  "Eau de Toilette": "EDT", "Eau de Parfum": "EDP", "Eau de Cologne": "EDC",
  Cologne: "EDC", Parfum: "PARFUM", Perfume: "PARFUM",
  "Extrait de Parfum": "EXTRAIT", Extrait: "EXTRAIT",
};
const conc = (v) => (v && CONC[v] ? CONC[v] : "");

// Массив -> Postgres array literal, напр. {"Musk, Foulness","Bergamot"}
const pgArray = (v) => {
  const s = na(v);
  if (!s) return "{}";
  const els = s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 15);
  if (!els.length) return "{}";
  return "{" + els.map((e) => '"' + e.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
};

// CSV-экранирование поля
const csv = (v) => {
  if (v == null || v === "") return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const rows = parse(readFileSync(CSV_PATH), {
  columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true,
});

const baseCount = new Map();
const out = [];
for (const r of rows) {
  const name = na(r.Name);
  const brand = na(r.Brand);
  if (!name || !brand) continue;
  const base = slugify(`${brand} ${name}`);
  if (!base) continue;
  const n = (baseCount.get(base) ?? 0) + 1;
  baseCount.set(base, n);
  const slug = n === 1 ? base : `${base}-${n}`;

  const yr = na(r.Release_Year);
  const year = yr && /^\d{4}$/.test(yr) ? yr : "";

  out.push([
    csv(slug), csv(brand), csv(name), csv(na(r.Perfumers)), csv(year),
    csv(conc(na(r.Concentration))), csv(pgArray(r.Top_Notes)),
    csv(pgArray(r.Middle_Notes)), csv(pgArray(r.Base_Notes)),
  ].join(","));
}

writeFileSync(OUT_PATH, out.join("\n") + "\n");
console.log(`Wrote ${out.length} rows to ${OUT_PATH}`);
