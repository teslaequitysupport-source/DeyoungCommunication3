import { NextRequest, NextResponse } from "next/server";
import { getVoiceEngine, ttsConfigured } from "@/lib/server/voice-engine-config";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/**
 * Self-hosted TTS proxy (OpenAI-compatible /v1/audio/speech).
 * The browser POSTs { text, voice?, speed? }; the server forwards to the
 * operator's own voice server and streams the audio straight back. This
 * keeps the server API key secret and sidesteps CORS on the voice server.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const cfg = await getVoiceEngine();
  if (!ttsConfigured(cfg)) {
    return NextResponse.json({ error: "Self-hosted voice is not configured." }, { status: 501 });
  }

  const body = (await req.json().catch(() => null)) as
    | { text?: string; voice?: string; speed?: number }
    | null;
  const text = (body?.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Nothing to speak." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Text too long." }, { status: 413 });

  const voice = (body?.voice ?? "").trim() || cfg.ttsVoice || "af_sky";
  const speed = Math.max(0.5, Math.min(2, Number(body?.speed) || 1));

  try {
    const started = Date.now();
    const upstream = await fetch(cfg.ttsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.ttsKey ? { Authorization: `Bearer ${cfg.ttsKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.ttsModel || "kokoro",
        input: text,
        voice,
        speed,
        response_format: "mp3",
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = (await upstream.text().catch(() => "")).slice(0, 300);
      return NextResponse.json(
        { error: `Voice server rejected the request (${upstream.status}).`, detail },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
        "X-Voice-Latency": String(Date.now() - started),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Voice server unreachable. Falling back to browser voice." },
      { status: 502 },
    );
  }
}
