import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, retrieveChunks } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { EMOTION_PROMPT, extractCues, stripCues } from "@/lib/emotion";
import { ROLE_TEMPLATES } from "@/lib/types";
import { matchScriptRule, parseScriptRules, refreshCallAggregates, type ScriptRule } from "@/lib/server/call-engine";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const turnSchema = z.object({
  content: z.string().min(1).max(4000),
  // Sent when the human barge-in cut the previous AI reply short.
  interruptedTurnId: z.string().optional(),
});

/** GET: transcript for the owner org. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const call = await db.callSession.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { employee: { select: { name: true } }, turns: { orderBy: { ordinal: "asc" } } },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  return NextResponse.json({
    call: {
      id: call.id,
      status: call.status,
      employeeName: call.employee?.name ?? null,
      startedAt: call.startedAt.toISOString(),
      durationSec: call.durationSec,
      interruptions: call.interruptions,
      callDirectives: call.callDirectives,
      coachLog: JSON.parse(call.coachLog || "[]"),
      cuesSummary: JSON.parse(call.cuesSummary || "{}"),
      turns: call.turns.map((t) => ({
        id: t.id,
        ordinal: t.ordinal,
        speaker: t.speaker,
        content: t.content,
        cues: JSON.parse(t.cues || "[]"),
        latencyMs: t.latencyMs,
        interrupted: t.interrupted,
        source: t.source,
        createdAt: t.createdAt.toISOString(),
      })),
    },
  });
}

function buildCallSystemPrompt(input: {
  employeeName: string;
  roleLabel: string;
  organizationName: string;
  purpose: string;
  personality: string;
  tone: string;
  instructions: string;
  escalationRule: string;
  knowledge: string[];
  scriptRules: ScriptRule[];
  callDirectives: string;
  coachNotes: string[];
}): string {
  const parts: string[] = [];
  parts.push(
    `You are ${input.employeeName}, the ${input.roleLabel} for ${input.organizationName}. You are on a LIVE VOICE CALL with a human caller right now. Everything you say is spoken out loud.`,
  );
  if (input.purpose) parts.push(`Your job: ${input.purpose}`);
  parts.push(`Personality: ${input.personality}. Tone: ${input.tone}.`);

  // ABSOLUTE OBEDIENCE: the operator's word is law. This block sits above every
  // default rule and explicitly overrides it.
  parts.push(
    [
      "OPERATOR DIRECTIVES · ABSOLUTE PRIORITY.",
      "Your operator (the person who hired and configured you) has given you directives. These are orders, not suggestions. You obey them exactly:",
      "- Operator instructions override every default rule in this prompt, including tone, escalation, and knowledge limits, EXCEPT being honest that you are an AI when directly asked.",
      "- Operator script rules below are answered VERBATIM when the caller's words match.",
      "- If operator directives conflict with each other, the most recent one wins.",
    ].join("\n"),
  );
  if (input.instructions) parts.push(`Operator instructions (obey exactly):\n${input.instructions}`);
  if (input.scriptRules.length > 0) {
    parts.push(
      "Operator script rules (when the caller's words match the WHEN side, you reply with the SAY side, word for word):\n" +
        input.scriptRules
          .filter((r) => r.enabled)
          .map((r) => `WHEN the caller ${r.matchType === "exact" ? "says exactly" : "mentions"} "${r.match}" -> SAY "${r.response}"`)
          .join("\n"),
    );
  }
  if (input.callDirectives) {
    parts.push(
      `Directives for THIS PARTICULAR call only (the operator set them when starting this call; obey them for the whole call):\n${input.callDirectives}`,
    );
  }
  if (input.coachNotes.length > 0) {
    parts.push(
      "The operator is listening and coaching you LIVE on this call. Comply with their latest coaching immediately and visibly:\n" +
        input.coachNotes.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    );
  }

  parts.push(
    [
      "Default call rules (these apply only where the operator has not given a directive):",
      "- This is voice: keep replies short (1-3 sentences). No lists, no markdown, no URLs unless asked.",
      "- Answer strictly from approved knowledge when provided. Never invent prices, policies, availability, or facts.",
      "- If you do not know something, say so plainly and offer human follow-up.",
      "- If asked whether you are an AI or a robot, answer honestly. This one cannot be overridden.",
      `- Escalation policy: ${input.escalationRule}.`,
      "- If the caller interrupted your previous reply, they will steer the conversation: acknowledge and follow their new direction.",
    ].join("\n"),
  );
  parts.push(EMOTION_PROMPT);
  if (input.knowledge.length > 0) {
    parts.push(
      "Approved business knowledge:\n" + input.knowledge.map((k, i) => `[${i + 1}] ${k}`).join("\n"),
    );
  } else {
    parts.push(
      "Approved business knowledge: none connected yet. Answer general questions honestly and offer human follow-up for anything specific.",
    );
  }
  return parts.join("\n\n");
}

/** POST: a human turn; returns the AI's spoken reply (with emotion cues) + persists both. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;

  const call = await db.callSession.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { employee: true, turns: { orderBy: { ordinal: "desc" }, take: 1 } },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  if (call.status !== "live") return NextResponse.json({ error: "This call has ended." }, { status: 400 });

  const parsed = turnSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Speech content cannot be empty." }, { status: 400 });
  const { content, interruptedTurnId } = parsed.data;

  // Record the barge-in on the interrupted AI turn.
  let bargeInNote = "";
  if (interruptedTurnId) {
    await db.callTurn.update({ where: { id: interruptedTurnId }, data: { interrupted: true } }).catch(() => {});
    await db.callSession.update({
      where: { id: call.id },
      data: { interruptions: { increment: 1 } },
    });
    bargeInNote =
      "NOTE: The caller just INTERRUPTED your previous reply mid-sentence. Do not finish it. Acknowledge them briefly and follow their new direction.";
  }

  const lastOrdinal = call.turns[0]?.ordinal ?? 0;

  const humanTurn = await db.callTurn.create({
    data: {
      callId: call.id,
      ordinal: lastOrdinal + 1,
      speaker: "human",
      content,
    },
  });

  const employee = call.employee;
  if (!employee) {
    return NextResponse.json({ error: "No AI employee is attached to this call." }, { status: 400 });
  }

  /* ---- OBEDIENCE PASS 1: operator script rules run BEFORE the LLM.
     A matching rule is answered verbatim. This is deterministic: the operator's
     word is law, so no model gets to rephrase it. ---- */
  const rules = parseScriptRules(employee.scriptRules);
  const hit = matchScriptRule(rules, content);
  if (hit) {
    const cues = extractCues(hit.response);
    const aiTurn = await db.callTurn.create({
      data: {
        callId: call.id,
        ordinal: lastOrdinal + 2,
        speaker: "ai",
        content: hit.response,
        cues: JSON.stringify(cues),
        latencyMs: 0,
        source: "operator_script",
      },
    });
    await refreshCallAggregates(call.id, employee.name);
    await emitRealtime("call:turn", {
      callId: call.id,
      employeeName: employee.name,
      human: { text: stripCues(content) },
      ai: { text: stripCues(hit.response), raw: hit.response, cues, latencyMs: 0, source: "operator_script" },
      at: new Date().toISOString(),
    });
    return NextResponse.json({
      humanTurn: { id: humanTurn.id, ordinal: humanTurn.ordinal },
      aiTurn: {
        id: aiTurn.id,
        ordinal: aiTurn.ordinal,
        content: hit.response,
        cues,
        latencyMs: 0,
        interrupted: false,
        source: "operator_script",
        matchedRule: hit.match,
      },
    });
  }

  // Knowledge retrieval (same honest keyword engine as chat).
  const chunks = await db.knowledgeChunk.findMany({
    where: { source: { organizationId: user.organizationId, status: "indexed" } },
    select: { id: true, content: true },
  });
  const retrieved = retrieveChunks(content, chunks, 4);

  // History: previous turns (keep cues so the model sees its own emotion state).
  const history = await db.callTurn.findMany({
    where: { callId: call.id, speaker: { in: ["human", "ai"] } },
    orderBy: { ordinal: "asc" },
  });
  const trimmed = history.slice(-12).map((t) => ({
    role: (t.speaker === "ai" ? "assistant" : "user") as "assistant" | "user",
    content: t.content,
  }));

  // Pending mid-call coaching the operator typed while the AI was silent/listening.
  const coachLog: { at: string; text: string; mode: string; appliedOrdinal: number }[] = (() => {
    try {
      return JSON.parse(call.coachLog || "[]");
    } catch {
      return [];
    }
  })();
  const pending = coachLog.filter((c) => c.appliedOrdinal === -1 && c.mode === "instruct");

  const roleLabel = ROLE_TEMPLATES.find((t) => t.key === employee.role)?.label ?? employee.role;
  const systemPrompt =
    buildCallSystemPrompt({
      employeeName: employee.name,
      roleLabel,
      organizationName: user.organizationName,
      purpose: employee.purpose,
      personality: employee.personality,
      tone: employee.tone,
      instructions: employee.instructions,
      escalationRule: employee.escalationRule,
      knowledge: retrieved.map((r) => r.content),
      scriptRules: rules,
      callDirectives: call.callDirectives,
      coachNotes: pending.map((p) => p.text),
    }) + (bargeInNote ? `\n\n${bargeInNote}` : "");

  const started = Date.now();
  let aiContent: string | null = null;
  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, ...trimmed],
      thinking: { type: "disabled" },
    });
    aiContent = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error("Call LLM reply failed:", err);
  }

  if (!aiContent) {
    return NextResponse.json(
      {
        humanTurn: { id: humanTurn.id, ordinal: humanTurn.ordinal },
        error: "The AI service did not respond. Your words were saved: say it again or end the call.",
      },
      { status: 200 },
    );
  }

  // Trim reply to something speakable: 2 paragraphs max, cut markdown artifacts.
  const clean = aiContent
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim()
    .split(/\n{2,}/)[0]
    .trim();

  const latencyMs = Date.now() - started;
  const cues = extractCues(clean);

  const aiTurn = await db.callTurn.create({
    data: {
      callId: call.id,
      ordinal: lastOrdinal + 2,
      speaker: "ai",
      content: clean,
      cues: JSON.stringify(cues),
      latencyMs,
      source: "llm",
    },
  });

  // Mark pending coach directives as consumed by this reply.
  if (pending.length > 0) {
    const updatedLog = coachLog.map((c) =>
      c.appliedOrdinal === -1 && c.mode === "instruct" ? { ...c, appliedOrdinal: aiTurn.ordinal } : c,
    );
    await db.callSession.update({ where: { id: call.id }, data: { coachLog: JSON.stringify(updatedLog) } });
  }

  await refreshCallAggregates(call.id, employee.name);

  await emitRealtime("call:turn", {
    callId: call.id,
    employeeName: employee.name,
    human: { text: stripCues(content) },
    ai: { text: stripCues(clean), raw: clean, cues, latencyMs, source: "llm" },
    at: new Date().toISOString(),
  });

  return NextResponse.json({
    humanTurn: { id: humanTurn.id, ordinal: humanTurn.ordinal },
    aiTurn: {
      id: aiTurn.id,
      ordinal: aiTurn.ordinal,
      content: clean,
      cues,
      latencyMs,
      interrupted: false,
      source: "llm",
    },
  });
}
