/**
 * Screenshots for the voice worker UI: admin settings (voice engine card with
 * the off switch), home (regression). Logs in through the same API the UI uses.
 */
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  fs.mkdirSync("/tmp/shots", { recursive: true });
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  // 1) home
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "/tmp/shots/home-top.png" });
  console.log("shot: home-top");

  // 2) login (same-origin API sets the session cookie)
  await page.evaluate(async () => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@deyoungcommunication.com", password: "DeYoungAdmin2026!" }),
    });
  });
  const me = await page.evaluate(async () => (await (await fetch("/api/auth/me", { cache: "no-store" })).json()));
  console.log("session:", me?.user ? "admin ok" : "FAILED");
  if (!me?.user) process.exit(1);

  // 3) admin settings page, voice engine card (path navigation reloads the app)
  await page.goto("http://localhost:3000/admin/settings", { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "/tmp/shots/admin-settings-top.png" });
  // scroll to the voice engine card
  const card = page.locator("text=Voice engine, self-hosted worker").first();
  if (await card.count()) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: "/tmp/shots/admin-voice-card.png" });
    console.log("shot: admin-voice-card");
    // toggle the master switch to ON and shoot again (unsaved draft state)
    const sw = card.locator("..").locator("..").locator('button[role="switch"]').first();
    await sw.click().catch(async () => {
      // fallback: any switch on the page below the card header
      await page.locator('button[role="switch"]').nth(3).click().catch(() => {});
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: "/tmp/shots/admin-voice-card-on.png" });
    console.log("shot: admin-voice-card-on (draft, unsaved)");
  } else {
    console.log("MISSING: voice engine card not found");
    await page.screenshot({ path: "/tmp/shots/admin-settings-nocard.png" });
  }
  await browser.close();
})();
