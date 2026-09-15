/**
 * Clean em/en dashes from LIVE database values (seeded before the purge).
 * Content blocks + site settings are admin-editable, so the DB copy wins over code defaults.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function clean(s: string): string {
  return s
    .replace(/ — /g, ": ")
    .replace(/—/g, " ")
    .replace(/ – /g, ": ")
    .replace(/–/g, "-")
    .replace(/\s+,/g, ",")
    .replace(/:\s+/g, ": ")
    .replace(/ {2,}/g, " ")
    .replace(/"/g, '"');
}

async function main() {
  const blocks = await db.contentBlock.findMany();
  let n = 0;
  for (const b of blocks) {
    const v = clean(b.value);
    const label = clean(b.label);
    if (v !== b.value || label !== b.label) {
      await db.contentBlock.update({ where: { id: b.id }, data: { value: v, label } });
      n++;
      console.log(`fixed block ${b.key}`);
    }
  }
  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (settings) {
    const data = {
      tagline: clean(settings.tagline),
      supportEmail: settings.supportEmail,
      bannerText: clean(settings.bannerText),
      bannerLabel: clean(settings.bannerLabel),
    };
    if (data.tagline !== settings.tagline || data.bannerText !== settings.bannerText || data.bannerLabel !== settings.bannerLabel) {
      await db.siteSettings.update({ where: { id: "site" }, data });
      n++;
      console.log("fixed site settings");
    }
  }
  console.log(`done, ${n} rows cleaned`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
