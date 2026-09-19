import { NextRequest, NextResponse } from "next/server";
import { getVoiceEngine, ttsConfigured, type VoiceEngineConfig } from "@/lib/server/voice-engine-config";
import { requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** Derive the worker root (scheme + host + port) from any API URL. */
function workerBase(url: string): string | null {
  const m = url.match(/^(https?:\/\/[^/]+)/i);
  return m ? m[1] : null;
}

/**
 * Admin action: real end-to-end test of the self-hosted voice worker.
 * Accepts optional overrides (ttsUrl/ttsKey/ttsModel/ttsVoice) so the admin
 * can test the values typed into the form before saving them.
 * 1) GET  {base}/health   -> engine, device, voices, idle countdown
 * 2) POST {ttsUrl}        -> synthesize a short line, measure the round trip
 * Nothing is faked: if the worker is off, asleep, or wrong, the response says so.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const overrides = (await req.json().catch(() => ({}))) as Partial<VoiceEngineConfig>;
  const saved = await getVoiceEngine();
  const cfg: VoiceEngineConfig = {
    ...saved,
    ttsUrl: (overrides.ttsUrl ?? saved.ttsUrl).trim(),
    ttsKey: (overrides.ttsKey ?? saved.ttsKey).trim(),
    ttsModel: (overrides.ttsModel ?? saved.ttsModel).trim(),
    ttsVoice: (overrides.ttsVoice ?? saved.ttsVoice).trim(),
  };
  if (!ttsConfigured(cfg)) {
    return NextResponse.json({
      online: false,
      reason: "Self-hosted mode is off or the TTS URL is empty.",
    });
  }
  const base = workerBase(cfg.ttsUrl);
  if (!base) {
    return NextResponse.json({ online: false, reason: "The TTS URL is not a valid http(s) address." });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.ttsKey) headers.Authorization = `Bearer ${cfg.ttsKey}`;

  // 1) health
  let health: Record<string, unknown> | null = null;
  let healthMs: number | null = null;
  try {
    const t0 = Date.now();
    const res = await fetch(`${base}/health`, { headers, signal: AbortSignal.timeout(30_000) });
    healthMs = Date.now() - t0;
    if (res.ok) health = (await res.json()) as Record<string, unknown>;
  } catch {
    /* worker asleep or unreachable: reported below */
  }

  // 1b) STT server reachability (the full path runs from the browser in calls)
  const stt: { configured: boolean; reachable?: boolean; error?: string } = {
    configured: /^https?:\/\//.test(cfg.sttUrl ?? ""),
  };
  if (stt.configured) {
    try {
      const res = await fetch(cfg.sttUrl, {
        method: "OPTIONS",
        signal: AbortSignal.timeout(8_000),
      });
      stt.reachable = res.status < 500;
    } catch {
      stt.reachable = false;
      stt.error = "no answer (off, asleep, or wrong URL)";
    }
  }

  // 2) real synthesis round trip
  let synthMs: number | null = null;
  let synthBytes = 0;
  let synthOk = false;
  try {
    const t0 = Date.now();
    const res = await fetch(cfg.ttsUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: cfg.ttsModel || "kokoro",
        input: "The worker is connected.",
        voice: cfg.ttsVoice || "af_sky",
        speed: 1,
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      synthBytes = buf.byteLength;
      synthOk = buf.byteLength > 1000;
    }
    synthMs = Date.now() - t0;
  } catch {
    /* reported below */
  }

  if (!health && !synthOk) {
    return NextResponse.json({
      online: false,
      reason:
        "Worker unreachable. It is either off (that is fine, the off switch saves it for you), " +
        "asleep, or the URL/token is wrong. Free workers sleep when idle; start it again and retest.",
    });
  }

  return NextResponse.json({
    online: true,
    health,
    healthMs,
    synthOk,
    synthMs,
    synthBytes,
    stt,
  });
}
