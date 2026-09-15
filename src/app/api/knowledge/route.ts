import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, audit, usage } from "@/lib/server/auth";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["txt", "manual", "faq", "url", "pdf", "docx"]),
  title: z.string().min(1).max(160),
  content: z.string().max(100000).optional(),
});

function chunkText(text: string, size = 700): string[] {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > size && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const sources = await db.knowledgeSource.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
  return NextResponse.json({
    sources: sources.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      status: s.status,
      statusDetail: s.statusDetail,
      version: s.version,
      chunkCount: s._count.chunks,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "viewer") {
    return NextResponse.json({ error: "Viewers cannot add knowledge." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Give the source a title." }, { status: 400 });
  }
  const { type, title } = parsed.data;

  // File types (pdf/docx) require the document parser in the knowledge worker (Phase 1).
  // Honest status until that ships: needs_configuration.
  if (type === "pdf" || type === "docx") {
    const source = await db.knowledgeSource.create({
      data: {
        organizationId: user.organizationId,
        type,
        title,
        status: "needs_configuration",
        statusDetail:
          "Document parsing requires the knowledge worker (Phase 1). Add the same content as a text or manual source to index it now.",
      },
    });
    await audit({
      userId: user.userId,
      orgId: user.organizationId,
      actor: "user",
      action: "knowledge.created",
      target: source.id,
      reason: `${type}:${title}`,
    });
    return NextResponse.json({ id: source.id, status: source.status });
  }

  if (type === "url") {
    const source = await db.knowledgeSource.create({
      data: {
        organizationId: user.organizationId,
        type,
        title,
        status: "needs_configuration",
        statusDetail: "Website crawling requires the knowledge worker (Phase 1). Paste page content as a manual source to index it now.",
      },
    });
    return NextResponse.json({ id: source.id, status: source.status });
  }

  const content = (parsed.data.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "Add the text content to index." }, { status: 400 });
  }
  const chunks = chunkText(content);
  const source = await db.knowledgeSource.create({
    data: {
      organizationId: user.organizationId,
      type,
      title,
      content,
      status: "indexed",
      statusDetail: `Indexed for keyword retrieval. ${chunks.length} chunk${chunks.length === 1 ? "" : "s"}. Vector embeddings arrive with the knowledge worker.`,
    },
  });
  await db.knowledgeChunk.createMany({
    data: chunks.map((c, i) => ({ sourceId: source.id, ordinal: i, content: c })),
  });
  await audit({
    userId: user.userId,
    orgId: user.organizationId,
    actor: "user",
    action: "knowledge.created",
    target: source.id,
    reason: `${type}:${title}`,
  });
  await usage(user.organizationId, "knowledge_indexed", title, chunks.length);
  return NextResponse.json({ id: source.id, status: "indexed", chunkCount: chunks.length });
}
