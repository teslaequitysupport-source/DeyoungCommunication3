const { chromium } = require('playwright');
const sharp = require('sharp');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const urls = { HOME: 'http://localhost:3000/', ADMIN: 'http://localhost:3000/admin', PRICING: 'http://localhost:3000/pricing', PRODUCT: 'http://localhost:3000/product', CONTACT: 'http://localhost:3000/contact', APP: 'http://localhost:3000/app', AUTOMATIONS: 'http://localhost:3000/app/automations' };
  for (const [name, url] of Object.entries(urls)) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const buf = await page.screenshot({ fullPage: false });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    let red = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 120 && g < r * 0.45 && b < r * 0.45) red++;
    }
    const pct = ((red / (info.width * info.height)) * 100).toFixed(4);
    console.log(`${name}: ${pct}% red pixels (${red})`);
  }
  await browser.close();
})();
