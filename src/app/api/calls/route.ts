import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, usage } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  employeeId: z.string().min(1),
  // Operator directives for THIS particular call: what to say, how to answer.
  // The employee must obey them for the whole call. Optional.
  callDirectives: z.string().max(4000).default(""),
});

/** POST /api/calls: start a live browser voice session with one of your employees. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.status !== "active") {
    return NextResponse.json({ error: "Your account is awaiting activation." }, { status: 403 });
  }
  // Major functions are paid. Real-time voice is a Business feature:
  // the free Starter plan covers text chat only. Admins keep full access.
  if (user.accountRole !== "admin" && user.plan === "starter") {
    return NextResponse.json(
      {
        error:
          "Real-time voice calls are a Business feature. The free Starter plan covers text chat. Ask an administrator to upgrade your workspace, or start a plan from the pricing page.",
        upgrade: true,
      },
      { status: 402 },
    );
  }
  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an AI employee to call." }, { status: 400 });

  const employee = await db.aiEmployee.findFirst({
    where: { id: parsed.data.employeeId, organizationId: user.organizationId },
  });
  if (!employee) return NextResponse.json({ error: "AI employee not found." }, { status: 404 });
  if (employee.status !== "deployed") {
    return NextResponse.json({ error: `${employee.name} is not deployed. Deploy it first, then call.` }, { status: 400 });
  }

  // Honest reaping: a browser tab that closed mid-call leaves a live row.
  // Starting a new call closes stale sessions as "failed" with a truthful reason.
  const stale = await db.callSession.findMany({
    where: { userId: user.userId, status: "live" },
  });
  for (const s of stale) {
    await db.callSession.update({
      where: { id: s.id },
      data: {
        status: "failed",
        endedAt: new Date(),
        durationSec: Math.max(1, Math.round((Date.now() - s.startedAt.getTime()) / 1000)),
      },
    });
    await db.auditLog.create({
      data: {
        userId: user.userId,
        orgId: user.organizationId,
        actor: "system",
        action: "call.session_reaped",
        target: s.id,
        reason: "Browser session ended without a close signal",
      },
    });
  }

  const call = await db.callSession.create({
    data: {
      organizationId: user.organizationId,
      employeeId: employee.id,
      userId: user.userId,
      channel: "browser_voice",
      status: "live",
      direction: "outbound_test",
      callDirectives: parsed.data.callDirectives.trim(),
    },
  });
  await usage(user.organizationId, "call_started", employee.name);
  await emitRealtime("call:started", {
    callId: call.id,
    employeeName: employee.name,
    userName: user.name ?? user.email,
    userEmail: user.email,
    channel: call.channel,
    at: call.startedAt.toISOString(),
  });
  return NextResponse.json({
    call: {
      id: call.id,
      employeeId: employee.id,
      employeeName: employee.name,
      status: call.status,
      channel: call.channel,
      callDirectives: call.callDirectives,
      startedAt: call.startedAt.toISOString(),
    },
  });
}

/** GET /api/calls: your organization's sessions (most recent first). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const calls = await db.callSession.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { employee: { select: { name: true } } },
  });
  return NextResponse.json({
    calls: calls.map((c) => ({
      id: c.id,
      employeeName: c.employee?.name ?? null,
      status: c.status,
      channel: c.channel,
      direction: c.direction,
      startedAt: c.startedAt.toISOString(),
      endedAt: c.endedAt?.toISOString() ?? null,
      durationSec: c.durationSec,
      turnsCount: c.turnsCount,
      interruptions: c.interruptions,
      cuesSummary: JSON.parse(c.cuesSummary || "{}"),
    })),
  });
}
