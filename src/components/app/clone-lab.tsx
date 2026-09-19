"use client";

/**
 * Clone Lab: real, honest voice cloning.
 * Record or upload samples -> the browser measures pitch, pace, energy
 * (audio never leaves this tab) -> a derived voice profile is saved and can
 * be assigned to any AI employee. Neural timbre cloning stays labeled pending.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Square,
  Loader2,
  Trash2,
  PlayCircle,
  Upload,
  AudioLines,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attachMicAnalyser, Waveform } from "@/components/brand/waveform";
import { analyzeAudioBlob, buildVoiceDNA, type SampleAnalysis, type VoiceDNA } from "@/lib/voice-dna";
import { parseSegments } from "@/lib/emotion";
import {
  speakSegments,
  resolveProfileVoice,
  primeVoices,
  speechSupported,
  fetchVoiceEngineStatus,
  workerVoiceForRegister,
  type VoiceEngineStatus,
} from "@/lib/voice-engine";
import type { VoiceCloneDTO } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const READ_PROMPTS = [
  { label: "Greeting", text: "Hello, thanks for calling. How can I help you today?" },
  { label: "Calm sentence", text: "Let me check that for you, one moment please." },
  { label: "Warm sentence", text: "Absolutely, I am happy to help with that right now." },
];

const fmtSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function CloneLab({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [consentName, setConsentName] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [notes, setNotes] = useState("");

  const [samples, setSamples] = useState<{ label: string; analysis: SampleAnalysis }[]>([]);
  const [recording, setRecording] = useState<string | null>(null); // prompt label being recorded
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dna, setDna] = useState<VoiceDNA | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Voice engine: when the admin connects the self-hosted neural worker, previews
  // and calls use its natural neural voices (with the browser engine as fallback).
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngineStatus | null>(null);
  useEffect(() => {
    void fetchVoiceEngineStatus().then(setVoiceEngine);
  }, []);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const detachAnalyserRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    primeVoices();
    return () => {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      detachAnalyserRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const finishRecording = useCallback(
    async (label: string, blob: Blob) => {
      setAnalyzing(label);
      setError(null);
      try {
        const analysis = await analyzeAudioBlob(blob);
        if (analysis.durationMs < 1200) {
          setError(`The "${label}" sample is too short (${fmtSec(analysis.durationMs)}). Record at least 2 seconds of natural speech.`);
        } else if (analysis.medianPitchHz === null) {
          setError(`The "${label}" sample was too quiet to measure a voice. Speak close to the mic, a little louder.`);
        } else {
          setSamples((ss) => [...ss, { label, analysis }]);
        }
      } catch {
        setError(`The "${label}" recording could not be decoded in this browser. Try again, or upload an audio file.`);
      } finally {
        setAnalyzing(null);
      }
    },
    [],
  );

  async function startRecording(label: string) {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      detachAnalyserRef.current = attachMicAnalyser(stream, setAmplitudes);
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        detachAnalyserRef.current?.();
        detachAnalyserRef.current = null;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        void finishRecording(label, blob);
      };
      recorderRef.current = rec;
      rec.start(250);
      setRecording(label);
      setRecordMs(0);
      timerRef.current = setInterval(() => setRecordMs((m) => m + 100), 100);
    } catch {
      setError("Microphone access was refused. Allow the mic, or upload an audio file you have the rights to.");
      setRecording(null);
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const label = recording;
    setRecording(null);
    setAmplitudes([]);
    recorderRef.current?.stop();
    void label;
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAnalyzing("upload");
    setError(null);
    try {
      const analysis = await analyzeAudioBlob(file);
      if (analysis.durationMs < 1200) {
        setError(`That file is too short (${fmtSec(analysis.durationMs)}). Use at least 2 seconds of natural speech.`);
      } else if (analysis.medianPitchHz === null) {
        setError("No voice could be measured in that file. Use clear speech, not music or silence.");
      } else {
        setSamples((ss) => [...ss, { label: file.name.slice(0, 28), analysis }]);
      }
    } catch {
      setError("That file could not be decoded in this browser. WAV, MP3, M4A and WEBM usually work.");
    } finally {
      setAnalyzing(null);
    }
  }

  // DNA can be (re)built whenever samples change.
  useEffect(() => {
    setDna(samples.length > 0 ? buildVoiceDNA(samples.map((s) => s.analysis)) : null);
    setSaved(false);
  }, [samples]);

  function previewDna() {
    if (!dna) return;
    const segments = parseSegments("Hello, this is your cloned voice [warm] speaking. I answer exactly the way you tell me to.");
    speakSegments(segments, {
      voice: resolveProfileVoice({ voiceUri: dna.matchedVoiceUri }),
      pitchBias: dna.pitchMultiplier,
      rateBias: dna.rateMultiplier,
      neural:
        voiceEngine && voiceEngine.mode === "selfhost" && voiceEngine.ttsConfigured
          ? { voice: workerVoiceForRegister(dna.register) }
          : undefined,
    });
  }

  const totalMs = samples.reduce((a, s) => a + s.analysis.durationMs, 0);

  async function saveProfile() {
    if (!dna) return;
    setSaving(true);
    try {
      const res = await fetch("/api/voice-clones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          consentName: consentName.trim(),
          sampleCount: samples.length,
          totalMs,
          profile: dna,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: `${name.trim()} is ready to assign.`,
          description: "Open Employees, Configure any AI employee, and pick it under Voice.",
        });
        setSaved(true);
        setSamples([]);
        setName("");
        setConsentName("");
        setConsentGiven(false);
        setNotes("");
        onSaved();
      } else {
        toast({ title: data.error ?? "The voice profile could not be saved." });
      }
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!dna && name.trim().length > 0 && consentName.trim().length > 1 && consentGiven && !saved;

  return (
    <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1220]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1C3050] px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A9E2FF]/40 bg-[#A9E2FF]/10">
          <Fingerprint className="h-5 w-5 text-[#A9E2FF]" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-display-strong text-xl text-white">Clone Lab</h2>
          <p className="mt-1 text-[13px] text-[#A1A1A1]">
            Clone your own voice, or a voice you have the rights to. Your AI employees speak with it.
          </p>
        </div>
        <span className="chip-gold ml-auto">TIMBRE MATCH · RUNS IN YOUR BROWSER</span>
      </div>

      <div className="space-y-8 px-6 py-6">
        {/* privacy banner */}
        <div className="flex items-start gap-3 rounded-[3px] border border-[#1C3050] bg-[#0A1424] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#A9E2FF]" />
          <p className="text-[12px] leading-relaxed text-[#A1A1A1]">
            Your samples are measured in this browser and never uploaded. No audio leaves this tab:
            only the derived numbers (pitch, pace, energy) are saved, and only after you press save.
          </p>
        </div>

        {/* step 1: identity + consent */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="font-mono-dy text-[10.5px] tracking-[0.18em] text-[#A1A1A1]">VOICE NAME</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Ada, Front desk voice"
              className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13px] text-white placeholder:text-[#6b6b6b]"
            />
          </div>
          <div className="space-y-2">
            <p className="font-mono-dy text-[10.5px] tracking-[0.18em] text-[#A1A1A1]">CONSENT HOLDER (WHO OWNS THIS VOICE)</p>
            <Input
              value={consentName}
              onChange={(e) => setConsentName(e.target.value)}
              maxLength={120}
              placeholder="Your full name, or the voice owner's"
              className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13px] text-white placeholder:text-[#6b6b6b]"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-[#16294a] bg-[#0E1B2E] px-4 py-3">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#A9E2FF]"
          />
          <span className="text-[12px] leading-relaxed text-[#8fb8d8]">
            I confirm I am the owner of this voice, or I hold written permission from the owner to
            clone it. The consent holder and timestamp are stored with the profile, and deleting the
            profile removes it everywhere immediately.
          </span>
        </label>

        {/* step 2: samples */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono-dy text-[10.5px] tracking-[0.18em] text-[#A1A1A1]">
              SAMPLES · READ ALOUD OR UPLOAD
            </p>
            {samples.length > 0 && (
              <span className="font-mono-dy text-[10.5px] tabular-nums tracking-[0.1em] text-[#6f6f6a]">
                {samples.length} MEASURED · {fmtSec(totalMs)} TOTAL
              </span>
            )}
          </div>

          {recording ? (
            <div className="mt-3 rounded-[3px] border border-[#4A90E2]/50 bg-[#4A90E2]/[0.05] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono-dy text-[10.5px] tracking-[0.14em] text-[#6fcbff]">
                  <span className="dy-status-dot inline-block h-2 w-2 animate-pulse rounded-full bg-[#4A90E2]" />
                  RECORDING {recording.toUpperCase()} · {(recordMs / 1000).toFixed(1)}S
                </span>
                <Button
                  onClick={stopRecording}
                  className="h-9 rounded-[2px] bg-[#4A90E2] px-4 text-[12.5px] font-semibold text-white hover:bg-[#2E7CDE]"
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" /> Stop and measure
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-[#A1A1A1]">
                Say it naturally: {READ_PROMPTS.find((p) => p.label === recording)?.text ?? "anything works."}
              </p>
              <div className="mt-3">
                <Waveform amplitudes={amplitudes} height={40} color="#4A90E2" label="Your live microphone" />
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {READ_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => void startRecording(p.label)}
                  disabled={analyzing !== null}
                  className="group rounded-[3px] border border-[#1C3050] bg-[#0A1424] p-3 text-left transition-colors ease-mechanical hover:border-[#A9E2FF]/50 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Mic className="h-3.5 w-3.5 text-[#A9E2FF]" />
                    <span className="font-mono-dy text-[9.5px] tracking-[0.14em] text-[#A1A1A1]">
                      RECORD {p.label.toUpperCase()}
                    </span>
                  </span>
                  <span className="mt-2 block text-[12px] leading-snug text-[#6f6f6a] group-hover:text-[#A1A1A1]">
                    {p.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={onUploadFile}
              className="hidden"
              aria-label="Upload a voice sample"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={recording !== null || analyzing !== null}
              className="h-9 rounded-[2px] border-[#1C3050] bg-[#0A1424] px-4 text-[12.5px] text-[#A1A1A1] hover:text-white"
            >
              {analyzing === "upload" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              Upload a voice file instead
            </Button>
            <span className="text-[11px] text-[#6b6b6b]">
              WAV, MP3, M4A, WEBM. Works for a desired voice you have the rights to.
            </span>
          </div>

          {/* measured samples */}
          {analyzing && analyzing !== "upload" && (
            <div className="mt-3 flex items-center gap-2 rounded-[3px] border border-[#1C3050] bg-[#0A1424] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#A9E2FF]" />
              <span className="font-mono-dy text-[10.5px] tracking-[0.14em] text-[#A1A1A1]">
                MEASURING {analyzing.toUpperCase()} · PITCH, PACE, ENERGY
              </span>
            </div>
          )}
          {samples.length > 0 && (
            <div className="mt-3 space-y-2">
              {samples.map((s, i) => (
                <div
                  key={`${s.label}-${i}`}
                  className="flex flex-wrap items-center gap-3 rounded-[3px] border border-[#1b3350] bg-[#0A1424] px-4 py-2.5"
                >
                  <AudioLines className="h-3.5 w-3.5 text-[#A9E2FF]" />
                  <span className="text-[12.5px] font-medium text-white">{s.label}</span>
                  <span className="font-mono-dy text-[10px] tracking-[0.08em] text-[#8fb8d8]">
                    {fmtSec(s.analysis.durationMs)} ·{" "}
                    {s.analysis.medianPitchHz ? `${Math.round(s.analysis.medianPitchHz)}HZ MEDIAN PITCH` : "PITCH UNCLEAR"} ·{" "}
                    {s.analysis.syllablesPerSec ? `${s.analysis.syllablesPerSec.toFixed(1)} SYLL/SEC` : "PACE UNCLEAR"}
                  </span>
                  <button
                    onClick={() => setSamples((ss) => ss.filter((_, j) => j !== i))}
                    className="ml-auto text-[#6f6f6a] transition-colors hover:text-[#4A90E2]"
                    aria-label={`Remove ${s.label} sample`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-[3px] border border-[#4A90E2]/40 bg-[#4A90E2]/[0.06] px-4 py-3">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[#6fcbff]" />
              <p className="text-[12px] leading-relaxed text-[#a9e9ff]">{error}</p>
            </div>
          )}
        </div>

        {/* step 3: the built DNA */}
        {dna && (
          <div className="rounded-[3px] border border-[#A9E2FF]/40 bg-[#0E1B2E] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-[#A9E2FF]" />
                <p className="font-display text-[15px] font-bold text-white">Voice DNA built</p>
              </div>
              <span className="chip-gold">
                {dna.register.toUpperCase()} REGISTER · {dna.medianPitchHz}HZ · PITCH x{dna.pitchMultiplier} · PACE x{dna.rateMultiplier}
              </span>
            </div>
            <div className="mt-4 grid gap-px overflow-hidden rounded-[2px] border border-[#1b3350] bg-[#1b3350] sm:grid-cols-4">
              {[
                { l: "MEDIAN PITCH", v: `${dna.medianPitchHz} Hz` },
                { l: "PACE", v: `x${dna.rateMultiplier}` },
                { l: "ENERGY", v: `${Math.round((dna.energy ?? 0) * 100)}%` },
                { l: "SAMPLES", v: `${samples.length} · ${fmtSec(totalMs)}` },
              ].map((s) => (
                <div key={s.l} className="bg-[#0A1424] p-3">
                  <p className="font-display-strong text-lg text-white">{s.v}</p>
                  <p className="font-mono-dy mt-1 text-[9px] tracking-[0.14em] text-[#8fb8d8]">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {speechSupported() ? (
                <Button
                  onClick={previewDna}
                  className="btn-gold h-10 rounded-[2px] px-5 text-[13px]"
                >
                  <PlayCircle className="mr-1.5 h-4 w-4" /> Hear it now
                </Button>
              ) : (
                <p className="text-[12px] text-[#8fb8d8]">Speech synthesis is unavailable in this browser, so no preview is possible. The profile still saves and applies.</p>
              )}
              <div className="min-w-[200px] flex-1">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Notes for yourself (optional): where this voice is used, who consented, anything else."
                  className="rounded-[2px] border-[#1b3350] bg-[#0A1424] text-[12.5px] text-white placeholder:text-[#6b6b6b]"
                />
              </div>
            </div>
            <Button
              onClick={saveProfile}
              disabled={!canSave || saving}
              className="btn-gold mt-4 h-11 w-full rounded-[2px] text-[14px]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saved ? "Saved. Assign it from Employees." : canSave ? `Save ${name.trim() || "this voice"} and make it assignable` : "Add a name and consent to save"}
            </Button>
            {!consentGiven && samples.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-[#6f6f6a]">
                Consent is required before a voice can be cloned. This is deliberate and it is not optional.
              </p>
            )}
          </div>
        )}

        {/* engine honesty */}
        <div className="rounded-[3px] border border-dashed border-[#1C3050] bg-[#0A1322] px-4 py-3 font-mono-dy text-[10px] leading-[1.8] tracking-[0.04em] text-[#6f6f6a]">
          ENGINE TRUTH · TIMBRE MATCH (LIVE): your real measured pitch, pace and energy drive the
          synthesis voice, register matching and multipliers, in real calls, today. NEURAL VOICES
          (LIVE WHEN CONNECTED): with the self-hosted worker on (admin panel, off switch included),
          this profile maps to a natural neural voice matched to your register, in previews and
          real calls. NEURAL TIMBRE CLONE (GPU WORKER): rebuilding your exact timbre needs the GPU
          cloning engine (voice-worker/README.md, Kaggle); it is provided and documented, not yet
          verified here, so it is labeled exactly like this, never faked as done.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Saved cloned voices list ---------------- */

export function CloneVoicesList({
  clones,
  onChanged,
}: {
  clones: VoiceCloneDTO[] | null;
  onChanged: () => void;
}) {
  const { toast } = useToast();

  async function remove(c: VoiceCloneDTO) {
    const res = await fetch(`/api/voice-clones/${c.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast({
        title: `${c.name} was deleted.`,
        description: "Consent record removed. Employees using it fell back to the engine default voice.",
      });
      onChanged();
    } else {
      toast({ title: data.error ?? "Delete failed." });
    }
  }

  function preview(c: VoiceCloneDTO) {
    const segments = parseSegments("Hello, this is " + c.name + " [warm]. I answer exactly the way my operator tells me to.");
    speakSegments(segments, {
      voice: resolveProfileVoice({ voiceUri: c.profile?.matchedVoiceUri }),
      pitchBias: c.profile?.pitchMultiplier ?? 1,
      rateBias: c.profile?.rateMultiplier ?? 1,
    });
  }

  if (clones === null) {
    return (
      <div className="flex h-24 items-center justify-center rounded-[4px] border border-[#1C3050]">
        <Loader2 className="h-5 w-5 animate-spin text-[#A9E2FF]" />
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1220]">
      <div className="flex items-center gap-3 border-b border-[#1C3050] px-6 py-4">
        <AudioLines className="h-4 w-4 text-[#A9E2FF]" />
        <h2 className="font-display-strong text-lg text-white">Your cloned voices</h2>
        <span className="font-mono-dy text-[10.5px] tracking-[0.12em] text-[#6f6f6a]">
          {clones.length} PROFILE{clones.length === 1 ? "" : "S"}
        </span>
      </div>
      {clones.length === 0 ? (
        <p className="px-6 py-6 text-[13px] leading-relaxed text-[#A1A1A1]">
          None yet. Record a voice above: three short readings are enough. Every profile lists its
          consent holder and timestamp, and deleting one removes it everywhere immediately.
        </p>
      ) : (
        <div className="divide-y divide-[#1C3050]">
          {clones.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white">{c.name}</p>
                <p className="mt-0.5 font-mono-dy text-[9.5px] tracking-[0.1em] text-[#6f6f6a]">
                  {c.profile?.register?.toUpperCase() ?? "UNKNOWN"} REGISTER · {Math.round(c.profile?.medianPitchHz ?? 0)}HZ ·{" "}
                  PITCH x{c.profile?.pitchMultiplier ?? 1} · PACE x{c.profile?.rateMultiplier ?? 1} · {c.sampleCount} SAMPLE{c.sampleCount === 1 ? "" : "S"} ·{" "}
                  TIMBRE MATCH ENGINE
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8fb8d8]">
                  <ShieldCheck className="h-3 w-3" />
                  CONSENT: {c.consentName} ·{" "}
                  {c.consentAt ? new Date(c.consentAt).toLocaleDateString() : "no timestamp"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => preview(c)}
                  className="h-8 rounded-[2px] border-[#16294a] bg-[#0E1B2E] px-3 text-[12px] text-[#A9E2FF] hover:bg-[#16294a]"
                >
                  <PlayCircle className="mr-1 h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(c)}
                  className="h-8 text-[#6f6f6a] hover:text-[#4A90E2]"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
