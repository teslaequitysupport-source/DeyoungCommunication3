// Fetch the real conversation turns for honest film material
import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@deyoungcommunication.com', password: 'DeYoungAdmin2026!' };
const browser = await chromium.launch();
const page = await browser.newContext().then(c => c.newPage());
await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await page.evaluate(async ({ email, password }) => {
  await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
}, ADMIN);
const r = await page.evaluate(async () => {
  const res = await fetch('/api/conversations');
  const j = await res.json();
  const id = j.conversations?.[0]?.id;
  const detail = await fetch('/api/conversations/' + id);
  return await detail.text();
});
console.log(r.slice(0, 2200));
await browser.close();
