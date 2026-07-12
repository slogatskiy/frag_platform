// On-demand извлечение фото флакона со страницы-источника (Parfumo).
// Та же логика, что в prisma/scrape-images.mjs: точный href-match + og:image,
// с валидацией имени файла — чужое/дженерик не примет.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const STOP = new Set([
  "the", "de", "du", "la", "le", "of", "for", "and", "eau",
  "parfum", "edp", "edt", "extrait",
]);
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ");

function imageMatchesName(imageUrl: string, name: string): boolean {
  const file = norm(decodeURIComponent(imageUrl.split("/").pop()!.split("?")[0]));
  const toks = norm(name).split(" ").filter((t) => t.length >= 4 && !STOP.has(t));
  const check = toks.length ? toks : norm(name).split(" ").filter(Boolean);
  return check.some((t) => file.includes(t));
}

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Возвращает валидный URL фото или null (блок/нет фото/не прошло валидацию).
export async function fetchFragranceImage(
  sourceUrl: string,
  name: string
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(sourceUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  if (html.includes("Just a moment") || html.includes("cf-challenge")) return null;

  // 1) точное совпадение по пути ссылки (финальный URL после редиректа)
  try {
    const path = decodeURIComponent(new URL(res.url).pathname);
    const hrefRe = new RegExp(escRe(path) + '"[^>]*>\\s*<img[^>]+src="([^"?]+)', "i");
    const hm = html.match(hrefRe);
    if (hm && imageMatchesName(hm[1], name)) return hm[1];
  } catch {
    /* ignore */
  }

  // 2) фолбэк: og:image (только если проходит валидацию)
  const om = html.match(/<meta\s+property="og:image"\s+content="([^"?]+)/i);
  if (om && imageMatchesName(om[1], name)) return om[1];

  return null;
}
