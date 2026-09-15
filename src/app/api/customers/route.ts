import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const customers = await db.customer.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { conversations: true } } },
  });
  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      tags: JSON.parse(c.tags || "[]"),
      consentStatus: c.consentStatus,
      conversationCount: c._count.conversations,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
