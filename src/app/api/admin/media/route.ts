import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/server/auth";
import { emitRealtime } from "@/lib/server/events";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);

function extFor(mime: string): string | null {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/svg+xml": return "svg";
    case "image/avif": return "avif";
    default: return null;
  }
}

/** GET: media library. */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const assets = await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ assets });
}

/** POST: upload photos from any device (multipart/form-data, field "file"). */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file received. Choose a photo and try again." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type (${file.type}). Use JPG, PNG, WebP, GIF, SVG, or AVIF.` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is larger than 5 MB. Compress it and try again." }, { status: 400 });
  }

  const ext = extFor(file.type)!;
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  const asset = await db.mediaAsset.create({
    data: {
      filename: name,
      url: `/uploads/${name}`,
      mime: file.type,
      size: file.size,
      alt: (form?.get("alt") as string) || file.name.replace(/\.[^.]+$/, ""),
      uploadedById: guard.user.userId,
    },
  });
  await audit({ userId: guard.user.userId, actor: "admin", action: "admin.media.upload", target: asset.url });
  await emitRealtime("media:updated", { url: asset.url, filename: name, at: new Date().toISOString() });
  return NextResponse.json({ ok: true, asset });
}

/** DELETE: remove asset + file. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  await db.mediaAsset.delete({ where: { id } });
  await unlink(path.join(UPLOAD_DIR, asset.filename)).catch(() => {});
  await audit({ userId: guard.user.userId, actor: "admin", action: "admin.media.delete", target: asset.url });
  await emitRealtime("media:updated", { deleted: asset.url, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
