import { chromium } from "playwright";

const URL = process.argv[2] ?? "https://www.parfumo.com/Perfumes/Dior/Sauvage";
const HEADLESS = process.argv[3] !== "headed";

const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
  locale: "en-US",
});
const page = await ctx.newPage();

console.log(`Goto ${URL} (headless=${HEADLESS})…`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });

// Дать Cloudflare-челленджу шанс отработать
await page.waitForTimeout(6000);

const title = await page.title();
const url = page.url();
const blocked = /just a moment|attention required|cf-challenge/i.test(
  await page.content()
);
console.log(`title="${title}"  finalUrl=${url}  blocked=${blocked}`);

// og:image
const og = await page
  .locator('meta[property="og:image"]')
  .getAttribute("content")
  .catch(() => null);
console.log("og:image =", og);

// Ищем цену: любой текст с $ или € рядом с "from"/price-виджетом
const priceTexts = await page
  .locator("text=/\\$\\s?\\d|€\\s?\\d|\\d+\\s?(€|\\$)/")
  .allInnerTexts()
  .catch(() => []);
console.log("price-like snippets:", priceTexts.slice(0, 12));

// Дамп кусок html для анализа структуры цены
const bodyLen = (await page.content()).length;
console.log("html length:", bodyLen);

await browser.close();
