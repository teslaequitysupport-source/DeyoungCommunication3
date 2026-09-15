/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 880, height: 1200 } });
  await page.goto('file://' + path.resolve('/home/z/my-project/scripts/dossier_diagram.html'));
  await page.waitForTimeout(400);
  const el = await page.$('.canvas');
  await el.screenshot({ path: '/home/z/my-project/scripts/dossier_architecture.png' });
  await browser.close();
  console.log('diagram saved');
})();
