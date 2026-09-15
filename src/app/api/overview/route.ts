import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const orgId = user.organizationId;

  const [employees, conversations, messages, knowledgeSources, events, lastMessage] =
    await Promise.all([
      db.aiEmployee.count({ where: { organizationId: orgId } }),
      db.conversation.count({ where: { organizationId: orgId } }),
      db.message.count({ where: { conversation: { organizationId: orgId }, role: "ai" } }),
      db.knowledgeSource.count({ where: { organizationId: orgId } }),
      db.usageEvent.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      db.message.findFirst({
        where: { conversation: { organizationId: orgId }, role: "ai" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

  // Group usage events by day for the activity sparkline.
  const byDay = new Map<string, number>();
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const today = new Date();
  const eventsByDay: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    eventsByDay.push({ day: key, count: byDay.get(key) ?? 0 });
  }

  const auditCount = await db.auditLog.count({ where: { orgId } });

  return NextResponse.json({
    overview: {
      employees,
      conversations,
      messages,
      knowledgeSources,
      usageEvents: events.length,
      auditEntries: auditCount,
      lastActivityAt: lastMessage?.createdAt?.toISOString() ?? null,
      eventsByDay,
    },
  });
}
