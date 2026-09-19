import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const calls = await db.callSession.findMany({ orderBy: { startedAt: "desc" }, take: 4, select: { id: true, status: true, callDirectives: true, startedAt: true } });
  for (const c of calls) console.log(c.status, c.startedAt.toISOString(), "DIR=[" + c.callDirectives + "]");
}
main().finally(() => db.$disconnect());
