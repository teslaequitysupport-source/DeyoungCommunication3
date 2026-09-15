import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  company: z.string().max(120).default(""),
  message: z.string().min(10).max(4000),
  topic: z.enum(["general", "sales", "support", "security"]).default("general"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your name, email, and a message of at least 10 characters." },
      { status: 400 },
    );
  }
  const inquiry = await db.contactInquiry.create({ data: parsed.data });
  await emitRealtime("contact:new", {
    id: inquiry.id,
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    preview: parsed.data.message.slice(0, 90),
    at: inquiry.createdAt.toISOString(),
  });
  return NextResponse.json({ ok: true });
}

