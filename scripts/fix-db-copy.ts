/** Fix awkward punctuation artifacts in DB content (double colons from dash conversion). */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const FIXES: Record<string, string> = {
  "home.hero.sub":
    "DEYOUNG COMMUNICATION builds AI employees (receptionists, sales assistants, support agents) that answer in voice and text, use your business knowledge, and hand off to your team the moment a human is needed.",
  "about.intro":
    "We are a communications engineering company. We build AI employees that speak, listen, remember, and act for businesses that refuse to keep people waiting on hold.",
};

async function main() {
  for (const [key, value] of Object.entries(FIXES)) {
    await db.contentBlock.update({ where: { key }, data: { value } });
    console.log("fixed", key);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
