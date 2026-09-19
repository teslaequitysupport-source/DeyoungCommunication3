#!/usr/bin/env node
/**
 * Normalize the downloaded real photos: strip any fake .png wrapper,
 * resize to a sane max width, and write clean optimized JPEGs as
 * public/img/<slot>.jpg. Prints a manifest of name -> bytes + dims.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = "/home/z/my-project/public/img";

const SLOTS = [
  "abstract-signal",
  "agent-reception",
  "agent-sales",
  "agent-support",
  "avatar-1",
  "avatar-2",
  "blog-emotion",
  "blog-handoff",
  "industry-clinic",
  "industry-ecommerce",
  "industry-law",
  "industry-realestate",
  "network-map",
  "security-core",
  "team-studio",
];

(async () => {
  for (const slot of SLOTS) {
    const src = path.join(DIR, `${slot}.png`);
    if (!fs.existsSync(src)) {
      console.log(slot.padEnd(20), "MISSING");
      continue;
    }
    const out = path.join(DIR, `${slot}.jpg`);
    const meta = await sharp(src).metadata();
    await sharp(src)
      .resize({ width: Math.min(2400, meta.width ?? 2400), withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(out);
    const st = fs.statSync(out);
    const m2 = await sharp(out).metadata();
    console.log(
      slot.padEnd(20),
      `${m2.width}x${m2.height}`,
      `${Math.round(st.size / 1024)}KB`,
    );
  }
})();
