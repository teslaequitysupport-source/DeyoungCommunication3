/**
 * DEYOUNG Voice Emotion Engine: shared cue parsing.
 * Cues are produced by the LLM at generation time (never random decoration).
 */

export type EmotionCue = {
  tag: string; // canonical, e.g. "breathes"
  label: string; // chip label, e.g. "breathes"
  kind: "breath" | "sigh" | "laugh" | "pause" | "hesitate" | "correct" | "tone" | "strong";
  /** audio modulation for the following segment */
  rate: number; // 0.5-1.4
  pitch: number; // 0.5-1.4
  preSilenceMs: number;
  postSilenceMs: number;
};

export type VoiceSegment = {
  text: string; // spoken text (cue tags stripped)
  cueBefore?: EmotionCue; // cue that precedes this segment
};

const CUE_TABLE: Record<string, Omit<EmotionCue, "tag" | "label">> = {
  breathes: { kind: "breath", rate: 0.96, pitch: 1.0, preSilenceMs: 350, postSilenceMs: 0 },
  exhales: { kind: "breath", rate: 0.94, pitch: 0.98, preSilenceMs: 400, postSilenceMs: 0 },
  sighs: { kind: "sigh", rate: 0.82, pitch: 0.9, preSilenceMs: 500, postSilenceMs: 150 },
  "soft laugh": { kind: "laugh", rate: 1.08, pitch: 1.15, preSilenceMs: 120, postSilenceMs: 120 },
  chuckles: { kind: "laugh", rate: 1.06, pitch: 1.12, preSilenceMs: 100, postSilenceMs: 100 },
  laughs: { kind: "laugh", rate: 1.08, pitch: 1.15, preSilenceMs: 120, postSilenceMs: 120 },
  pauses: { kind: "pause", rate: 1.0, pitch: 1.0, preSilenceMs: 700, postSilenceMs: 0 },
  hesitates: { kind: "hesitate", rate: 0.9, pitch: 0.96, preSilenceMs: 200, postSilenceMs: 100 },
  "corrects self": { kind: "correct", rate: 0.92, pitch: 1.0, preSilenceMs: 150, postSilenceMs: 50 },
  warmly: { kind: "tone", rate: 0.95, pitch: 1.05, preSilenceMs: 0, postSilenceMs: 0 },
  empathetic: { kind: "tone", rate: 0.93, pitch: 1.04, preSilenceMs: 100, postSilenceMs: 0 },
  apologizes: { kind: "tone", rate: 0.9, pitch: 0.95, preSilenceMs: 150, postSilenceMs: 50 },
  upset: { kind: "strong", rate: 0.88, pitch: 0.88, preSilenceMs: 200, postSilenceMs: 200 },
  "voice breaks": { kind: "strong", rate: 0.86, pitch: 0.86, preSilenceMs: 250, postSilenceMs: 300 },
  tears: { kind: "strong", rate: 0.85, pitch: 0.87, preSilenceMs: 300, postSilenceMs: 350 },
  cries: { kind: "strong", rate: 0.85, pitch: 0.87, preSilenceMs: 300, postSilenceMs: 350 },
};

/** Extract all bracketed cues like [breathes] or [soft laugh] from an utterance. */
export function extractCues(utterance: string): string[] {
  const matches = utterance.match(/\[([^\]]+)\]/g) ?? [];
  return matches
    .map((m) => m.slice(1, -1).trim().toLowerCase())
    .filter((tag) => tag in CUE_TABLE);
}

function cueFor(tag: string): EmotionCue {
  const base = CUE_TABLE[tag] ?? { kind: "tone", rate: 1, pitch: 1, preSilenceMs: 0, postSilenceMs: 0 };
  return { tag, label: tag, ...base };
}

/** Split an utterance into spoken segments with their preceding cue (if any). */
export function parseSegments(utterance: string): VoiceSegment[] {
  const parts = utterance.split(/(\[[^\]]+\])/g).filter((p) => p.trim().length > 0);
  const segments: VoiceSegment[] = [];
  let pendingCue: EmotionCue | undefined;
  for (const part of parts) {
    const isCue = part.startsWith("[") && part.endsWith("]");
    if (isCue) {
      const tag = part.slice(1, -1).trim().toLowerCase();
      if (tag in CUE_TABLE) pendingCue = cueFor(tag);
      continue;
    }
    const text = part.replace(/\s+/g, " ").trim();
    if (text) {
      segments.push({ text, cueBefore: pendingCue });
      pendingCue = undefined;
    }
  }
  return segments.length > 0 ? segments : [{ text: utterance.replace(/\[[^\]]+\]/g, "").trim() }];
}

/** Strip cue tags for a plain transcript line. */
export function stripCues(utterance: string): string {
  return utterance.replace(/\[[^\]]+\]/g, " ").replace(/\s+/g, " ").trim();
}

/** Aggregate cue counts across a call (honest emotion summary). */
export function summarizeCues(utterances: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const u of utterances) {
    for (const tag of extractCues(u)) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export const CUE_LABELS = Object.keys(CUE_TABLE);

/** System-prompt section that teaches the LLM the cue vocabulary.
 *  Cues are an INTERNAL audio-control channel: they modulate the voice
 *  (pitch, pace, breathing sounds). The caller must never see or hear them
 *  as words. The employee never announces feelings: it conveys them through
 *  delivery and phrasing, like a real person on the phone. */
export const EMOTION_PROMPT = `VOICE EMOTION SYSTEM
You are speaking out loud in a live voice call. Your voice is modulated in real time: pitch, pace, pauses, and breathing change with the emotional tags below. The caller never sees or hears the tags themselves: they only hear and feel the result.
Available tags:
[breathes] [exhales] [sighs] [soft laugh] [chuckles] [pauses] [hesitates] [corrects self] [warmly] [empathetic] [apologizes] [upset] [voice breaks] [tears]

Rules:
- Use tags sparingly and situationally: 0-2 per reply in normal conversation. Never decorate.
- NEVER announce your emotions or describe your own delivery in words. Do not say things like "I feel empathy", "*smiles*", "sadly,", "with a warm tone". Just speak the words: the voice does the rest.
- If the human is frustrated, upset, or shares bad news: respond with empathy first. A sincere "[pauses]" or "[empathetic]" before the substance. Never laugh at frustration.
- If you make a mistake or misspeak: use [hesitates] then genuinely correct yourself with [corrects self]: mid-sentence if that is more natural.
- If the human shares something emotional (grief, distress): slow down. [breathes] or [voice breaks] is appropriate. Do not perform crying: be restrained and real.
- If the human interrupts you mid-sentence (you will be told): acknowledge it gracefully (", yes, go ahead", "of course"), do not finish your old sentence unless asked.
- Keep replies SHORT for voice: 1-3 sentences normally. This is a conversation, not an essay.
- Never explain the tag system to the user. Never put tags in ALL CAPS or stack multiple tags in a row.`;
