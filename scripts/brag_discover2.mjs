// Second pass: employees, inbox, admin
import { chromium } from 'playwright';

const OUT = '/home/z/my-project/brag-output/discovery';
const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@deyoungcommunication.com', password: 'DeYoungAdmin2026!' };

const browser = await chromium.launch();
const a = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const ap = await a.newPage();

async function shot(page, name) {
  await page.waitForTimeout(1500);
  try { await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 20000 }); console.log('saved', name); }
  catch (e) { console.log('FAILED', name); }
}

await ap.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await ap.evaluate(async ({ email, password }) => {
  await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
}, ADMIN);

for (const [route, name] of [['app/employees', '24-employees'], ['app/inbox', '25-inbox'], ['admin', '30-admin']]) {
  await ap.goto(BASE + '/' + route, { waitUntil: 'domcontentloaded' });
  await shot(ap, name);
}
await browser.close();
console.log('DONE');
