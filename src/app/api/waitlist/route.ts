import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  platform: z.enum(["ios", "android"]).default("ios"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email, platform } = parsed.data;
  await db.waitlistEntry
    .create({ data: { email: email.toLowerCase(), platform } })
    .catch(() => {
      /* already on the list for this platform */
    });
  return NextResponse.json({ ok: true });
}
