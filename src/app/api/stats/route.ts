import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public platform telemetry: real counts only. Zero until real work happens here. */
export async function GET() {
  const [users, organizations, employees, conversations, messages, calls, callTurns] =
    await Promise.all([
      db.user.count({ where: { status: "active" } }),
      db.organization.count(),
      db.aiEmployee.count(),
      db.conversation.count(),
      db.message.count(),
      db.callSession.count(),
      db.callTurn.count(),
    ]);
  return NextResponse.json({
    stats: { users, organizations, employees, conversations, messages, calls, callTurns },
  });
}
