import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit, usage } from "@/lib/server/auth";
import { z } from "zod";

const scriptRuleShape = z.object({
  id: z.string().min(1).max(60),
  match: z.string().min(1).max(300),
  matchType: z.enum(["contains", "exact"]).default("contains"),
  response: z.string().min(1).max(2000),
  priority: z.number().int().min(0).max(99).default(0),
  enabled: z.boolean().default(true),
});

const voiceProfileShape = z.object({
  cloneId: z.string().max(60).default(""),
  name: z.string().max(80).default(""),
  voiceUri: z.string().max(200).default(""),
  pitch: z.number().min(0.4).max(1.9).default(1),
  rate: z.number().min(0.5).max(1.8).default(1),
});

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: z.string().min(1).max(60).optional(),
  purpose: z.string().max(600).optional(),
  personality: z.string().max(120).optional(),
  tone: z.string().max(120).optional(),
  instructions: z.string().max(4000).optional(),
  escalationRule: z.string().max(120).optional(),
  channels: z.array(z.string()).optional(),
  language: z.string().optional(),
  status: z.enum(["draft", "deployed", "paused"]).optional(),
  scriptRules: z.array(scriptRuleShape).max(50).optional(),
  voiceProfile: voiceProfileShape.optional(),
});

async function findEmployee(id: string, orgId: string) {
  return db.aiEmployee.findFirst({ where: { id, organizationId: orgId } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot edit AI employees." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const employee = await findEmployee(id, user.organizationId);
  if (!employee) return NextResponse.json({ error: "AI employee not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const data = parsed.data;
  // A voice profile is only accepted when it points at an org-owned clone.
  let voiceProfileValue: string | undefined;
  if (data.voiceProfile !== undefined) {
    if (data.voiceProfile.cloneId) {
      const clone = await db.voiceClone.findFirst({
        where: { id: data.voiceProfile.cloneId, organizationId: user.organizationId },
      });
      voiceProfileValue = clone ? JSON.stringify(data.voiceProfile) : "{}";
    } else {
      voiceProfileValue = "{}";
    }
  }
  const updated = await db.aiEmployee.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
      ...(data.personality !== undefined ? { personality: data.personality } : {}),
      ...(data.tone !== undefined ? { tone: data.tone } : {}),
      ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
      ...(data.escalationRule !== undefined ? { escalationRule: data.escalationRule } : {}),
      ...(data.channels !== undefined ? { channels: JSON.stringify(data.channels) } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.scriptRules !== undefined ? { scriptRules: JSON.stringify(data.scriptRules) } : {}),
      ...(voiceProfileValue !== undefined ? { voiceProfile: voiceProfileValue } : {}),
      configVersion: employee.configVersion + 1,
    },
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: data.status === "deployed" ? "employee.deployed" : "employee.updated",
    target: id,
    reason: updated.name,
  });
  if (data.status === "deployed") {
    await usage(user.organizationId, "employee_deployed", updated.name);
  }
  return NextResponse.json({ id: updated.id, status: updated.status, configVersion: updated.configVersion });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can delete AI employees." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const employee = await findEmployee(id, user.organizationId);
  if (!employee) return NextResponse.json({ error: "AI employee not found" }, { status: 404 });
  await db.aiEmployee.delete({ where: { id } });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "employee.deleted",
    target: id,
    reason: employee.name,
  });
  return NextResponse.json({ ok: true });
}
