import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "dy_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  if (test.length !== ref.length) return false;
  return timingSafeEqual(test, ref);
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await db.sessionToken.create({
    data: { token: tokenHash(token), userId, expiresAt: expires },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.sessionToken.deleteMany({ where: { token: tokenHash(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.sessionToken.findUnique({
    where: { token: tokenHash(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: { organization: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.sessionToken.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  // Blocked and rejected accounts are logged out on the spot (sessions are also
  // destroyed at block time, but this is the belt-and-braces check).
  if (u.status === "blocked" || u.status === "rejected") {
    await db.sessionToken.delete({ where: { id: session.id } }).catch(() => {});
    jar.delete(SESSION_COOKIE);
    return null;
  }
  // Pending users keep their session: the app shows the honest awaiting-activation gate.
  const membership = u.memberships[0];
  if (!membership) return null;
  return {
    userId: u.id,
    email: u.email,
    name: u.name,
    role: membership.role as SessionUser["role"],
    accountRole: u.role as SessionUser["accountRole"],
    status: u.status as SessionUser["status"],
    plan: (u.plan as SessionUser["plan"]) ?? "starter",
    statusReason: u.statusReason,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationType: membership.organization.type as SessionUser["organizationType"],
  };
}

/** Server-side guard for /api/admin/*: rejects non-admins without leaking data. */
export async function requireAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401, error: "Sign in required" };
  if (user.accountRole !== "admin") return { ok: false, status: 403, error: "Admin access required" };
  return { ok: true, user };
}

export async function audit(input: {
  userId?: string | null;
  orgId?: string | null;
  actor?: string;
  action: string;
  target?: string;
  reason?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      orgId: input.orgId ?? null,
      actor: input.actor ?? "system",
      action: input.action,
      target: input.target ?? "",
      reason: input.reason ?? "",
      ip: "",
    },
  });
}

export async function usage(orgId: string, kind: string, detail = "", units = 1) {
  await db.usageEvent.create({
    data: { organizationId: orgId, kind, units, detail },
  });
}

/** Keyword-scored retrieval over knowledge chunks. Vector embeddings ship with the knowledge worker (Phase 1). */
export function retrieveChunks(
  query: string,
  chunks: { id: string; content: string }[],
  topK = 4,
): { id: string; content: string }[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [];
  const scored = chunks.map((c) => {
    const lower = c.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      let idx = lower.indexOf(t);
      while (idx !== -1) {
        score += 1;
        idx = lower.indexOf(t, idx + t.length);
      }
    }
    return { c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.c);
}
