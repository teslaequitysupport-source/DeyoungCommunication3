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

/** Speak parsed segments; each segment inherits rate/pitch/silence from its cue,
 *  then the operator's voice profile bias (cloned pitch/pace) is applied. */
export function speakSegments(
  segments: VoiceSegment[],
  opts: {
    voice?: SpeechSynthesisVoice | null;
    pitchBias?: number;
    rateBias?: number;
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

  const speakOne = (text: string, rate: number, pitch: number) =>
    new Promise<void>((resolve) => {
      if (cancelled) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      if (opts.voice) u.voice = opts.voice;
      u.rate = Math.max(0.4, Math.min(2, rate));
      u.pitch = Math.max(0.4, Math.min(2, pitch));
      u.volume = 1;
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
      if (cue) await wait(cue.preSilenceMs);
      if (cancelled) break;
      await speakOne(
        seg.text,
        (cue ? cue.rate : 1) * rateBias,
        (cue ? cue.pitch : 1) * pitchBias,
      );
      if (cancelled) break;
      if (cue) await wait(cue.postSilenceMs);
    }
    opts.onDone?.();
  };

  const done = run();
  return {
    done,
    cancel() {
      cancelled = true;
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
