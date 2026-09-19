import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { z } from "zod";

/**
 * Automation rules CRUD + run log. Rules fire on real platform events
 * (see src/lib/server/automations.ts).
 */

const TRIGGERS = ["call_ended", "conversation_closed", "lead_created"] as const;
const ACTIONS = ["draft_followup", "notify_admin"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(120),
  trigger: z.enum(TRIGGERS),
  action: z.enum(ACTIONS),
});

const patchSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  remove: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const [rules, runs] = await Promise.all([
    db.automationRule.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    db.automationRun.findMany({
      where: { orgId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);
  return NextResponse.json({
    rules: rules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      action: r.action,
      enabled: r.enabled,
      runCount: r.runCount,
      createdAt: r.createdAt.toISOString(),
    })),
    runs: runs.map((r) => ({
      id: r.id,
      ruleId: r.ruleId,
      trigger: r.trigger,
      status: r.status,
      detail: r.detail,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot manage automations." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a rule name, trigger, and action." }, { status: 400 });
  }
  const rule = await db.automationRule.create({
    data: {
      organizationId: user.organizationId,
      name: parsed.data.name,
      trigger: parsed.data.trigger,
      action: parsed.data.action,
    },
  });
  return NextResponse.json({
    rule: {
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      action: rule.action,
      enabled: rule.enabled,
      runCount: rule.runCount,
      createdAt: rule.createdAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot manage automations." }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const existing = await db.automationRule.findFirst({
    where: { id: parsed.data.id, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  if (parsed.data.remove) {
    await db.automationRule.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, removed: true });
  }
  const updated = await db.automationRule.update({
    where: { id: existing.id },
    data: parsed.data.enabled === undefined ? {} : { enabled: parsed.data.enabled },
  });
  return NextResponse.json({
    rule: {
      id: updated.id,
      name: updated.name,
      trigger: updated.trigger,
      action: updated.action,
      enabled: updated.enabled,
      runCount: updated.runCount,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
