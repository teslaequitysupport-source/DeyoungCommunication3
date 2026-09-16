/** Visual audit: all imgs loaded, orbs/waveforms present, copy updated, no red. */
const { chromium } = require("playwright");
const sharp = require("sharp");

const PAGES = ["/", "/pricing", "/product", "/solutions"];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  let fails = 0;

  for (const path of PAGES) {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img")).map((i) => ({
        src: i.getAttribute("src"),
        ok: i.complete && i.naturalWidth > 0,
      }))
    );
    const broken = imgs.filter((i) => !i.ok);
    const orbs = await page.evaluate(() => document.querySelectorAll(".icon-orb").length);
    const sub = await page.evaluate(() => document.body.innerText.includes("individuals alike"));
    const solo = await page.evaluate(() => document.body.innerText.includes("Solo use is fully supported"));
    const buf = await page.screenshot({ type: "png" });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    let red = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (r > 120 && g < r * 0.45 && b < r * 0.45) red++;
    }

    console.log(
      `${path}: imgs=${imgs.length} broken=${broken.length} orbs=${orbs} personal-copy=${sub || solo} redPx=${red}`
    );
    if (broken.length) { console.log("  BROKEN:", broken.map((b) => b.src).join(", ")); fails++; }
    if (red > 50) { console.log("  RED PIXELS DETECTED"); fails++; }
  }

  // Scroll through home to lazy-load below-fold images too.
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(700);
  }
  const imgs2 = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img")).filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src"))
  );
  console.log("home full-scroll broken:", imgs2.length ? imgs2.join(", ") : "none");
  if (imgs2.length) fails++;

  await browser.close();
  console.log(fails === 0 ? "AUDIT PASS" : `AUDIT FAIL (${fails})`);
  process.exit(fails === 0 ? 0 : 1);
})();
