import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const blocks = await db.contentBlock.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ blocks });
}

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string().max(4000).optional(),
  visible: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const block = await db.contentBlock.update({
    where: { key: parsed.data.key },
    data: {
      ...(parsed.data.value !== undefined ? { value: parsed.data.value } : {}),
      ...(parsed.data.visible !== undefined ? { visible: parsed.data.visible } : {}),
    },
  });
  await audit({ userId: guard.user.userId, actor: "admin", action: "admin.content.update", target: block.key });
  await emitRealtime("content:updated", { key: block.key, visible: block.visible, at: new Date().toISOString() });
  return NextResponse.json({ ok: true, block });
}
