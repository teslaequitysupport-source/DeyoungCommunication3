import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** Real DB counts. Zero until real work happens here: never inflated. */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const [
    usersTotal,
    usersPending,
    usersActive,
    usersBlocked,
    orgs,
    employees,
    employeesDeployed,
    conversations,
    messages,
    callsLive,
    callsTotal,
    callTurns,
    knowledge,
    inquiries,
    media,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "pending" } }),
    db.user.count({ where: { status: "active" } }),
    db.user.count({ where: { status: "blocked" } }),
    db.organization.count(),
    db.aiEmployee.count(),
    db.aiEmployee.count({ where: { status: "deployed" } }),
    db.conversation.count(),
    db.message.count(),
    db.callSession.count({ where: { status: "live" } }),
    db.callSession.count(),
    db.callTurn.count(),
    db.knowledgeSource.count(),
    db.contactInquiry.count(),
    db.mediaAsset.count(),
  ]);

  const recentAudit = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { user: { select: { email: true, name: true } } },
  });

  return NextResponse.json({
    counts: {
      usersTotal, usersPending, usersActive, usersBlocked, orgs,
      employees, employeesDeployed, conversations, messages,
      callsLive, callsTotal, callTurns, knowledge, inquiries, media,
    },
    recentAudit: recentAudit.map((a) => ({
      id: a.id,
      action: a.action,
      actor: a.actor,
      target: a.target,
      reason: a.reason,
      at: a.createdAt.toISOString(),
      by: a.user?.email ?? null,
    })),
    serverTime: new Date().toISOString(),
  });
}
