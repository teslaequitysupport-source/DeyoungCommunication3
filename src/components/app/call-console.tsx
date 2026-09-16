"use client";

/**
 * Live Call Console: the real thing, honestly labeled.
 * Real microphone STT (browser) → real LLM turns (server) → real speech synthesis
 * with emotion modulation and barge-in. Text mode is a first-class fallback, not
 * a degraded afterthought.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { parseSegments, extractCues, stripCues } from "@/lib/emotion";
import {
  createRecognition,
  speakSegments,
  primeVoices,
  recognitionSupported,
  resolveProfileVoice,
  speechSupported,
  type RecognitionHandle,
  type SpeakHandle,
} from "@/lib/voice-engine";
import { attachMicAnalyser, Waveform } from "@/components/brand/waveform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Keyboard,
  Volume2,
  Loader2,
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  Megaphone,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiEmployeeDTO } from "@/lib/types";

type Turn = {
  id: string;
  speaker: "human" | "ai";
  content: string; // raw with cues
  cues: string[];
  latencyMs?: number;
  interrupted?: boolean;
  source?: "llm" | "operator_script" | "operator_injection" | "operator_pending";
  at: number;
};

type Phase = "idle" | "requesting" | "live" | "ended";

const fmtDur = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function CallConsole({
  employees,
  onCallEnded,
}: {
  employees: AiEmployeeDTO[];
  onCallEnded?: () => void;
}) {
  const deployed = employees.filter((e) => e.status === "deployed");
  const [phase, setPhase] = useState<Phase>("idle");
  const [employeeId, setEmployeeId] = useState<string>(deployed[0]?.id ?? "");
  const [callId, setCallId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [summary, setSummary] = useState<{ turns: number; interruptions: number; cues: Record<string, number>; durationSec: number } | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  // Operator control: per-call directives + mid-call coaching
  const [directives, setDirectives] = useState("");
  const [coachOpen, setCoachOpen] = useState(true);
  const [coachDraft, setCoachDraft] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);

  const employee = deployed.find((e) => e.id === employeeId) ?? null;

  // engine refs
  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const speakRef = useRef<SpeakHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detachAnalyserRef = useRef<(() => void) | null>(null);
  const callIdRef = useRef<string | null>(null);
  const interruptedTurnIdRef = useRef<string | null>(null);
  const speakingRef = useRef(false);
  const activeRef = useRef(false);
  const lastAiTurnIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    primeVoices();
  }, []);

  // duration ticker
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // auto-scroll transcript
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, interim, thinking]);

  // track the latest AI turn so barge-in can mark exactly what it cut off
  useEffect(() => {
    const lastAi = [...turns].reverse().find((t) => t.speaker === "ai");
    lastAiTurnIdRef.current = lastAi?.id ?? null;
  }, [turns]);

  const stopAudio = useCallback(() => {
    speakRef.current?.cancel();
    speakRef.current = null;
    speakingRef.current = false;
    setSpeaking(false);
  }, []);

  const teardown = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.destroy();
    recognitionRef.current = null;
    stopAudio();
    detachAnalyserRef.current?.();
    detachAnalyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setListening(false);
    setInterim("");
    setAmplitudes([]);
  }, [stopAudio]);

  useEffect(() => () => teardown(), [teardown]);

  /* ---- send one turn ---- */
  const sendTurn = useCallback(
    async (content: string) => {
      const id = callIdRef.current;
      if (!id || !activeRef.current || !content.trim()) return;
      setThinking(true);
      setInterim("");
      const interruptedTurnId = interruptedTurnIdRef.current;
      interruptedTurnIdRef.current = null;

      try {
        const res = await fetch(`/api/calls/${id}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), interruptedTurnId: interruptedTurnId ?? undefined }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setTurns((ts) => [
            ...ts,
            { id: `sys-${Date.now()}`, speaker: "ai", content: data.error ?? "The AI service did not respond. Say it again or end the call.", cues: [], at: Date.now(), latencyMs: 0 },
          ]);
          setThinking(false);
          return;
        }
        setLastLatency(data.aiTurn.latencyMs);
        const aiTurn: Turn = {
          id: data.aiTurn.id,
          speaker: "ai",
          content: data.aiTurn.content,
          cues: data.aiTurn.cues ?? [],
          latencyMs: data.aiTurn.latencyMs,
          source: data.aiTurn.source ?? "llm",
          at: Date.now(),
        };
        setTurns((ts) => [...ts, aiTurn]);

        // Speak with emotion + the employee's assigned (cloned) voice profile
        if (speechSupported()) {
          const segments = parseSegments(data.aiTurn.content);
          speakingRef.current = true;
          setSpeaking(true);
          const vp = employee?.voiceProfile ?? null;
          const handle = speakSegments(segments, {
            voice: resolveProfileVoice(vp),
            pitchBias: vp?.pitch ?? 1,
            rateBias: vp?.rate ?? 1,
            onDone: () => {
              speakingRef.current = false;
              setSpeaking(false);
            },
          });
          speakRef.current = handle;
        }
      } catch {
        setTurns((ts) => [
          ...ts,
          { id: `sys-${Date.now()}`, speaker: "ai", content: "Network issue: your words were not delivered. Try again.", cues: [], at: Date.now(), latencyMs: 0 },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [],
  );

  /* ---- barge-in: user talks while AI speaks ---- */
  const onInterim = useCallback(
    (text: string) => {
      setInterim(text);
      if (text.trim().length > 1 && speakingRef.current) {
        // CUT the AI off mid-sentence: this is the barge-in.
        stopAudio();
        const lastAi = lastAiTurnIdRef.current;
        if (lastAi) {
          interruptedTurnIdRef.current = lastAi;
          setTurns((ts) => ts.map((t) => (t.id === lastAi ? { ...t, interrupted: true } : t)));
        }
      }
    },
    [stopAudio],
  );

  /* ---- operator coaching: make the AI say something NOW (exact) or obey a
     directive on its next reply (instruct). Breaks the conversation mid-flow,
     exactly like a supervisor leaning in. ---- */
  const speakAiText = useCallback(
    (raw: string, cues: string[], turnId: string) => {
      if (!speechSupported()) return;
      const segments = parseSegments(raw);
      speakingRef.current = true;
      setSpeaking(true);
      const vp = employee?.voiceProfile ?? null;
      const handle = speakSegments(segments, {
        voice: resolveProfileVoice(vp),
        pitchBias: vp?.pitch ?? 1,
        rateBias: vp?.rate ?? 1,
        onDone: () => {
          speakingRef.current = false;
          setSpeaking(false);
        },
      });
      speakRef.current = handle;
      void turnId;
    },
    [employee],
  );

  const sendCoach = useCallback(
    async (mode: "exact" | "instruct") => {
      const id = callIdRef.current;
      const text = coachDraft.trim();
      if (!id || !text || !activeRef.current) return;
      setCoachBusy(true);
      try {
        const res = await fetch(`/api/calls/${id}/coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setRecError(data.error ?? "The coaching message was not delivered.");
          return;
        }
        setCoachDraft("");
        if (mode === "exact" && data.aiTurn) {
          // The employee says the operator's words right now, verbatim.
          stopAudio(); // any in-flight speech yields to the operator
          const aiTurn: Turn = {
            id: data.aiTurn.id,
            speaker: "ai",
            content: data.aiTurn.content,
            cues: data.aiTurn.cues ?? [],
            latencyMs: 0,
            source: "operator_injection",
            at: Date.now(),
          };
          setTurns((ts) => [...ts, aiTurn]);
          speakAiText(data.aiTurn.content, data.aiTurn.cues ?? [], data.aiTurn.id);
        } else {
          // Pending directive: visible in the transcript until the next reply consumes it.
          setTurns((ts) => [
            ...ts,
            { id: `coach-${Date.now()}`, speaker: "ai" as const, content: text, cues: [], source: "operator_pending" as const, at: Date.now() },
          ]);
        }
      } catch {
        setRecError("Network issue: the coaching message was not delivered.");
      } finally {
        setCoachBusy(false);
      }
    },
    [coachDraft, speakAiText, stopAudio],
  );

  /* ---- start call ---- */
  const startCall = useCallback(async () => {
    if (!employee) return;
    setPhase("requesting");
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id, callDirectives: directives.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhase("idle");
        setRecError(data.error ?? "Could not start the call.");
        return;
      }
      callIdRef.current = data.call.id;
      setCallId(data.call.id);
      setTurns([]);
      setDuration(0);
      setSummary(null);
      setLastLatency(null);
      activeRef.current = true;
      setPhase("live");

      // Mic + real analyser
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        detachAnalyserRef.current = attachMicAnalyser(stream, setAmplitudes);
      } catch {
        setMicDenied(true); // honest: waveform needs mic permission
      }

      // STT
      if (recognitionSupported()) {
        const rec = createRecognition({
          onFinal: (text) => {
            setTurns((ts) => [...ts, { id: `h-${Date.now()}`, speaker: "human", content: text, cues: [], at: Date.now() }]);
            void sendTurn(text);
          },
          onInterim,
          onState: (s) => {
            setListening(s === "listening");
            setRecError(s === "error" ? "Microphone recognition hit an error: text mode still works." : null);
          },
        });
        recognitionRef.current = rec;
        rec?.start();
      } else {
        setTextMode(true); // Firefox et al: text mode is the honest path
      }
    } catch {
      setPhase("idle");
      setRecError("Could not start the call. Try again.");
    }
  }, [employee, onInterim, sendTurn]);

  /* ---- end call ---- */
  const endCall = useCallback(async () => {
    const id = callIdRef.current;
    const turnCount = turns.length;
    const interruptions = turns.filter((t) => t.interrupted).length;
    teardown();
    if (id) {
      try {
        await fetch(`/api/calls/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
      } catch {
        /* the call record stays live until the reaper: honest but harmless */
      }
    }
    const cueCount: Record<string, number> = {};
    for (const t of turns.filter((t) => t.speaker === "ai")) {
      for (const c of extractCues(t.content)) cueCount[c] = (cueCount[c] ?? 0) + 1;
    }
    setSummary({ turns: turnCount, interruptions, cues: cueCount, durationSec: duration });
    setPhase("ended");
    setCallId(null);
    callIdRef.current = null;
    onCallEnded?.();
  }, [teardown, turns, duration, onCallEnded]);

  const micOn = listening;
  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (micOn) rec.stop();
    else rec.start();
  };

  const cueTotal = Object.values(summary?.cues ?? {}).reduce((a, b) => a + b, 0);
  void cueTotal; // kept for honest diagnostics only; never shown as text to callers

  /* ================= RENDER ================= */

  if (phase === "idle" || phase === "requesting") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1220] p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1C3050] bg-[#0A1424]">
              <Phone className="h-5 w-5 text-[#4A90E2]" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display-strong text-xl text-white">Start a live test call</h2>
              <p className="mt-1 text-[13px] text-[#A1A1A1]">
                Your microphone, a real conversation, real interruptions. Nothing is simulated.
              </p>
            </div>
          </div>

          {deployed.length === 0 ? (
            <div className="mt-7 rounded-[3px] border border-dashed border-[#1C3050] bg-[#0A1322] p-6 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-[#A1A1A1]" strokeWidth={1.75} />
              <p className="mt-3 font-display text-[15px] font-bold text-white">No deployed employees yet</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#A1A1A1]">
                Deploy an AI employee first, then call it here in this browser.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-7 space-y-2">
                <p className="font-mono-dy text-[10.5px] tracking-[0.18em] text-[#A1A1A1]">WHO ARE YOU CALLING</p>
                <div className="space-y-2">
                  {deployed.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEmployeeId(e.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[3px] border px-4 py-3 text-left transition-colors ease-mechanical",
                        employeeId === e.id
                          ? "border-[#4A90E2]/60 bg-[#4A90E2]/[0.07]"
                          : "border-[#1C3050] bg-[#0A1424] hover:border-[#333]",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c1526] text-[11px] font-bold text-white">
                          {e.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <span className="block text-[14px] font-semibold text-white">{e.name}</span>
                          <span className="block text-[11.5px] text-[#A1A1A1]">
                            {e.tone} · {e.channels.join(" / ")}
                          </span>
                        </span>
                      </span>
                      {employeeId === e.id && <BadgeCheck className="h-4 w-4 text-[#4A90E2]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono-dy text-[10.5px] tracking-[0.18em] text-[#A1A1A1]">
                    DIRECTIVES FOR THIS CALL (OPTIONAL)
                  </p>
                  {employee && (employee.scriptRules?.length ?? 0) > 0 && (
                    <span className="chip-gold">
                      {employee.scriptRules.filter((r) => r.enabled).length} SCRIPT RULE{employee.scriptRules.filter((r) => r.enabled).length === 1 ? "" : "S"} ACTIVE
                    </span>
                  )}
                </div>
                <Textarea
                  value={directives}
                  onChange={(e) => setDirectives(e.target.value)}
                  rows={3}
                  maxLength={4000}
                  placeholder={
                    "Tell it what to say or how to answer on this exact call. It must obey.\ne.g. Offer the 20% discount to everyone today. Never mention the price until they ask."
                  }
                  className="mt-2 rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13px] leading-relaxed text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#6f6f6a]">
                  These apply to this call only, on top of the employee&apos;s standing instructions
                  and script rules. The employee treats them as orders, not suggestions.
                </p>
              </div>

              <div className="mt-6 rounded-[3px] border border-[#1C3050] bg-[#0A1424] px-4 py-3 font-mono-dy text-[10.5px] leading-relaxed tracking-[0.06em] text-[#6f6f6a]">
                ENGINE: BROWSER VOICE (REAL-TIME, NO PROVIDER ACCOUNT NEEDED). PRODUCTION PHONE
                CALLS USE THE TELEPHONY STACK AND REQUIRE A PROVIDER ACCOUNT · LABELED HONESTLY,
                NEVER FAKED.
                {recError && <span className="mt-1 block text-[#6fcbff]">{recError.toUpperCase()}</span>}
              </div>

              {/* Where it runs · the honest pipeline map, visible BEFORE you call */}
              <div className="mt-3 rounded-[3px] border border-dashed border-[#1C3050] bg-[#0A1322] px-4 py-3">
                <button
                  onClick={() => setShowHow((v) => !v)}
                  className="flex w-full items-center justify-between font-mono-dy text-[10px] tracking-[0.16em] text-[#6f6f6a] transition-colors hover:text-[#A1A1A1]"
                  aria-expanded={showHow}
                >
                  <span>HOW THIS CALL WORKS · WHERE EACH PART RUNS</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform ease-mechanical", showHow && "rotate-180")} />
                </button>
                {showHow && (
                  <div className="mt-3 space-y-2 font-mono-dy text-[10.5px] leading-[1.7] tracking-[0.02em] text-[#A1A1A1]">
                    <p>
                      <span className="text-white">1 · YOUR VOICE IN ·</span> runs in your browser. The Web
                      Speech API transcribes your microphone locally. The transcript text (not raw
                      audio) is what leaves this tab.
                    </p>
                    <p>
                      <span className="text-white">2 · THINKING ·</span> runs on this app&apos;s server. The text
                      is POSTed to /api/calls/&lt;id&gt;/turn, where the LLM answers with your
                      employee&apos;s instructions and knowledge. Per-turn latency is measured.
                    </p>
                    <p>
                      <span className="text-white">3 · VOICE OUT ·</span> runs in your browser. The reply is
                      spoken by speech synthesis: pitch, pace, pauses, and breathing shift with the
                      emotion of what is being said, so feeling is carried in the voice, never read out.
                    </p>
                    <p>
                      <span className="text-white">4 · BARGE-IN ·</span> your speech restarts recognition
                      and cancels synthesis instantly. The cut turn is marked interrupted and the
                      model is told you cut in.
                    </p>
                    <p className="pt-1 text-[#6f6f6a]">
                      PRODUCTION PATH · real phone numbers swap steps 1 and 3 for a telephony and
                      streaming speech provider (Deepgram, ElevenLabs, LiveKit, bring-your-own
                      accounts). The server pipeline stays the same.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={startCall}
                disabled={phase === "requesting" || !employee}
                className="mt-6 h-12 w-full rounded-[2px] bg-[#4A90E2] text-[14px] font-semibold text-white transition-all ease-mechanical hover:bg-[#2E7CDE] hover:shadow-[0_12px_36px_-8px_rgba(10,91,196,0.5)]"
              >
                {phase === "requesting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" /> Call {employee?.name ?? "employee"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === "ended" && summary) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1220] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#1C3050] bg-[#0A1424]">
            <PhoneOff className="h-5 w-5 text-[#A1A1A1]" strokeWidth={1.75} />
          </div>
          <h2 className="font-display-strong mt-5 text-xl text-white">Call ended</h2>
          <p className="mt-1.5 text-[13px] text-[#A1A1A1]">
            {fmtDur(summary.durationSec)} · transcript and metrics saved to your workspace.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-[#1C3050] bg-[#1C3050]">
            {[
              { l: "TURNS", v: summary.turns },
              { l: "BARGE-INS", v: summary.interruptions },
              { l: "DURATION", v: fmtDur(summary.durationSec) },
            ].map((s) => (
              <div key={s.l} className="bg-[#0A1424] p-4">
                <p className="font-display-strong text-2xl text-white">{s.v}</p>
                <p className="eyebrow-dy mt-1.5 text-[#A1A1A1]">{s.l}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => setPhase("idle")}
            className="mt-7 rounded-[2px] bg-white text-[13px] font-semibold text-[#070E1A] hover:bg-neutral-200"
          >
            Start another call
          </Button>
        </div>
      </div>
    );
  }

  /* ---- LIVE console ---- */
  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[4px] border border-[#1C3050] bg-[#0A1220] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c1526] text-[12px] font-bold text-white">
            {employee?.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="font-display text-[15px] font-bold text-white">{employee?.name}</p>
            <p className="font-mono-dy text-[10.5px] tracking-[0.1em] text-[#A1A1A1]">
              BROWSER VOICE ENGINE · {recognitionSupported() ? "STT ACTIVE" : "TEXT MODE"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastLatency !== null && (
            <span className="font-mono-dy text-[11px] tabular-nums tracking-[0.08em] text-[#6f6f6a]">
              {lastLatency}MS
            </span>
          )}
          <span className="dy-status dy-status-live">
            <span className="dy-status-dot" />
            LIVE · {fmtDur(duration)}
          </span>
        </div>
      </div>

      {/* Where this call actually runs: the honest pipeline map */}
      <div className="border-x border-[#1C3050] bg-[#0A1220] px-5 py-3">
        <button
          onClick={() => setShowHow((v) => !v)}
          className="flex w-full items-center justify-between font-mono-dy text-[10px] tracking-[0.16em] text-[#6f6f6a] transition-colors hover:text-[#A1A1A1]"
          aria-expanded={showHow}
        >
          <span>HOW THIS CALL WORKS · WHERE EACH PART RUNS</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform ease-mechanical", showHow && "rotate-180")} />
        </button>
        {showHow && (
          <div className="mt-3 space-y-2 font-mono-dy text-[10.5px] leading-[1.7] tracking-[0.02em] text-[#A1A1A1]">
            <p>
              <span className="text-white">1 · YOUR VOICE IN ·</span> runs in your browser. The Web Speech
              API transcribes your microphone locally. The transcript text (not raw audio) is what
              leaves this tab.
            </p>
            <p>
              <span className="text-white">2 · THINKING ·</span> runs on this app&apos;s server. The text is
              POSTed to /api/calls/&lt;id&gt;/turn, where the LLM answers with your employee&apos;s
              instructions and knowledge. Latency shown above is the measured round trip.
            </p>
            <p>
              <span className="text-white">3 · VOICE OUT ·</span> runs in your browser. The reply is
              spoken by speech synthesis: pitch, pace, pauses, and breathing shift with the emotion
              of what is being said, so feeling is carried in the voice, never read out.
            </p>
            <p>
              <span className="text-white">4 · BARGE-IN ·</span> your speech restarts recognition and
              cancels synthesis instantly. The cut turn is marked interrupted and the model is told
              you cut in.
            </p>
            <p className="pt-1 text-[#6f6f6a]">
              PRODUCTION PATH · real phone numbers swap steps 1 and 3 for a telephony and streaming
              speech provider (Deepgram, ElevenLabs, LiveKit, bring-your-own accounts). The server
              pipeline and every guarantee above stay the same.
            </p>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="dy-scroll max-h-[46vh] min-h-[280px] space-y-3 overflow-y-auto border-x border-[#1C3050] bg-[#070E1A] px-4 py-5"
        role="log"
        aria-label="Live call transcript"
      >
        {turns.length === 0 && !interim && !thinking && (
          <p className="pt-10 text-center font-mono-dy text-[11px] tracking-[0.14em] text-[#6f6f6a]">
            CONNECTED · SAY SOMETHING. THE MIC IS LIVE.
          </p>
        )}
        {turns.map((t) =>
          t.source === "operator_pending" ? (
            <div key={t.id} className="flex justify-end">
              <div className="dy-msg-in max-w-[86%] rounded-[18px] rounded-br-[6px] border border-dashed border-[#A9E2FF]/50 bg-[#A9E2FF]/[0.04] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-dy text-[9.5px] tracking-[0.16em] text-[#A9E2FF]">
                    YOUR ORDER · PENDING
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-snug text-[#cfe3f5] italic">{t.content}</p>
                <p className="mt-1 font-mono-dy text-[9px] tracking-[0.12em] text-[#6f6f6a]">
                  IT MUST OBEY THIS ON ITS NEXT REPLY
                </p>
              </div>
            </div>
          ) : t.speaker === "human" ? (
            <div key={t.id} className="flex items-end gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#24344F] bg-[#101B2E] text-[9px] font-bold text-[#8FA6C0]">
                YOU
              </div>
              <div className="dy-msg-in max-w-[82%] rounded-[18px] rounded-bl-[6px] border border-[#24344F] bg-[#101B2E] px-4 py-3 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)]">
                <p className="text-[13.5px] leading-snug text-neutral-200">{t.content}</p>
                <p className="mt-1 text-right font-mono-dy text-[8.5px] tracking-[0.08em] text-[#5d6b7d]">
                  {new Date(t.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex items-end justify-end gap-2.5">
              <div
                className={cn(
                  "dy-msg-in max-w-[86%] rounded-[18px] rounded-br-[6px] border px-4 py-3 shadow-[0_10px_28px_-14px_rgba(10,91,196,0.6)]",
                  t.source === "operator_injection"
                    ? "border-[#A9E2FF]/50 bg-[#A9E2FF]/[0.08]"
                    : t.interrupted
                      ? "border-[#4A90E2]/55 bg-[#4A90E2]/[0.08]"
                      : "border-[#2FD4FF]/15 bg-gradient-to-br from-[#1E5FB8]/45 to-[#2E7CDE]/25",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "font-mono-dy text-[9.5px] tracking-[0.16em]",
                      t.source === "operator_injection" ? "text-[#A9E2FF]" : "text-[#9FC6E8]",
                    )}
                  >
                    {employee?.name.toUpperCase()}
                    {t.source === "operator_script"
                      ? " · SCRIPTED"
                      : t.source === "operator_injection"
                        ? " · YOU SAID THIS"
                        : t.latencyMs !== undefined && t.latencyMs > 0
                          ? `: ${t.latencyMs}MS`
                          : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-snug text-[#F4FAFF]">{stripCues(t.content)}</p>
                <p className="mt-1 flex items-center justify-end gap-1 font-mono-dy text-[8.5px] tracking-[0.08em] text-[#9FC6E8]">
                  {new Date(t.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-label="spoken" className="ml-0.5">
                    <path d="M1 5.5L4 8.5L9 1.5" stroke="#7FB9EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 5.5L8.5 8.5L13.5 1.5" stroke="#7FB9EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
                  </svg>
                </p>
              </div>
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7CDE] to-[#1E5FB8] text-[9px] font-bold text-white",
                  t.source === "operator_injection" && "border border-[#A9E2FF]/50",
                )}
              >
                {employee?.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          ),
        )}
        {interim && (
          <div className="flex items-end gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#24344F] bg-[#101B2E] text-[9px] font-bold text-[#8FA6C0]">
              YOU
            </div>
            <div className="max-w-[82%] rounded-[18px] rounded-bl-[6px] border border-dashed border-[#24344F] bg-transparent px-4 py-3">
              <p className="flex items-center gap-1.5 font-mono-dy text-[9.5px] tracking-[0.16em] text-[#6f6f6a]">
                SPEAKING
                <span className="flex items-end gap-1">
                  <i className="h-1 w-1 rounded-full bg-[#6f6f6a]" style={{ animation: "dy-dot 1.2s 0s ease-in-out infinite" }} />
                  <i className="h-1 w-1 rounded-full bg-[#6f6f6a]" style={{ animation: "dy-dot 1.2s 0.18s ease-in-out infinite" }} />
                  <i className="h-1 w-1 rounded-full bg-[#6f6f6a]" style={{ animation: "dy-dot 1.2s 0.36s ease-in-out infinite" }} />
                </span>
              </p>
              <p className="mt-1 text-[13.5px] leading-snug text-neutral-500">{interim}</p>
            </div>
          </div>
        )}
        {thinking && (
          <div className="flex items-end justify-end gap-2.5">
            <div className="flex items-center rounded-[18px] rounded-br-[6px] border border-[#2FD4FF]/15 bg-gradient-to-br from-[#1E5FB8]/45 to-[#2E7CDE]/25 px-4 py-3.5">
              <span className="flex items-end gap-1" aria-label="thinking">
                <i className="h-[5px] w-[5px] rounded-full bg-[#6fcbff]" style={{ animation: "dy-dot 1.2s 0s ease-in-out infinite" }} />
                <i className="h-[5px] w-[5px] rounded-full bg-[#6fcbff]" style={{ animation: "dy-dot 1.2s 0.18s ease-in-out infinite" }} />
                <i className="h-[5px] w-[5px] rounded-full bg-[#6fcbff]" style={{ animation: "dy-dot 1.2s 0.36s ease-in-out infinite" }} />
              </span>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7CDE] to-[#1E5FB8] text-[9px] font-bold text-white">
              {employee?.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Operator coach: control the conversation mid-call */}
      <div className="border-x border-[#1C3050] bg-[#0A1220] px-4 py-3">
        <button
          onClick={() => setCoachOpen((v) => !v)}
          className="flex w-full items-center justify-between font-mono-dy text-[10px] tracking-[0.16em] text-[#A9E2FF] transition-colors hover:text-[#bfe4ff]"
          aria-expanded={coachOpen}
        >
          <span className="flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" />
            OPERATOR COACH · CONTROL THIS CALL LIVE
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform ease-mechanical", coachOpen && "rotate-180")} />
        </button>
        {coachOpen && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Input
                value={coachDraft}
                onChange={(e) => setCoachDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void sendCoach("exact");
                  }
                }}
                maxLength={2000}
                placeholder="Type what it must say now, or an order for its next reply…"
                className="rounded-[2px] border-[#16294a] bg-[#0E1B2E] text-[13px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#A9E2FF]"
              />
              <Button
                type="button"
                onClick={() => void sendCoach("exact")}
                disabled={coachBusy || !coachDraft.trim()}
                title="The employee says your words immediately, word for word (Ctrl+Enter)"
                className="h-10 flex-none rounded-[2px] bg-[#A9E2FF] px-4 text-[12.5px] font-bold text-[#0E1B2E] transition-all ease-mechanical hover:bg-[#bfe4ff] hover:shadow-[0_10px_30px_-8px_rgba(233,180,76,0.55)]"
              >
                {coachBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                Say now
              </Button>
              <Button
                type="button"
                onClick={() => void sendCoach("instruct")}
                disabled={coachBusy || !coachDraft.trim()}
                title="A directive the employee must obey on its next reply"
                className="h-10 flex-none rounded-[2px] border border-[#16294a] bg-[#0E1B2E] px-4 text-[12.5px] font-semibold text-[#A9E2FF] transition-colors ease-mechanical hover:bg-[#16294a]"
              >
                {coachBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Instruct
              </Button>
            </div>
            <p className="mt-2 font-mono-dy text-[9.5px] leading-relaxed tracking-[0.08em] text-[#6f6f6a]">
              SAY NOW · your words become its next sentence, verbatim, in its assigned voice. INSTRUCT ·
              it obeys your order when it next speaks. ITS SCRIPT RULES ALSO ANSWER VERBATIM WHEN THE
              CALLER&apos;S WORDS MATCH.
            </p>
          </div>
        )}
      </div>

      {/* Waveform strip */}
      <div className="border-x border-[#1C3050] bg-[#0A1220] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono-dy text-[9.5px] tracking-[0.16em] text-[#6f6f6a]">
            {speaking ? "SPEECH · SYNTH ACTIVE" : micDenied ? "MIC PERMISSION DENIED · TEXT MODE INTACT" : "MIC · REAL AMPLITUDE"}
          </span>
          <span className="flex items-center gap-2">
            {speaking ? (
              <span className="dy-bar-anim flex h-4 items-end gap-[2px]" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ height: "100%", animationDelay: `${i * 0.09}s` }} />
                ))}
              </span>
            ) : (
              <Volume2 className={cn("h-3.5 w-3.5", listening ? "text-[#4A90E2]" : "text-[#6f6f6a]")} />
            )}
          </span>
        </div>
        <Waveform
          amplitudes={speaking ? [] : amplitudes}
          height={44}
          color="#4A90E2"
          label={speaking ? "Synthesized speech active" : "Your live microphone amplitude"}
        />
      </div>

      {/* Controls */}
      <div className="rounded-b-[4px] border border-t-0 border-[#1C3050] bg-[#0A1220] px-4 py-4">
        {textMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = textDraft.trim();
              if (!text) return;
              setTurns((ts) => [...ts, { id: `h-${Date.now()}`, speaker: "human", content: text, cues: [], at: Date.now() }]);
              setTextDraft("");
              void sendTurn(text);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              placeholder="Type what you would say out loud…"
              maxLength={4000}
              className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13.5px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
            />
            <Button type="submit" disabled={!textDraft.trim() || thinking}
              className="rounded-[2px] bg-[#4A90E2] text-[13px] font-semibold text-white hover:bg-[#2E7CDE]">
              Say
            </Button>
            <button
              type="button"
              onClick={endCall}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#4A90E2] text-white shadow-[0_8px_28px_-6px_rgba(10,91,196,0.6)] transition-all ease-mechanical hover:bg-[#2E7CDE]"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                disabled={!recognitionRef.current}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-colors ease-mechanical",
                  micOn
                    ? "border-[#4A90E2]/50 bg-[#4A90E2]/[0.08] text-white"
                    : "border-[#1C3050] bg-[#0A1424] text-[#A1A1A1] hover:text-white",
                )}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                title={micOn ? "Mute" : "Unmute"}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setTextMode(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1C3050] bg-[#0A1424] text-[#A1A1A1] transition-colors hover:text-white"
                aria-label="Switch to text mode"
                title="Switch to text mode"
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <span className="ml-1 font-mono-dy text-[10px] tracking-[0.14em] text-[#6f6f6a]">
                {micOn ? "LISTENING · SPEAK, OR INTERRUPT ANYTIME" : "MIC OFF · TEXT MODE"}
              </span>
            </div>
            <button
              onClick={endCall}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4A90E2] text-white shadow-[0_8px_28px_-6px_rgba(10,91,196,0.6)] transition-all ease-mechanical hover:bg-[#2E7CDE]"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        {recError && (
          <p className="mt-2 font-mono-dy text-[10px] leading-relaxed tracking-[0.08em] text-[#6fcbff]">
            {recError.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
}
