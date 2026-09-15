import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, audit, usage } from "@/lib/server/auth";
import { getSiteSettings } from "@/lib/server/site";
import { emitRealtime } from "@/lib/server/events";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  organizationName: z.string().min(1).max(120),
  organizationType: z.enum(["individual", "business", "agency"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid name, email, organization name, and a password of at least 8 characters." },
      { status: 400 },
    );
  }
  const { name, email, password, organizationName, organizationType } = parsed.data;
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const settings = await getSiteSettings();
  const requireApproval = settings.flagRequireApproval;

  const org = await db.organization.create({
    data: { name: organizationName, type: organizationType },
  });
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password),
      role: "user",
      // Real approval queue: pending until an admin approves. Honest and visible.
      status: requireApproval ? "pending" : "active",
      approvedAt: requireApproval ? null : new Date(),
      memberships: { create: { organizationId: org.id, role: "owner" } },
    },
  });
  await createSession(user.id);
  await audit({ userId: user.id, orgId: org.id, actor: "user", action: "auth.signup", target: user.email });
  await usage(org.id, "auth", "signup");
  await emitRealtime("user:created", {
    userId: user.id,
    name,
    email: user.email,
    orgName: organizationName,
    orgType: organizationType,
    at: new Date().toISOString(),
  });
  const membership = await db.membership.findFirst({ where: { userId: user.id } });
  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership?.role,
      accountRole: user.role,
      status: user.status,
      statusReason: user.statusReason,
      organizationId: org.id,
      organizationName: org.name,
      organizationType: org.type,
    },
  });
}
