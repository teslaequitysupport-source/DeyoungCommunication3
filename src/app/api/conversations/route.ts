import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit, usage } from "@/lib/server/auth";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string().min(1),
  customerName: z.string().min(1).max(80).default("Website visitor"),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const conversations = await db.conversation.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      employee: { select: { name: true } },
      customer: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      employeeId: c.employeeId,
      employeeName: c.employee?.name ?? null,
      customerName: c.customer?.name ?? null,
      lastMessageAt: c.lastMessageAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      messageCount: c._count.messages,
      lastPreview: c.messages[0]?.content?.slice(0, 120) ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select an AI employee to start a conversation." }, { status: 400 });
  }
  const employee = await db.aiEmployee.findFirst({
    where: { id: parsed.data.employeeId, organizationId: user.organizationId },
  });
  if (!employee) return NextResponse.json({ error: "AI employee not found" }, { status: 404 });
  if (employee.status !== "deployed") {
    return NextResponse.json(
      { error: "This AI employee is not deployed yet. Deploy it first." },
      { status: 400 },
    );
  }
  const customer = await db.customer.create({
    data: {
      organizationId: user.organizationId,
      name: parsed.data.customerName,
    },
  });
  const conversation = await db.conversation.create({
    data: {
      organizationId: user.organizationId,
      employeeId: employee.id,
      customerId: customer.id,
      channel: "web_chat",
    },
  });
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "system",
      content: `Conversation started on web chat with AI employee ${employee.name} (${employee.role}).`,
    },
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "conversation.created",
    target: conversation.id,
    reason: employee.name,
  });
  await usage(user.organizationId, "conversation_created", employee.name);
  return NextResponse.json({ id: conversation.id });
}
