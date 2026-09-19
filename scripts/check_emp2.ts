import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const emps = await db.aiEmployee.findMany({ select: { id: true, name: true, status: true, voiceProfile: true, configVersion: true, organizationId: true } });
  console.log("EMPLOYEES:", JSON.stringify(emps, null, 2));
  const orgs = await db.organization.findMany({ select: { id: true, name: true } });
  console.log("ORGS:", JSON.stringify(orgs));
  const clones = await db.voiceClone.findMany({ select: { id: true, name: true, organizationId: true } });
  console.log("CLONES:", JSON.stringify(clones));
}
main().finally(() => db.$disconnect());
