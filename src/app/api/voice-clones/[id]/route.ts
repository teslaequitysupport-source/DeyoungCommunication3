import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** DELETE: remove a cloned voice profile and its consent record. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot delete cloned voices." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const clone = await db.voiceClone.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!clone) return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });

  // Employees pointing at this voice fall back to the engine default honestly.
  const employees = await db.aiEmployee.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, voiceProfile: true, name: true },
  });
  for (const e of employees) {
    try {
      const p = JSON.parse(e.voiceProfile || "{}");
      if (p?.cloneId === id) {
        await db.aiEmployee.update({ where: { id: e.id }, data: { voiceProfile: "{}" } });
      }
    } catch {
      /* malformed profile: leave as is */
    }
  }

  await db.voiceClone.delete({ where: { id } });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "voice.clone_deleted",
    target: id,
    reason: clone.name,
  });
  return NextResponse.json({ ok: true });
}
