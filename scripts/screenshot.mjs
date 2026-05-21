/**
 * Usage: node scripts/screenshot.mjs [url] [output]
 * Default: http://localhost:3005 → screenshot.png
 *
 * Take a screenshot of the running dev server for UI verification.
 * Run `npx playwright install chromium` once if browsers aren't installed.
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3005";
const out = process.argv[3] ?? "temp/screenshot.png";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Dismiss welcome tour if present
const skipAll = page.getByText("Skip All");
if (await skipAll.isVisible()) {
  await skipAll.click();
  await page.waitForTimeout(400);
}

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(`saved → ${out}`);
