// BRAG Step 1: Product Discovery Pass — capture real UI from the live site
// Usage: node scripts/brag_discover.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/home/z/my-project/brag-output/discovery';
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@deyoungcommunication.com', password: 'DeYoungAdmin2026!' };

const browser = await chromium.launch();

async function shot(page, name, timeout = 45000) {
  await page.waitForTimeout(1200);
  try {
    await page.screenshot({ path: `${OUT}/${name}.png`, timeout });
    console.log('saved', name);
  } catch (e) {
    console.log('FAILED', name, e.message.split('\n')[0]);
  }
}

// --- Mobile pass (9:16 film reference) ---
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mp = await m.newPage();

// Home hero
await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
await mp.waitForTimeout(2500);
await shot(mp, '01-home-hero-mobile');

// Home sections (scroll)
await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.18));
await shot(mp, '02-home-agents-mobile');
await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.42));
await shot(mp, '03-home-mid-mobile');
await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
await shot(mp, '04-home-late-mobile');

// --- Desktop pass skipped: Three.js hero canvas stalls headless screenshots; mobile captures suffice ---

// --- Login and app console ---
const a = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const ap = await a.newPage();
await ap.goto(BASE + '/login', { waitUntil: 'networkidle' });
await ap.waitForTimeout(1500);
await shot(ap, '20-login-mobile');

// try direct api login via fetch from the target origin
try {
  const res = await ap.evaluate(async ({ email, password }) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return r.status;
  }, ADMIN);
  console.log('login status', res);
} catch (e) { console.log('login eval failed', e.message); }

const views = [
  ['app', '21-app-overview'],
  ['app/voice-studio', '22-voice-studio'],
  ['app/live-calls', '23-live-calls'],
  ['app/employees', '24-employees'],
  ['app/inbox', '25-inbox'],
  ['admin', '30-admin'],
];
for (const [route, name] of views) {
  await ap.goto(BASE + '/' + route, { waitUntil: 'networkidle' });
  await ap.waitForTimeout(2000);
  await shot(ap, name);
}

await browser.close();
console.log('DONE');
