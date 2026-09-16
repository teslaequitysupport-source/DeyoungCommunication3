import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, usage } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { summarizeCues } from "@/lib/emotion";
import { runAutomations } from "@/lib/server/automations";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({ status: z.enum(["completed", "failed"]) });

/** PATCH: end the call; computes real duration + cue summary from actual turns. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const call = await db.callSession.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  if (call.status !== "live") return NextResponse.json({ ok: true, alreadyEnded: true });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid end status." }, { status: 400 });

  const durationSec = Math.max(1, Math.round((Date.now() - call.startedAt.getTime()) / 1000));
  const turns = await db.callTurn.findMany({
    where: { callId: call.id },
    orderBy: { ordinal: "asc" },
    select: { speaker: true, content: true },
  });
  const aiUtterances = turns.filter((t) => t.speaker === "ai").map((t) => t.content);

  const ended = await db.callSession.update({
    where: { id: call.id },
    data: {
      status: parsed.data.status,
      endedAt: new Date(),
      durationSec,
      turnsCount: turns.length,
      interruptions: call.interruptions,
      cuesSummary: JSON.stringify(summarizeCues(aiUtterances)),
    },
  });
  await usage(user.organizationId, "call_ended", `${parsed.data.status}:${durationSec}s`);
  await emitRealtime("call:ended", {
    callId: call.id,
    status: ended.status,
    durationSec: ended.durationSec,
    turnsCount: ended.turnsCount,
    interruptions: ended.interruptions,
    cuesSummary: JSON.parse(ended.cuesSummary || "{}"),
    at: new Date().toISOString(),
  });
  // Fire the organization's automation rules on this real event.
  try {
    await runAutomations("call_ended", { id: user.organizationId, name: user.organizationName }, {
      context: ended.transcript || "(no transcript was captured)",
      meta: `${parsed.data.status} call, ${Math.floor(durationSec / 60)}m ${durationSec % 60}s, ${turns.length} turns`,
      actorUserId: user.userId,
    });
  } catch {
    /* automation failures are logged as runs; never block the call end */
  }
  return NextResponse.json({ ok: true, durationSec, turnsCount: turns.length });
}
