/** Update persisted site content rows (copy) without touching visibility settings. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.contentBlock.updateMany({
    where: { key: "home.hero.sub" },
    data: {
      value:
        "AI employees that answer every call and chat, know your business, and hand off to humans when it matters. For companies and individuals alike: you bring nothing, we provide everything.",
    },
  });
  console.log("updated rows:", r.count);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
