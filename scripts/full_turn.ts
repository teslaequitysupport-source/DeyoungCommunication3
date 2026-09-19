import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const call = await db.callSession.findFirst({ orderBy: { startedAt: "desc" }, include: { turns: { orderBy: { createdAt: "asc" } } } });
  for (const t of call?.turns ?? []) {
    console.log("---", t.speaker.toUpperCase(), t.latencyMs + "ms", "cues:", t.cues, "directives?", t.content.includes("discount") ? "" : "");
    console.log(t.content);
  }
  const c = call ? await db.callSession.findUnique({ where: { id: call.id } }) : null;
  console.log("CALL state:", c?.status, "directives stored:", c?.callDirectives ?? "(none)");
}
main().finally(() => db.$disconnect());
