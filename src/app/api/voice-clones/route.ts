import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit, usage } from "@/lib/server/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Voice cloning, honestly built.
 * The browser measures the samples (pitch, pace, energy) and posts ONLY the
 * derived numeric profile. Raw audio never leaves the tab. The stored profile
 * drives synthesis in real calls (Timbre Match engine). A neural clone of the
 * exact timbre needs a heavy model: that slot stays labeled pending, never faked.
 */

const profileShape = z.object({
  medianPitchHz: z.number().min(40).max(500),
  rateMultiplier: z.number().min(0.5).max(1.8),
  pitchMultiplier: z.number().min(0.4).max(1.9),
  energy: z.number().min(0).max(1),
  register: z.enum(["low", "mid", "high"]),
  matchedVoiceUri: z.string().max(200).default(""),
});

const createSchema = z.object({
  name: z.string().min(1).max(80),
  consentName: z.string().min(2).max(120),
  sampleCount: z.number().int().min(1).max(50),
  totalMs: z.number().int().min(500).max(600000),
  profile: profileShape,
  notes: z.string().max(500).default(""),
});

/** GET: your organization's cloned voice profiles. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const clones = await db.voiceClone.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    clones: clones.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      engine: c.engine,
      sampleCount: c.sampleCount,
      totalMs: c.totalMs,
      profile: JSON.parse(c.profileJson || "{}"),
      consentName: c.consentName,
      consentAt: c.consentAt?.toISOString() ?? null,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

/** POST: store a derived voice profile. Consent is required and recorded. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot create cloned voices." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A voice needs a name, the consent holder's name, and at least one measured sample." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const clone = await db.voiceClone.create({
    data: {
      organizationId: user.organizationId,
      name: d.name,
      status: "ready",
      engine: "timbre_match",
      sampleCount: d.sampleCount,
      totalMs: d.totalMs,
      profileJson: JSON.stringify(d.profile),
      consentName: d.consentName,
      consentAt: new Date(),
      notes: d.notes,
    },
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "voice.clone_created",
    target: clone.id,
    reason: `${d.name} · ${d.sampleCount} sample(s) · consent: ${d.consentName}`,
  });
  await usage(user.organizationId, "voice_clone_created", d.name);
  return NextResponse.json({ id: clone.id });
}
