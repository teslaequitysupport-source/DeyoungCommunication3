// Fetch real product data for the film (honesty: only real values)
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@deyoungcommunication.com', password: 'DeYoungAdmin2026!' };

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await page.evaluate(async ({ email, password }) => {
  await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
}, ADMIN);

const out = {};
for (const ep of ['stats', 'employees', 'calls', 'conversations', 'voice-clones']) {
  try {
    const r = await page.evaluate(async (e) => {
      const res = await fetch('/api/' + e);
      return { status: res.status, body: await res.text() };
    }, ep);
    out[ep] = { status: r.status, body: r.body.slice(0, 1500) };
  } catch (e) { out[ep] = { error: e.message }; }
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
