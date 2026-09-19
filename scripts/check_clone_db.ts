import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const clones = await db.voiceClone.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      name: true, engine: true, status: true, sampleCount: true, totalMs: true,
      consentName: true, consentAt: true, profileJson: true,
    },
  });
  console.log("CLONES:", JSON.stringify(clones, null, 2));

  const audit = await db.auditEntry.findMany({
    where: { action: { contains: "clone" } },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { action: true, reason: true, createdAt: true },
  });
  console.log("AUDIT:", JSON.stringify(audit, null, 2));
}

main().finally(() => db.$disconnect());
