import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const blocks = await db.contentBlock.findMany({ where: { key: { contains: "hero" } } });
  for (const b of blocks) console.log(JSON.stringify({ key: b.key, value: b.value, visible: b.visible }));
}
main().finally(() => db.$disconnect());
