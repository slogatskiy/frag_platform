import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

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

console.log(`Goto ${URL} (headless=${HEADLESS}, stealth)…`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });

// Ждём, пока уйдёт челлендж (до ~20с)
let title = await page.title();
for (let i = 0; i < 10 && /just a moment|attention/i.test(title); i++) {
  await page.waitForTimeout(2000);
  title = await page.title();
}
await page.waitForTimeout(1500);

const html = await page.content();
const blocked = /just a moment|attention required|cf-challenge/i.test(html);
console.log(`title="${title}"  finalUrl=${page.url()}  blocked=${blocked}  htmlLen=${html.length}`);

const og = await page
  .locator('meta[property="og:image"]')
  .getAttribute("content")
  .catch(() => null);
console.log("og:image =", og);

// price snippets
const priceTexts = await page
  .locator("text=/\\$\\s?\\d|€\\s?\\d|\\d+[.,]\\d{2}\\s?(€|\\$)/")
  .allInnerTexts()
  .catch(() => []);
console.log("price-like snippets:", [...new Set(priceTexts)].slice(0, 15));

await browser.close();
