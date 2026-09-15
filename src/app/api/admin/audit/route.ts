import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/audit: full action history (admin-only). */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { email: true, name: true, role: true } } },
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor,
      target: l.target,
      reason: l.reason,
      at: l.createdAt.toISOString(),
      by: l.user ? { email: l.user.email, name: l.user.name, role: l.user.role } : null,
    })),
  });
}
