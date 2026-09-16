import { db } from "@/lib/db";
import { audit } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";

/**
 * Real automation engine: trigger -> action -> logged run.
 * Triggers fire from actual platform events. Actions are real work:
 *  - draft_followup: the LLM drafts a follow-up message from the transcript,
 *    stored on the run so the operator can copy it and send it.
 *  - notify_admin: realtime event + audit-log entry for the owner.
 * Every run (success or failure) is recorded in AutomationRun.
 */

export type AutomationTrigger = "call_ended" | "conversation_closed" | "lead_created";
export type AutomationAction = "draft_followup" | "notify_admin";

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  call_ended: "Call ends",
  conversation_closed: "Conversation closes",
  lead_created: "New contact inquiry",
};

export const ACTION_LABELS: Record<AutomationAction, string> = {
  draft_followup: "Draft a follow-up message (AI)",
  notify_admin: "Notify the owner instantly",
};

async function draftFollowup(input: {
  context: string; // transcript or conversation excerpt
  meta: string; // one-line metadata (duration, name, topic)
}): Promise<string> {
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You draft short, warm, professional follow-up messages for a business after a customer interaction. Use the interaction record below. Two to four sentences. Reference one concrete detail from the conversation. No emoji, no stage directions, no placeholders the operator must fill beyond [name].",
      },
      { role: "user", content: `Interaction record:\n${input.context}\n\nMetadata: ${input.meta}` },
    ],
    thinking: { type: "disabled" },
  });
  return (completion.choices[0]?.message?.content ?? "").trim();
}

/** Execute all enabled rules for a trigger. Never throws: failures are logged as runs. */
export async function runAutomations(
  trigger: AutomationTrigger,
  org: { id: string; name: string },
  payload: { context: string; meta: string; actorUserId?: string },
): Promise<void> {
  let rules;
  try {
    rules = await db.automationRule.findMany({
      where: { organizationId: org.id, trigger, enabled: true },
    });
  } catch {
    return;
  }
  if (rules.length === 0) return;

  for (const rule of rules) {
    let status = "ok";
    let detail = "";
    try {
      if (rule.action === "draft_followup") {
        const draft = await draftFollowup({ context: payload.context.slice(0, 6000), meta: payload.meta });
        if (!draft) {
          status = "failed";
          detail = "The drafting model returned nothing. The run is logged; nothing was sent.";
        } else {
          detail = draft.slice(0, 2000);
        }
      } else {
        await emitRealtime("call:coached", {
          automation: rule.name,
          trigger,
          meta: payload.meta,
          at: new Date().toISOString(),
        });
        await audit({
          userId: payload.actorUserId,
          orgId: org.id,
          actor: "system",
          action: `automation.notify:${trigger}`,
          target: rule.name,
          reason: payload.meta.slice(0, 200),
        });
        detail = `Owner notified: ${payload.meta.slice(0, 300)}`;
      }
    } catch (err) {
      status = "failed";
      detail = `Run failed: ${String(err).slice(0, 400)}`;
    }
    try {
      await db.automationRun.create({
        data: {
          ruleId: rule.id,
          orgId: org.id,
          trigger,
          status,
          detail,
        },
      });
      await db.automationRule.update({
        where: { id: rule.id },
        data: { runCount: { increment: 1 } },
      });
    } catch {
      /* the run log must never break the caller */
    }
  }
}
