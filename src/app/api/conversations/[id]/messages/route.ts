import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, usage, retrieveChunks } from "@/lib/server/auth";
import { ROLE_TEMPLATES } from "@/lib/types";
import { z } from "zod";

const postSchema = z.object({
  role: z.enum(["customer", "human"]),
  content: z.string().min(1).max(4000),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await db.conversation.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    conversation: {
      id: conversation.id,
      channel: conversation.channel,
      status: conversation.status,
      employeeId: conversation.employeeId,
    },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      speakerName: m.speakerName,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

function buildSystemPrompt(input: {
  employeeName: string;
  roleLabel: string;
  organizationName: string;
  purpose: string;
  personality: string;
  tone: string;
  instructions: string;
  escalationRule: string;
  knowledge: string[];
}): string {
  const parts: string[] = [];
  parts.push(
    `You are ${input.employeeName}, the ${input.roleLabel} for ${input.organizationName}. You are talking to a customer over web chat.`,
  );
  if (input.purpose) parts.push(`Your job: ${input.purpose}`);
  parts.push(`Personality: ${input.personality}. Tone: ${input.tone}.`);
  if (input.instructions) parts.push(`Instructions from your employer:\n${input.instructions}`);
  parts.push(
    [
      "Conversation rules you must always follow:",
      "- Be conversational and human. Short replies, usually one to three sentences. No filler, no corporate boilerplate.",
      "- Answer strictly from the approved knowledge below when it is provided. Never invent prices, policies, availability, or facts.",
      "- If you do not know something or the knowledge is not connected, say so plainly and offer to have a human follow up.",
      "- If someone asks whether you are an AI, answer honestly.",
      `- Escalation policy: ${input.escalationRule}. When escalating, reassure the customer and summarize what you will pass on.`,
    ].join("\n"),
  );
  if (input.knowledge.length > 0) {
    parts.push(
      "Approved business knowledge:\n" +
        input.knowledge.map((k, i) => `[${i + 1}] ${k}`).join("\n"),
    );
  } else {
    parts.push(
      "Approved business knowledge: none has been connected yet. Answer general questions honestly and offer human follow-up for anything specific about the business.",
    );
  }
  return parts.join("\n\n");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await db.conversation.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { employee: true, customer: true },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.status !== "open") {
    return NextResponse.json({ error: "This conversation is closed." }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  const { role, content } = parsed.data;
  const humanMessage = await db.message.create({
    data: {
      conversationId: id,
      role,
      content,
      speakerName: role === "human" ? (user.name ?? user.email) : (conversation.customer?.name ?? "Customer"),
    },
  });
  await db.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  // If a human team member took over, do not generate an AI reply.
  if (role === "human") {
    return NextResponse.json({ humanMessage: { id: humanMessage.id, createdAt: humanMessage.createdAt.toISOString() } });
  }

  const employee = conversation.employee;
  if (!employee) {
    const sys = await db.message.create({
      data: {
        conversationId: id,
        role: "system",
        content: "No AI employee is assigned to this conversation.",
      },
    });
    return NextResponse.json({
      systemMessage: { id: sys.id, content: sys.content, createdAt: sys.createdAt.toISOString() },
    });
  }

  // Assemble context: employee config + knowledge retrieval + history.
  const chunks = await db.knowledgeChunk.findMany({
    where: { source: { organizationId: user.organizationId, status: "indexed" } },
    select: { id: true, content: true },
  });
  const retrieved = retrieveChunks(content, chunks, 4);

  const history = await db.message.findMany({
    where: { conversationId: id, role: { in: ["customer", "ai", "human"] } },
    orderBy: { createdAt: "asc" },
  });
  const trimmed = history.slice(-12).map((m) => ({
    role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
    content: m.content,
  }));

  const roleLabel =
    ROLE_TEMPLATES.find((t) => t.key === employee.role)?.label ?? employee.role;

  const systemPrompt = buildSystemPrompt({
    employeeName: employee.name,
    roleLabel,
    organizationName: user.organizationName,
    purpose: employee.purpose,
    personality: employee.personality,
    tone: employee.tone,
    instructions: employee.instructions,
    escalationRule: employee.escalationRule,
    knowledge: retrieved.map((r) => r.content),
  });

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
    console.error("LLM reply failed:", err);
  }

  if (!aiContent) {
    const sys = await db.message.create({
      data: {
        conversationId: id,
        role: "system",
        content:
          "The AI service did not respond. Your message was saved. You can resend it or take over the conversation.",
      },
    });
    return NextResponse.json(
      {
        systemMessage: { id: sys.id, content: sys.content, createdAt: sys.createdAt.toISOString() },
      },
      { status: 200 },
    );
  }

  const aiMessage = await db.message.create({
    data: {
      conversationId: id,
      role: "ai",
      content: aiContent,
      speakerName: employee.name,
    },
  });
  await db.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });
  await usage(user.organizationId, "message_ai", employee.name);
  await usage(user.organizationId, "message_ai", "knowledge_chunks_used", retrieved.length);

  return NextResponse.json({
    aiMessage: {
      id: aiMessage.id,
      role: "ai",
      content: aiMessage.content,
      speakerName: aiMessage.speakerName,
      createdAt: aiMessage.createdAt.toISOString(),
    },
  });
}
