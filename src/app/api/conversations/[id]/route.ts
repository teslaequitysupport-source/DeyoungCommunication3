import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit } from "@/lib/server/auth";
import { runAutomations } from "@/lib/server/automations";
import { z } from "zod";

const patchSchema = z.object({ status: z.enum(["open", "closed"]) });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await db.conversation.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await db.conversation.update({ where: { id }, data: { status: parsed.data.status } });
  if (parsed.data.status === "closed") {
    await db.message.create({
      data: {
        conversationId: id,
        role: "system",
        content: "Conversation closed by the team.",
      },
    });
    await audit({
      userId: user.userId,
      orgId: user.organizationId,
      actor: "user",
      action: "conversation.closed",
      target: id,
    });
    // Fire automation rules on this real event, with the conversation excerpt.
    try {
      const recent = await db.message.findMany({
        where: { conversationId: id, role: { in: ["customer", "ai"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
      });
      const excerpt = recent
        .reverse()
        .map((m) => `${m.role === "customer" ? "CUSTOMER" : (m.speakerName ?? "AI")}: ${m.content}`)
        .join("\n");
      await runAutomations(
        "conversation_closed",
        { id: user.organizationId, name: user.organizationName },
        {
          context: excerpt || "(empty conversation)",
          meta: `web chat conversation closed`,
          actorUserId: user.userId,
        },
      );
    } catch {
      /* automation failures are logged as runs; never block the close */
    }
  }
  return NextResponse.json({ ok: true, status: parsed.data.status });
}
