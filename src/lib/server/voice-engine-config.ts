import { db } from "@/lib/db";

/**
 * Self-hosted voice engine config (stored in SiteSettings.voiceEngineJson).
 * The API keys never leave the server: the browser only ever learns whether
 * the engine is on, plus the non-secret hints it needs to address it.
 *
 * Any OpenAI-compatible server works:
 *  - Kokoro-FastAPI (CPU, natural, no cloning)
 *  - LocalAI / Speaches / xtts-api-server (GPU, supports cloned voices)
 */

export type VoiceEngineConfig = {
  mode: "browser" | "selfhost";
  ttsUrl: string; // e.g. http://gpu-box:8880/v1/audio/speech
  ttsKey: string; // optional bearer key for the server
  ttsModel: string; // e.g. kokoro, xtts, tts-1
  ttsVoice: string; // e.g. af_sky (server voice id / cloned speaker id)
  sttUrl: string; // e.g. http://gpu-box:8000/v1/audio/transcriptions
  sttKey: string;
  sttModel: string; // e.g. whisper-1, faster-whisper
};

export const DEFAULT_VOICE_ENGINE: VoiceEngineConfig = {
  mode: "browser",
  ttsUrl: "",
  ttsKey: "",
  ttsModel: "",
  ttsVoice: "",
  sttUrl: "",
  sttKey: "",
  sttModel: "",
};

export function parseVoiceEngine(json: string | null | undefined): VoiceEngineConfig {
  if (!json) return { ...DEFAULT_VOICE_ENGINE };
  try {
    const raw = JSON.parse(json) as Partial<VoiceEngineConfig>;
    return {
      mode: raw.mode === "selfhost" ? "selfhost" : "browser",
      ttsUrl: typeof raw.ttsUrl === "string" ? raw.ttsUrl.trim() : "",
      ttsKey: typeof raw.ttsKey === "string" ? raw.ttsKey.trim() : "",
      ttsModel: typeof raw.ttsModel === "string" ? raw.ttsModel.trim() : "",
      ttsVoice: typeof raw.ttsVoice === "string" ? raw.ttsVoice.trim() : "",
      sttUrl: typeof raw.sttUrl === "string" ? raw.sttUrl.trim() : "",
      sttKey: typeof raw.sttKey === "string" ? raw.sttKey.trim() : "",
      sttModel: typeof raw.sttModel === "string" ? raw.sttModel.trim() : "",
    };
  } catch {
    return { ...DEFAULT_VOICE_ENGINE };
  }
}

export async function getVoiceEngine(): Promise<VoiceEngineConfig> {
  const row = await db.siteSettings.findUnique({ where: { id: "site" }, select: { voiceEngineJson: true } });
  return parseVoiceEngine(row?.voiceEngineJson);
}

export function ttsConfigured(c: VoiceEngineConfig): boolean {
  return c.mode === "selfhost" && /^https?:\/\//.test(c.ttsUrl);
}

export function sttConfigured(c: VoiceEngineConfig): boolean {
  return c.mode === "selfhost" && /^https?:\/\//.test(c.sttUrl);
}

/** Public shape exposed to the browser (zero secrets). */
export function publicVoiceEngine(c: VoiceEngineConfig) {
  return {
    mode: c.mode,
    ttsConfigured: ttsConfigured(c),
    sttConfigured: sttConfigured(c),
    ttsModel: c.ttsModel,
    ttsVoice: c.ttsVoice,
    sttModel: c.sttModel,
  };
}
