import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const e = await db.aiEmployee.findFirst({ where: { name: "Ada" }, select: { name: true, voiceProfile: true, configVersion: true } });
  console.log("ADA:", JSON.stringify(e, null, 2));
}
main().finally(() => db.$disconnect());
