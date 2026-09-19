import { NextResponse } from "next/server";
import { getVoiceEngine, publicVoiceEngine } from "@/lib/server/voice-engine-config";

export const dynamic = "force-dynamic";

/** Public voice-engine status. Keys never leave the server. */
export async function GET() {
  try {
    const cfg = await getVoiceEngine();
    return NextResponse.json(publicVoiceEngine(cfg), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ mode: "browser", ttsConfigured: false, sttConfigured: false });
  }
}
