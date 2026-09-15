import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/calls: every session across all orgs (admin-only).
 *  Optional ?id= returns full transcript + turns. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const call = await db.callSession.findUnique({
      where: { id },
      include: {
        employee: { select: { name: true, role: true } },
        user: { select: { email: true, name: true } },
        turns: { orderBy: { ordinal: "asc" } },
      },
    });
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    return NextResponse.json({
      call: {
        id: call.id,
        status: call.status,
        channel: call.channel,
        direction: call.direction,
        employeeName: call.employee?.name ?? null,
        userName: call.user?.name ?? null,
        userEmail: call.user?.email ?? null,
        startedAt: call.startedAt.toISOString(),
        endedAt: call.endedAt?.toISOString() ?? null,
        durationSec: call.durationSec,
        turnsCount: call.turnsCount,
        interruptions: call.interruptions,
        cuesSummary: JSON.parse(call.cuesSummary || "{}"),
        turns: call.turns.map((t) => ({
          id: t.id,
          ordinal: t.ordinal,
          speaker: t.speaker,
          content: t.content,
          cues: JSON.parse(t.cues || "[]"),
          latencyMs: t.latencyMs,
          interrupted: t.interrupted,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  }

  const calls = await db.callSession.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      employee: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  return NextResponse.json({
    calls: calls.map((c) => ({
      id: c.id,
      status: c.status,
      channel: c.channel,
      direction: c.direction,
      employeeName: c.employee?.name ?? null,
      userName: c.user?.name ?? null,
      userEmail: c.user?.email ?? null,
      startedAt: c.startedAt.toISOString(),
      endedAt: c.endedAt?.toISOString() ?? null,
      durationSec: c.durationSec,
      turnsCount: c.turnsCount,
      interruptions: c.interruptions,
      cuesSummary: JSON.parse(c.cuesSummary || "{}"),
    })),
  });
}
