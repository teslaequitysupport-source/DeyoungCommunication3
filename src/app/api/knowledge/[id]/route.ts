import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit } from "@/lib/server/auth";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot delete knowledge." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const source = await db.knowledgeSource.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  await db.knowledgeSource.delete({ where: { id } }); // chunks cascade
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "knowledge.deleted",
    target: id,
    reason: source.title,
  });
  return NextResponse.json({ ok: true });
}
