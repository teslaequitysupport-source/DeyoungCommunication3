"use client";

/**
 * DEYOUNG Voice Engine (browser, free tier of the pipeline).
 * - STT: Web Speech API SpeechRecognition (streaming, interim → barge-in detection)
 * - TTS: speechSynthesis with per-segment rate/pitch/silence mapped from emotion cues
 * Both degrade honestly: unsupported browsers fall back to text mode.
 */

import type { VoiceSegment } from "@/lib/emotion";
import type { VoiceProfileDTO } from "@/lib/types";

/* ---- Minimal Web Speech typings (DOM lib lacks SpeechRecognition) ---- */
interface SRAlternative { transcript: string; confidence: number }
interface SRResult { isFinal: boolean; length: number; [index: number]: SRAlternative }
interface SRResultList { length: number; [index: number]: SRResult }
interface SREvent { resultIndex: number; results: SRResultList }
interface SRErrorEvent { error: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

function getSRCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return getSRCtor() !== null;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/* ---- Recognition wrapper with auto-restart ---- */

export type RecognitionState = "off" | "listening" | "error";

export interface RecognitionHandle {
  start(): void;
  stop(): void;
  destroy(): void;
}

export function createRecognition(handlers: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onState: (state: RecognitionState) => void;
}): RecognitionHandle | null {
  const SRC = getSRCtor();
  if (!SRC) return null;

  const rec = new SRC();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  let wanted = false;
  let restarting = false;

  rec.onstart = () => handlers.onState("listening");
  rec.onerror = (e) => {
    // "no-speech"/"aborted" are routine; surface the rest but keep trying.
    if (e.error !== "no-speech" && e.error !== "aborted") handlers.onState("error");
  };
  rec.onend = () => {
    if (wanted && !restarting) {
      restarting = true;
      setTimeout(() => {
        restarting = false;
        if (wanted) {
          try {
            rec.start();
          } catch {
            /* already started */
          }
        }
      }, 250);
    } else if (!wanted) {
      handlers.onState("off");
    }
  };
  rec.onresult = (e: SREvent) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const text = r[0].transcript.trim();
      if (r.isFinal) {
        if (text) handlers.onFinal(text);
      } else {
        interim += text + " ";
      }
    }
    handlers.onInterim(interim.trim());
  };

  return {
    start() {
      wanted = true;
      try {
        rec.start();
      } catch {
        /* start() throws if already running: fine */
      }
    },
    stop() {
      wanted = false;
      try {
        rec.stop();
      } catch {
        /* fine */
      }
      handlers.onState("off");
    },
    destroy() {
      wanted = false;
      try {
        rec.abort();
      } catch {
        /* fine */
      }
    },
  };
}

/* ---- Emotion-modulated speech ---- */

export function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const prefer = [
    /Google US English/i,
    /Samantha/i,
    /Microsoft (Aria|Jenny|Michelle)/i,
    /Google UK English Female/i,
    /en[-_]US/i,
    /en[-_]GB/i,
  ];
  for (const rx of prefer) {
    const hit = voices.find((v) => rx.test(v.name));
    if (hit) return hit;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

/** Resolve the voice for an employee's assigned (cloned) voice profile.
 *  Falls back honestly to the default voice when the URI is gone or unset. */
export function resolveProfileVoice(profile?: VoiceProfileDTO | null): SpeechSynthesisVoice | null {
  if (!speechSupported() || !profile) return pickVoice();
  if (profile.voiceUri) {
    const hit = window.speechSynthesis.getVoices().find((v) => v.voiceURI === profile.voiceUri);
    if (hit) return hit;
  }
  return pickVoice();
}

export interface SpeakHandle {
  done: Promise<void>;
  cancel(): void;
}

/* ---- Audible humanization: real breaths, sighs, sniffs ----
 * Emotion is carried IN THE VOICE, never written out. Filtered-noise
 * synthesis shapes soft inhales, exhales, sniffs (crying) and light
 * chuckles that play under the speech pauses, so the employee sounds
 * like it is actually breathing while it talks. */

type HumanSound = "breath" | "sigh" | "sniff" | "chuckle";

const SOUND_MS: Record<HumanSound, number> = {
  breath: 430,
  sigh: 560,
  sniff: 170,
  chuckle: 330,
};

let audioCtx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

function getAudioGraph(): { ctx: AudioContext; noise: AudioBuffer } | null {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    if (!noiseBuf) {
      const len = Math.floor(audioCtx.sampleRate * 1.2);
      noiseBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return { ctx: audioCtx, noise: noiseBuf };
  } catch {
    return null;
  }
}

/** Play a soft human vocal sound (breath / sigh / sniff / chuckle). */
function playHumanSound(kind: HumanSound, gainScale = 1): void {
  const g0 = getAudioGraph();
  if (!g0) return;
  const { ctx, noise } = g0;
  const t0 = ctx.currentTime + 0.01;
  const dur = SOUND_MS[kind] / 1000;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  if (kind === "breath") {
    // Soft inhale: bandpass sweeping up, gentle swell.
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, t0);
    filter.frequency.linearRampToValueAtTime(760, t0 + dur * 0.7);
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.09 * gainScale, t0 + dur * 0.55);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  } else if (kind === "sigh") {
    // Falling exhale: lowpass sweeping down, longer decay.
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(950, t0);
    filter.frequency.exponentialRampToValueAtTime(380, t0 + dur);
    filter.Q.value = 0.4;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.085 * gainScale, t0 + dur * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  } else if (kind === "sniff") {
    // Quick sharp nasal catch-breath: high bandpass, fast attack.
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1750, t0);
    filter.frequency.linearRampToValueAtTime(2350, t0 + dur);
    filter.Q.value = 1.6;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.13 * gainScale, t0 + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  } else {
    // Light chuckle: three short filtered bursts with falling energy.
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(560, t0);
    filter.Q.value = 1.1;
    const burst = 0.075;
    const gap = 0.055;
    gain.gain.setValueAtTime(0.0001, t0);
    for (let b = 0; b < 3; b++) {
      const at = t0 + b * (burst + gap);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime((0.09 - b * 0.02) * gainScale, at + burst * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + burst);
    }
  }

  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/** Which audible human sound a cue kind implies (null = prosody only). */
function cueSound(kind: string): HumanSound | null {
  if (kind === "breath") return "breath";
  if (kind === "sigh") return "sigh";
  if (kind === "strong") return "sniff"; // tears / voice breaking: catch-breath
  if (kind === "laugh") return "chuckle";
  return null;
}

/* ---- Self-hosted neural worker path (optional, off by default) ----
 * When the admin connects a voice worker, speech goes through the server
 * proxy (/api/voice/tts) to the operator's own neural engine (Kokoro, XTTS,
 * or any OpenAI-compatible server). The token never touches the browser.
 * Every failure falls straight back to the browser engine: the call never
 * breaks because a worker is asleep (that is what the off switch is for). */

export type VoiceEngineStatus = {
  mode: "browser" | "selfhost";
  ttsConfigured: boolean;
  sttConfigured: boolean;
  ttsModel: string;
  ttsVoice: string;
  sttModel: string;
};

export async function fetchVoiceEngineStatus(): Promise<VoiceEngineStatus | null> {
  try {
    const res = await fetch("/api/voice/config", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as VoiceEngineStatus;
  } catch {
    return null;
  }
}

/** Map a measured voice register (from the operator's clone DNA) to a natural
 *  worker voice id from the Kokoro set. Same heuristic as the browser voice
 *  matcher: high register prefers female, low prefers male. */
export function workerVoiceForRegister(register: string | undefined): string {
  if (register === "high") return "af_bella";
  if (register === "low") return "am_onyx";
  return "af_sky";
}

/* One failed round trip cools the neural path down for 60s so a sleeping
 * worker does not add dead latency to every segment of a live call. */
let neuralCooldownUntil = 0;
let activeNeuralSource: AudioBufferSourceNode | null = null;

function stopNeuralPlayback(): void {
  if (activeNeuralSource) {
    try {
      activeNeuralSource.stop();
    } catch {
      /* already stopped */
    }
    activeNeuralSource = null;
  }
}

async function speakOneNeural(
  text: string,
  voice: string | undefined,
  speed: number,
  volume: number,
  isCancelled: () => boolean,
): Promise<boolean> {
  if (Date.now() < neuralCooldownUntil) return false;
  try {
    const res = await fetch("/api/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, speed }),
    });
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    const buf = await res.arrayBuffer();
    const g = getAudioGraph();
    if (!g) throw new Error("no audio graph");
    const audio = await g.ctx.decodeAudioData(buf);
    if (isCancelled()) return false;
    return await new Promise<boolean>((resolve) => {
      const src = g.ctx.createBufferSource();
      src.buffer = audio;
      const gain = g.ctx.createGain();
      gain.gain.value = Math.max(0.1, Math.min(1, volume));
      src.connect(gain).connect(g.ctx.destination);
      src.onended = () => {
        if (activeNeuralSource === src) activeNeuralSource = null;
        resolve(true);
      };
      activeNeuralSource = src;
      src.start();
    });
  } catch {
    neuralCooldownUntil = Date.now() + 60_000;
    return false;
  }
}

/** Speak parsed segments; each segment inherits rate/pitch/silence from its cue,
 *  then the operator's voice profile bias (cloned pitch/pace) is applied.
 *  Cues with an audible character play a real breath/sigh/sniff/chuckle sound
 *  inside the pause, and strongly emotional segments get slight pitch jitter
 *  so the voice sounds unsteady, the way real upset speech does.
 *  With opts.neural set (self-hosted worker connected), each segment is first
 *  synthesized by the worker; the audible emotion layer stays identical. */
export function speakSegments(
  segments: VoiceSegment[],
  opts: {
    voice?: SpeechSynthesisVoice | null;
    pitchBias?: number;
    rateBias?: number;
    neural?: { voice?: string };
    onStart?: () => void;
    onDone?: () => void;
  } = {},
): SpeakHandle {
  let cancelled = false;
  const synth = window.speechSynthesis;

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      if (ms <= 0 || cancelled) return resolve();
      setTimeout(resolve, ms);
    });

  const speakOne = (text: string, rate: number, pitch: number, volume = 1) =>
    new Promise<void>((resolve) => {
      if (cancelled) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      if (opts.voice) u.voice = opts.voice;
      u.rate = Math.max(0.4, Math.min(2, rate));
      u.pitch = Math.max(0.4, Math.min(2, pitch));
      u.volume = Math.max(0.1, Math.min(1, volume));
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      // Safety valve: never hang longer than text length implies (~180 wpm + slack).
      const safety = Math.max(4000, text.length * 90);
      setTimeout(finish, safety);
      synth.speak(u);
    });

  const run = async () => {
    if (segments.length === 0) return;
    opts.onStart?.();
    if (synth.paused) synth.resume();
    const pitchBias = Math.max(0.4, Math.min(1.9, opts.pitchBias ?? 1));
    const rateBias = Math.max(0.5, Math.min(1.8, opts.rateBias ?? 1));
    for (const seg of segments) {
      if (cancelled) break;
      const cue = seg.cueBefore;
      if (cue) {
        const sound = cueSound(cue.kind);
        const soundMs = sound ? SOUND_MS[sound] : 0;
        if (sound && cue.preSilenceMs < soundMs) {
          // Lead with the audible breath, then any remaining pause.
          playHumanSound(sound);
          await wait(Math.min(soundMs, cue.preSilenceMs));
          await wait(cue.preSilenceMs - soundMs);
        } else {
          if (sound) playHumanSound(sound);
          await wait(cue.preSilenceMs);
        }
      }
      if (cancelled) break;
      // Unsteady voice under strong emotion: subtle per-segment pitch wobble.
      const strong = cue?.kind === "strong";
      const rate = (cue ? cue.rate : 1) * rateBias;
      // Neural worker first (when connected): natural voice, same emotion layer.
      let spoken = false;
      if (opts.neural) {
        spoken = await speakOneNeural(seg.text, opts.neural.voice, rate, strong ? 0.92 : 1, () => cancelled);
        if (cancelled) break;
      }
      if (!spoken) {
        const jitter = strong ? (Math.random() * 0.09 - 0.045) : 0;
        await speakOne(
          seg.text,
          rate,
          Math.max(0.4, (cue ? cue.pitch : 1) + jitter) * pitchBias,
          strong ? 0.92 : 1,
        );
      }
      if (cancelled) break;
      if (cue) {
        if (cue.kind === "strong" && cue.postSilenceMs > 250) {
          // A quiet second catch-breath while recovering.
          playHumanSound("sniff", 0.6);
        }
        await wait(cue.postSilenceMs);
      }
    }
    opts.onDone?.();
  };

  const done = run();
  return {
    done,
    cancel() {
      cancelled = true;
      stopNeuralPlayback();
      try {
        synth.cancel();
      } catch {
        /* fine */
      }
    },
  };
}

/** Warm up the voices list (Chrome loads it async). */
export function primeVoices() {
  if (!speechSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
