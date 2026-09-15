/** Copy trim pass: shorter, punchier marketing copy in live DB + "we provide everything" positioning. */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const TRIMS: Record<string, string> = {
  "home.hero.sub":
    "AI employees that answer every call and chat, know your business, and hand off to humans when it matters. You bring nothing: we provide everything.",
  "about.intro":
    "We build AI employees that speak, listen, remember, and act. Businesses refuse to keep people waiting: so do we.",
  "home.stats.honest_note":
    "These counters are live. Zero until real work happens here.",
};

async function main() {
  for (const [key, value] of Object.entries(TRIMS)) {
    const r = await db.contentBlock.updateMany({ where: { key }, data: { value } });
    console.log("trimmed", key, r.count ? "ok" : "(missing)");
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
