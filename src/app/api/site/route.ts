import { NextResponse } from "next/server";
import { getSiteSettings, getContentMap } from "@/lib/server/site";

export const dynamic = "force-dynamic";

/** Public site config: settings + visible content blocks only. Hidden blocks never leave the server. */
export async function GET() {
  const [settings, content] = await Promise.all([getSiteSettings(), getContentMap()]);
  return NextResponse.json({ settings, content });
}
