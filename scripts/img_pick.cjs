#!/usr/bin/env node
/**
 * Parse z-ai image-search logs from /tmp/imgsearch, pick the best-quality
 * result per slot, download to public/img/<slot>.png (replacing AI art with
 * real photography), and report what landed.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DIR = "/tmp/imgsearch";
const OUT = "/home/z/my-project/public/img";

const slots = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".log"))
  .map((f) => f.replace(/\.log$/, ""));

const report = [];
for (const slot of slots) {
  const raw = fs.readFileSync(path.join(DIR, `${slot}.log`), "utf8");
  const start = raw.indexOf("{");
  if (start < 0) {
    report.push([slot, "NO JSON"]);
    continue;
  }
  let data;
  try {
    data = JSON.parse(raw.slice(start));
  } catch {
    report.push([slot, "BAD JSON"]);
    continue;
  }
  if (!data.success || !data.results || data.results.length === 0) {
    report.push([slot, "NO RESULTS"]);
    continue;
  }
  // Prefer the widest image at least 1200px; else the widest overall.
  const width = (r) => parseInt(String(r.original_width || "0"), 10) || 0;
  const sorted = [...data.results].sort((a, b) => width(b) - width(a));
  const best = sorted.find((r) => width(r) >= 1200) ?? sorted[0];
  const url = best.original_url;
  const dest = path.join(OUT, `${slot}.png`);
  try {
    execSync(`curl -sL --max-time 60 -o "${dest}.tmp" "${url}"`, { stdio: "pipe" });
    const size = fs.statSync(`${dest}.tmp`).size;
    if (size < 20000) throw new Error(`too small: ${size}`);
    // Confirm it is a real image before replacing the existing asset.
    const head = fs.readFileSync(`${dest}.tmp`).slice(0, 12);
    const isJpg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50;
    const isWebp = head.slice(0, 4).toString() === "RIFF" && head.slice(8, 12).toString() === "WEBP";
    if (!isJpg && !isPng && !isWebp) throw new Error("not an image");
    fs.renameSync(`${dest}.tmp`, dest);
    report.push([slot, `OK ${size}B ${width(best)}px ${best.source}`]);
  } catch (e) {
    try {
      fs.unlinkSync(`${dest}.tmp`);
    } catch {}
    report.push([slot, `FAIL ${String(e.message || e)}`]);
  }
}
for (const [slot, msg] of report) console.log(slot.padEnd(20), msg);
