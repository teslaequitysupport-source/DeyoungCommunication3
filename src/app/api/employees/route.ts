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

const createSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(60),
  purpose: z.string().max(600).default(""),
  personality: z.string().max(120).default("professional"),
  tone: z.string().max(120).default("warm-professional"),
  instructions: z.string().max(4000).default(""),
  escalationRule: z.string().max(120).default("request_human_on_low_confidence"),
  channels: z.array(z.string()).default(["web_chat"]),
  language: z.string().default("en"),
  scriptRules: z.array(scriptRuleShape).max(50).default([]),
  voiceProfile: voiceProfileShape.default({ cloneId: "", name: "", voiceUri: "", pitch: 1, rate: 1 }),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const employees = await db.aiEmployee.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { conversations: true } } },
  });
  return NextResponse.json({
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      purpose: e.purpose,
      personality: e.personality,
      tone: e.tone,
      instructions: e.instructions,
      escalationRule: e.escalationRule,
      channels: JSON.parse(e.channels || "[]"),
      language: e.language,
      scriptRules: JSON.parse(e.scriptRules || "[]"),
      voiceProfile: JSON.parse(e.voiceProfile || "{}"),
      status: e.status,
      configVersion: e.configVersion,
      createdAt: e.createdAt.toISOString(),
      conversationCount: e._count.conversations,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot create AI employees." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Give your AI employee a name and a role." }, { status: 400 });
  }
  const data = parsed.data;
  // The voice profile must point at a clone this org actually owns.
  let voiceProfileJson = "{}";
  if (data.voiceProfile.cloneId) {
    const clone = await db.voiceClone.findFirst({
      where: { id: data.voiceProfile.cloneId, organizationId: user.organizationId },
    });
    if (clone) voiceProfileJson = JSON.stringify(data.voiceProfile);
  }
  const employee = await db.aiEmployee.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      role: data.role,
      purpose: data.purpose,
      personality: data.personality,
      tone: data.tone,
      instructions: data.instructions,
      escalationRule: data.escalationRule,
      channels: JSON.stringify(data.channels),
      language: data.language,
      scriptRules: JSON.stringify(data.scriptRules),
      voiceProfile: voiceProfileJson,
      status: "draft",
    },
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "employee.created",
    target: employee.id,
    reason: data.name,
  });
  await usage(user.organizationId, "employee_created", data.name);
  return NextResponse.json({ id: employee.id });
}
