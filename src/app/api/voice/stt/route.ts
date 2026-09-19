import { NextRequest, NextResponse } from "next/server";
import { getVoiceEngine, sttConfigured } from "@/lib/server/voice-engine-config";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/**
 * Self-hosted STT proxy (OpenAI-compatible /v1/audio/transcriptions).
 * The browser sends one utterance of mic audio (webm/ogg); the server
 * forwards it to the operator's own Whisper-compatible server and returns
 * the recognized text. Barge-in and interim text stay on the Web Speech
 * fast path; this is the accuracy path for full utterances.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const cfg = await getVoiceEngine();
  if (!sttConfigured(cfg)) {
    return NextResponse.json({ error: "Self-hosted transcription is not configured." }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio clip too large." }, { status: 413 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, audio.name || "utterance.webm");
  upstreamForm.append("model", cfg.sttModel || "whisper-1");
  if (cfg.sttModel && !cfg.sttModel.startsWith("whisper")) {
    // Speaches/faster-whisper servers expect language hints too; harmless for OpenAI.
    upstreamForm.append("language", "en");
    upstreamForm.append("response_format", "json");
  }

  try {
    const res = await fetch(cfg.sttUrl, {
      method: "POST",
      headers: cfg.sttKey ? { Authorization: `Bearer ${cfg.sttKey}` } : undefined,
      body: upstreamForm,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      return NextResponse.json({ error: `Transcription server error (${res.status}).`, detail }, { status: 502 });
    }
    const data = (await res.json().catch(() => null)) as { text?: string } | null;
    return NextResponse.json({ text: (data?.text ?? "").trim() });
  } catch {
    return NextResponse.json({ error: "Transcription server unreachable." }, { status: 502 });
  }
}
