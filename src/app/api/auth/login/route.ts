import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, audit } from "@/lib/server/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: {
      memberships: { include: { organization: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  if (user.status === "blocked") {
    return NextResponse.json(
      { error: user.statusReason || "This account has been blocked by an administrator." },
      { status: 403 },
    );
  }
  if (user.status === "rejected") {
    return NextResponse.json(
      { error: user.statusReason || "This signup was not approved. Contact support for details." },
      { status: 403 },
    );
  }
  // pending + active may sign in. Pending sees the honest awaiting-activation screen.
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  const membership = user.memberships[0];
  await audit({ userId: user.id, orgId: membership?.organizationId, actor: "user", action: "auth.login", target: user.email });
  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership?.role,
      accountRole: user.role,
      status: user.status,
      statusReason: user.statusReason,
      organizationId: membership?.organizationId,
      organizationName: membership?.organization.name,
      organizationType: membership?.organization.type,
    },
  });
}
