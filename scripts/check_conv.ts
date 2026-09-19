import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const convs = await db.conversation.findMany({ orderBy: { lastMessageAt: "desc" }, take: 2, include: { messages: { orderBy: { createdAt: "asc" } } } });
  for (const c of convs) {
    console.log("CONV:", c.id, c.channel, c.status, "-", c.messages.length, "messages");
    for (const m of c.messages.slice(0, 6)) console.log(" ", m.role, ":", m.content.slice(0, 110));
  }
  const calls = await db.callSession.findMany({ orderBy: { startedAt: "desc" }, take: 3, select: { id: true, status: true, startedAt: true, channel: true } });
  console.log("CALLS:", JSON.stringify(calls, null, 1));
}
main().finally(() => db.$disconnect());
