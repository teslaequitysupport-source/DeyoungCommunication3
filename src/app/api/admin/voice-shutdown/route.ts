import { NextRequest, NextResponse } from "next/server";
import { getVoiceEngine, ttsConfigured } from "@/lib/server/voice-engine-config";
import { requireAdmin, audit } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/**
 * Admin action: THE OFF SWITCH for the self-hosted voice worker.
 * Accepts optional {ttsUrl, ttsKey} overrides (unsaved form values).
 * Calls the worker's POST /shutdown endpoint: the worker process powers off
 * so it stops consuming the machine (or Kaggle quota) it runs on. The site
 * itself keeps working: calls fall back to the built-in browser voice.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const saved = await getVoiceEngine();
  const overrides = (await req.json().catch(() => ({}))) as { ttsUrl?: string; ttsKey?: string };
  const cfg = {
    ...saved,
    ttsUrl: (overrides.ttsUrl ?? saved.ttsUrl).trim(),
    ttsKey: (overrides.ttsKey ?? saved.ttsKey).trim(),
  };
  if (!ttsConfigured(cfg)) {
    return NextResponse.json({
      ok: false,
      reason: "No worker URL configured. Nothing to shut down.",
    });
  }
  const base = cfg.ttsUrl.match(/^(https?:\/\/[^/]+)/i)?.[1];
  if (!base) {
    return NextResponse.json({ ok: false, reason: "The TTS URL is not a valid http(s) address." });
  }

  try {
    const res = await fetch(`${base}/shutdown`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.ttsKey ? { Authorization: `Bearer ${cfg.ttsKey}` } : {}),
      },
      signal: AbortSignal.timeout(8_000),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; bye?: string };
    await audit({ userId: guard.user.userId, actor: "admin", action: "admin.voice.shutdown", target: base });
    if (res.ok && body.ok !== false) {
      return NextResponse.json({
        ok: true,
        message: "Worker powered off. The site now uses the browser voice engine. Start the worker again whenever you need it.",
      });
    }
    return NextResponse.json({ ok: false, reason: `Worker responded ${res.status}.` });
  } catch {
    return NextResponse.json({
      ok: false,
      reason: "Worker unreachable: it is already off or asleep (no harm done).",
    });
  }
}
