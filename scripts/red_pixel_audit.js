/**
 * Pixel-level red audit using sharp: screenshot key pages, scan for reddish pixels.
 * A pixel is "red" if R is high while G and B are low (saturated warm red).
 */
const { chromium } = require("playwright");
const sharp = require("sharp");

const RED_TEST = (r, g, b) => r > 120 && g < r * 0.45 && b < r * 0.45;

async function scan(page, url, label) {
  if (url === "about:blank") return; // scroll helper skip
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const buf = await page.screenshot({ type: "png", fullPage: false });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let red = 0;
  const total = info.width * info.height;
  const seen = new Set();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (RED_TEST(r, g, b)) {
      red++;
      seen.add(`${Math.round(r / 40)},${Math.round(g / 40)},${Math.round(b / 40)}`);
    }
  }
  const pct = ((red / total) * 100).toFixed(4);
  console.log(`${label}: ${red}/${total} red-ish pixels (${pct}%) ${red === 0 ? "CLEAN" : "SAMPLES: " + [...seen].slice(0, 8).join(" | ")}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  await scan(page, "http://localhost:3000/", "HOME   ");
  await page.evaluate(() => window.scrollTo(0, 1100));
  await page.waitForTimeout(1500);
  const buf = await page.screenshot({ type: "png" });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let red = 0; const total = info.width * info.height; const seen = new Set();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (RED_TEST(r, g, b)) { red++; seen.add(`${Math.round(r / 40)},${Math.round(g / 40)},${Math.round(b / 40)}`); }
  }
  console.log(`HOME+SCROLL: ${red}/${total} (${((red / total) * 100).toFixed(4)}%) ${red === 0 ? "CLEAN" : "SAMPLES: " + [...seen].slice(0, 8).join(" | ")}`);
  await scan(page, "http://localhost:3000/admin", "ADMIN  ");
  await scan(page, "http://localhost:3000/pricing", "PRICING");
  await scan(page, "http://localhost:3000/login", "LOGIN  ");
  await browser.close();
})();
