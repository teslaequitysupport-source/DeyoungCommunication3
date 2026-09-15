import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { extractCues } from "@/lib/emotion";
import { refreshCallAggregates } from "@/lib/server/call-engine";
import { z } from "zod";

export const dynamic = "force-dynamic";

const coachSchema = z.object({
  text: z.string().min(1).max(2000),
  mode: z.enum(["exact", "instruct"]),
});

/**
 * POST /api/calls/[id]/coach · mid-call operator control.
 * - mode "exact": the operator's words become the employee's NEXT spoken reply,
 *   word for word, immediately. Logged as source operator_injection.
 * - mode "instruct": the directive is stored pending; the next caller turn
 *   delivers it to the employee as an absolute coaching order it must obey.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;

  const call = await db.callSession.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { employee: { select: { id: true, name: true } }, turns: { orderBy: { ordinal: "desc" }, take: 1 } },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  if (call.status !== "live") return NextResponse.json({ error: "This call has ended." }, { status: 400 });

  const parsed = coachSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Type what you want the employee to do." }, { status: 400 });
  const { text, mode } = parsed.data;

  const lastOrdinal = call.turns[0]?.ordinal ?? 0;
  const coachLog: { at: string; text: string; mode: string; appliedOrdinal: number }[] = (() => {
    try {
      return JSON.parse(call.coachLog || "[]");
    } catch {
      return [];
    }
  })();

  if (mode === "instruct") {
    // Pending directive: the turn engine delivers it with the next caller turn.
    const entry = { at: new Date().toISOString(), text: text.trim(), mode, appliedOrdinal: -1 };
    coachLog.push(entry);
    await db.callSession.update({
      where: { id: call.id },
      data: { coachLog: JSON.stringify(coachLog) },
    });
    await emitRealtime("call:coached", {
      callId: call.id,
      employeeName: call.employee?.name ?? null,
      directive: text.trim(),
      mode,
      at: entry.at,
    });
    return NextResponse.json({ ok: true, mode, pending: entry });
  }

  // mode "exact": the employee says the operator's words NOW, verbatim.
  const employeeName = call.employee?.name ?? "AI employee";
  const clean = text.trim();
  const cues = extractCues(clean);
  const aiTurn = await db.callTurn.create({
    data: {
      callId: call.id,
      ordinal: lastOrdinal + 1,
      speaker: "ai",
      content: clean,
      cues: JSON.stringify(cues),
      latencyMs: 0,
      source: "operator_injection",
    },
  });
  coachLog.push({ at: new Date().toISOString(), text: clean, mode, appliedOrdinal: aiTurn.ordinal });
  await db.callSession.update({
    where: { id: call.id },
    data: { coachLog: JSON.stringify(coachLog) },
  });
  await refreshCallAggregates(call.id, employeeName);
  await emitRealtime("call:turn", {
    callId: call.id,
    employeeName,
    human: null,
    ai: { text: clean, raw: clean, cues, latencyMs: 0, source: "operator_injection" },
    at: new Date().toISOString(),
  });
  return NextResponse.json({
    ok: true,
    mode,
    aiTurn: {
      id: aiTurn.id,
      ordinal: aiTurn.ordinal,
      content: clean,
      cues,
      latencyMs: 0,
      interrupted: false,
      source: "operator_injection",
    },
  });
}
