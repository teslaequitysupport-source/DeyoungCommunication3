"use client";

/**
 * Voice DNA: real client-side acoustic analysis for voice cloning.
 * Pitch (autocorrelation), speaking rate (syllable nuclei), energy (RMS).
 * Audio NEVER leaves the tab: only the derived numbers are stored.
 */

export interface SampleAnalysis {
  durationMs: number;
  medianPitchHz: number | null; // null = not enough voiced audio (honest)
  syllablesPerSec: number | null;
  energy: number | null; // 0..1
  voicedRatio: number;
}

export interface VoiceDNA {
  medianPitchHz: number;
  rateMultiplier: number;
  pitchMultiplier: number;
  energy: number;
  register: "low" | "mid" | "high";
  matchedVoiceUri: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Decode any recorded/uploaded audio blob the browser can read, then measure it. */
export async function analyzeAudioBlob(blob: Blob): Promise<SampleAnalysis> {
  const AC: typeof AudioContext =
    (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    return analyzeAudioBuffer(buf);
  } finally {
    void ctx.close();
  }
}

export function analyzeAudioBuffer(buffer: AudioBuffer): SampleAnalysis {
  // Mono mix
  const ch = buffer.numberOfChannels;
  const n = buffer.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < ch; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += data[i] / ch;
  }
  const sr = buffer.sampleRate;
  const durationMs = Math.round((n / sr) * 1000);

  // Frame RMS energies
  const frame = Math.round(sr * 0.032); // ~32ms
  const hop = Math.max(1, Math.round(frame / 2));
  const rms: number[] = [];
  for (let start = 0; start + frame <= n; start += hop) {
    let sum = 0;
    for (let i = start; i < start + frame; i++) sum += mono[i] * mono[i];
    rms.push(Math.sqrt(sum / frame));
  }
  const maxRms = rms.length ? Math.max(...rms) : 0;
  const voicedLevel = Math.max(0.008, maxRms * 0.12);

  // Smoothed envelope for syllable nuclei
  const win = 3;
  const env: number[] = rms.map((_, i) => {
    let s = 0;
    let c = 0;
    for (let k = i - win; k <= i + win; k++) {
      if (k >= 0 && k < rms.length) {
        s += rms[k];
        c++;
      }
    }
    return s / c;
  });

  // Syllable counting: local maxima of the envelope above voiced level,
  // at least 140ms apart.
  const minDist = Math.max(1, Math.round(0.14 / (hop / sr)));
  let syllables = 0;
  let lastPeak = -Infinity;
  let voicedFrames = 0;
  let voicedSum = 0;
  for (let i = 0; i < env.length; i++) {
    if (env[i] > voicedLevel) {
      voicedFrames++;
      voicedSum += rms[i];
      const isPeak =
        (i === 0 || env[i] >= env[i - 1]) && (i === env.length - 1 || env[i] > env[i + 1]) && env[i] > voicedLevel * 1.4;
      if (isPeak && i - lastPeak >= minDist) {
        syllables++;
        lastPeak = i;
      }
    }
  }
  const voicedSec = (voicedFrames * hop) / sr;
  const voicedRatio = rms.length ? voicedFrames / rms.length : 0;

  // Pitch: autocorrelation over voiced frames
  const f0s: number[] = [];
  const minLag = Math.floor(sr / 400); // 400Hz cap
  const maxLag = Math.floor(sr / 70); // 70Hz floor
  for (let f = 0; f < rms.length; f++) {
    if (rms[f] <= voicedLevel * 1.5) continue;
    const start = f * hop;
    const end = start + frame;
    if (end > n) break;
    let mean = 0;
    for (let i = start; i < end; i++) mean += mono[i];
    mean /= frame;
    let norm = 0;
    for (let i = start; i < end; i++) {
      const v = mono[i] - mean;
      norm += v * v;
    }
    if (norm < 1e-7) continue;
    let bestLag = -1;
    let bestVal = 0;
    for (let lag = minLag; lag <= maxLag && start + frame + lag <= n; lag++) {
      let s = 0;
      for (let i = start; i < end; i++) {
        s += (mono[i] - mean) * (mono[i + lag] - mean);
      }
      const val = s / norm; // normalized autocorrelation
      if (val > bestVal) {
        bestVal = val;
        bestLag = lag;
      }
    }
    if (bestLag > 0 && bestVal > 0.5) f0s.push(sr / bestLag);
  }

  f0s.sort((a, b) => a - b);
  const medianPitchHz = f0s.length >= 5 ? f0s[Math.floor(f0s.length / 2)] : null;
  const syllablesPerSec = voicedSec > 0.5 && syllables > 2 ? syllables / voicedSec : null;
  const energy = voicedFrames > 0 ? clamp((voicedSum / voicedFrames) / 0.25, 0, 1) : null;

  return { durationMs, medianPitchHz, syllablesPerSec, energy, voicedRatio };
}

/* ---- Voice matching: pick the system voice whose register fits the measurement ---- */

const MALE_HINTS = [
  /Microsoft (David|Guy|Ryan|George|Brian|Christopher|Eric|Roger|Andrew|Steffan)/i,
  /Google UK English Male/i,
  /Daniel|Alex|Fred|Tom|Aaron|Arthur|Gordon/i,
];
const FEMALE_HINTS = [
  /Microsoft (Zira|Aria|Jenny|Michelle|Hazel|Susan|Sonia|Natasha|Libby|Emma|Maisie)/i,
  /Google (US|UK) English Female/i,
  /Samantha|Karen|Moira|Tessa|Serena|Victoria|Allison|Joanna|Salli|Nicole|Amy|Ivy/i,
];

function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("en"));
}

export function matchVoiceForRegister(register: "low" | "mid" | "high"): SpeechSynthesisVoice | null {
  const voices = englishVoices();
  if (voices.length === 0) return null;
  const prefer = register === "high" ? FEMALE_HINTS : register === "low" ? MALE_HINTS : [...FEMALE_HINTS, ...MALE_HINTS];
  for (const rx of prefer) {
    const hit = voices.find((v) => rx.test(v.name));
    if (hit) return hit;
  }
  return voices[0];
}

/** Aggregate sample analyses into one DNA profile. Returns null when the
 *  samples were too quiet or too short to measure honestly. */
export function buildVoiceDNA(samples: SampleAnalysis[]): VoiceDNA | null {
  const withPitch = samples.filter((s) => s.medianPitchHz !== null);
  if (withPitch.length === 0) return null;
  const pitches = withPitch.map((s) => s.medianPitchHz as number).sort((a, b) => a - b);
  const medianPitchHz = pitches[Math.floor(pitches.length / 2)];
  const rates = samples.map((s) => s.syllablesPerSec).filter((r): r is number => r !== null);
  const syllPerSec = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4.0;
  const energies = samples.map((s) => s.energy).filter((e): e is number => e !== null);
  const energy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 0.5;

  const register: "low" | "mid" | "high" = medianPitchHz < 130 ? "low" : medianPitchHz < 175 ? "mid" : "high";
  const baseline = register === "low" ? 110 : register === "mid" ? 155 : 200;
  const voice = matchVoiceForRegister(register);

  return {
    medianPitchHz: Math.round(medianPitchHz),
    rateMultiplier: Math.round(clamp(syllPerSec / 4.0, 0.75, 1.35) * 100) / 100,
    pitchMultiplier: Math.round(clamp(medianPitchHz / baseline, 0.7, 1.4) * 100) / 100,
    energy: Math.round(energy * 100) / 100,
    register,
    matchedVoiceUri: voice?.voiceURI ?? "",
  };
}

/** Estimated words per minute, for honest display. */
export function wpmFromDNA(dna: { rateMultiplier: number }): number {
  return Math.round(165 * dna.rateMultiplier);
}
