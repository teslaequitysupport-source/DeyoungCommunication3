import { db } from "@/lib/db";
import { stripCues, summarizeCues } from "@/lib/emotion";

/* ---- Operator script rules: the employee must obey, verbatim, before any LLM ---- */

export interface ScriptRule {
  id: string;
  match: string;
  matchType: "contains" | "exact";
  response: string;
  priority: number;
  enabled: boolean;
}

export function parseScriptRules(raw: string): ScriptRule[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((r) => r && typeof r.match === "string" && typeof r.response === "string" && r.match && r.response)
      .map((r) => ({
        id: String(r.id ?? Math.random().toString(36).slice(2)),
        match: String(r.match),
        matchType: r.matchType === "exact" ? "exact" : "contains",
        response: String(r.response),
        priority: Number(r.priority ?? 0) || 0,
        enabled: r.enabled !== false,
      }));
  } catch {
    return [];
  }
}

/** First enabled rule whose match text appears in (or exactly equals) the utterance. */
export function matchScriptRule(rules: ScriptRule[], utterance: string): ScriptRule | null {
  const norm = utterance.trim().toLowerCase();
  if (!norm) return null;
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  for (const r of sorted) {
    if (!r.enabled) continue;
    const m = r.match.trim().toLowerCase();
    if (!m) continue;
    if (r.matchType === "exact" ? norm === m : norm.includes(m)) return r;
  }
  return null;
}

/* ---- Session aggregate refresh (used by turn + coach endpoints) ---- */

export async function refreshCallAggregates(callId: string, employeeName: string) {
  const all = await db.callTurn.findMany({
    where: { callId, speaker: { in: ["human", "ai"] } },
    select: { speaker: true, content: true, ordinal: true, source: true },
    orderBy: { ordinal: "asc" },
  });
  const transcript = all
    .map((t) =>
      t.speaker === "human"
        ? `CALLER: ${stripCues(t.content)}`
        : t.source === "operator_script"
          ? `${employeeName} (operator script, verbatim): ${stripCues(t.content)}`
          : t.source === "operator_injection"
            ? `${employeeName} (operator said this now): ${stripCues(t.content)}`
            : `${employeeName}: ${stripCues(t.content)}`,
    )
    .join("\n");
  const aiContents = all.filter((t) => t.speaker === "ai").map((t) => t.content);
  const last = all[all.length - 1];
  await db.callSession.update({
    where: { id: callId },
    data: {
      turnsCount: (last?.ordinal ?? 0) + 1,
      cuesSummary: JSON.stringify(summarizeCues(aiContents)),
      transcript: transcript.slice(0, 8000),
    },
  });
}
