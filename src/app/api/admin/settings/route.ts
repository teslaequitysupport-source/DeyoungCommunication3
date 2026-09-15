import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const row = await db.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({ settings: row });
}

const settingsSchema = z.object({
  siteName: z.string().min(1).max(80).optional(),
  tagline: z.string().max(200).optional(),
  supportEmail: z.string().email().optional(),
  bannerEnabled: z.boolean().optional(),
  bannerText: z.string().max(300).optional(),
  bannerLabel: z.string().max(60).optional(),
  bannerHref: z.string().max(300).optional(),
  flagShowPricing: z.boolean().optional(),
  flagShowStats: z.boolean().optional(),
  flagShowTestimonials: z.boolean().optional(),
  flagShowVoiceDemo: z.boolean().optional(),
  flagRequireApproval: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });

  await db.siteSettings.upsert({
    where: { id: "site" },
    update: parsed.data,
    create: { id: "site", ...parsed.data },
  });
  await audit({ userId: guard.user.userId, actor: "admin", action: "admin.settings.update", target: "site" });
  await emitRealtime("settings:updated", { at: new Date().toISOString() });
  const row = await db.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({ ok: true, settings: row });
}
