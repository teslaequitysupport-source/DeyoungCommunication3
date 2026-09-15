import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** GET /api/admin/users: full table incl. internal notes (admin-only field). */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { memberships: { include: { organization: { select: { name: true } } }, take: 1 } },
    take: 200,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      plan: u.plan ?? "starter",
      statusReason: u.statusReason,
      internalNotes: u.internalNotes, // admin-only: never sent to user endpoints
      createdAt: u.createdAt.toISOString(),
      approvedAt: u.approvedAt?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      orgName: u.memberships[0]?.organization.name ?? null,
    })),
  });
}

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["approve", "reject", "block", "unblock", "makeAdmin", "removeAdmin", "setPlan"]),
  reason: z.string().max(500).optional().default(""),
  plan: z.enum(["starter", "business", "agency"]).optional(),
});

/** POST /api/admin/users: lifecycle actions with audit + realtime broadcast. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
  const { userId, action, reason, plan } = parsed.data;

  if (userId === guard.user.userId && (action === "block" || action === "removeAdmin")) {
    return NextResponse.json({ error: "You cannot lock yourself out of the admin console." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  switch (action) {
    case "approve":
      await db.user.update({ where: { id: userId }, data: { status: "active", statusReason: "", approvedAt: new Date() } });
      break;
    case "reject":
      await db.user.update({ where: { id: userId }, data: { status: "rejected", statusReason: reason || "Signup not approved." } });
      await db.sessionToken.deleteMany({ where: { userId } });
      break;
    case "block":
      await db.user.update({ where: { id: userId }, data: { status: "blocked", statusReason: reason || "Blocked by administrator." } });
      await db.sessionToken.deleteMany({ where: { userId } }); // real logout, immediately
      break;
    case "unblock":
      await db.user.update({ where: { id: userId }, data: { status: "active", statusReason: "" } });
      break;
    case "makeAdmin":
      await db.user.update({ where: { id: userId }, data: { role: "admin" } });
      break;
    case "removeAdmin":
      await db.user.update({ where: { id: userId }, data: { role: "user" } });
      break;
    case "setPlan": {
      if (!plan) return NextResponse.json({ error: "A plan is required for setPlan." }, { status: 400 });
      await db.user.update({ where: { id: userId }, data: { plan } });
      break;
    }
  }

  await audit({
    userId: guard.user.userId,
    orgId: null,
    actor: "admin",
    action: `admin.user.${action}`,
    target: user.email,
    reason: action === "setPlan" ? `plan set to ${plan ?? "starter"}` : reason,
  });
  await emitRealtime(action === "makeAdmin" || action === "removeAdmin" ? "user:role" : "user:plan", {
    userId,
    email: user.email,
    action,
    plan,
    reason,
    at: new Date().toISOString(),
  });

  const updated = await db.user.findUnique({ where: { id: userId } });
  return NextResponse.json({
    ok: true,
    user: {
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      role: updated!.role,
      status: updated!.status,
      plan: updated!.plan ?? "starter",
      statusReason: updated!.statusReason,
      createdAt: updated!.createdAt.toISOString(),
    },
  });
}
