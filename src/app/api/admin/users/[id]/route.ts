import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/server/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** PATCH: internal notes (admin-only) + detail read. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;

  const parsed = z.object({ internalNotes: z.string().max(2000) }).safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const user = await db.user.update({
    where: { id },
    data: { internalNotes: parsed.data.internalNotes },
  });
  await audit({
    userId: guard.user.userId,
    actor: "admin",
    action: "admin.user.note",
    target: user.email,
  });
  return NextResponse.json({ ok: true });
}
