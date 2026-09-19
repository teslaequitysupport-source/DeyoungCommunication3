import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const call = await db.callSession.findFirst({ orderBy: { startedAt: "desc" }, include: { turns: { orderBy: { createdAt: "asc" } } } });
  if (!call) { console.log("no calls"); return; }
  console.log("CALL:", call.id, call.status, call.channel);
  for (const t of call.turns) console.log(t.speaker.toUpperCase(), "(", t.latencyMs, "ms, source:", t.source, "):", t.content.slice(0, 110), t.cues !== "[]" ? "CUES:" + t.cues : "");
}
main().finally(() => db.$disconnect());
