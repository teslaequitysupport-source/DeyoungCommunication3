"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Waveform } from "@/components/brand/waveform";
import { Reveal } from "@/components/marketing/sections";
import { Apple, Play, Bell, Mic, Brain, ArrowRight, Check, Smartphone, MonitorSmartphone } from "lucide-react";

/* ==================================================================
   SHOWREEL · a self-playing simulated call, honestly labeled.
   Every line types out, every cue is visible, interruptions show
   their yield time. SIMULATED badge stays on, always.
   ================================================================== */

type Line = {
  who: "caller" | "ai";
  text: string;
  cues?: string[];
  source?: string;
  cutIn?: number; // ms the AI yielded when interrupted
  outcome?: string;
};

type Scenario = {
  id: string;
  tab: string;
  role: string;
  employee: string;
  lines: Line[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "reception",
    tab: "RECEPTIONIST",
    role: "Answering every line at a clinic",
    employee: "ADA · AI RECEPTIONIST",
    lines: [
      { who: "caller", text: "Hi, um, do you take my insurance? Sorry, I mean, is Doctor Reyes in on Fridays?" },
      { who: "ai", text: "No need to apologize. We take most major plans, and Doctor Reyes is in every Friday until four.", cues: ["warm"], source: "INSURANCE.POLICY" },
      { who: "caller", text: "Oh good, so could I book, hold on, what about the morning instead of" },
      { who: "ai", text: "[quick] Friday nine thirty works. Should I hold it for you?", cues: ["quick"], cutIn: 120 },
      { who: "caller", text: "Yes please. Morning person." },
      { who: "ai", text: "Done, nine thirty, held under your name. A reminder text goes out the day before.", cues: ["warm"], source: "BOOKING.RULES", outcome: "APPOINTMENT HELD · SMS REMINDER QUEUED" },
    ],
  },
  {
    id: "sales",
    tab: "SALES",
    role: "Qualifying without pressure",
    employee: "MARCO · AI SALES ASSISTANT",
    lines: [
      { who: "caller", text: "I saw your ad. What is the actual price, not the teaser?" },
      { who: "ai", text: "[direct] Honest answer: plans start at forty nine a month, and the teaser price needs an annual commitment.", cues: ["direct"], source: "PRICING.SHEET" },
      { who: "caller", text: "And if I only need it for my two busy days, Monday and" },
      { who: "ai", text: "[quick] Then the starter plan covers it. No seat minimums.", cues: ["quick"], cutIn: 140 },
      { who: "caller", text: "Huh. Usually people dodge that question." },
      { who: "ai", text: "Dodging is expensive. Want the two-day setup guide sent over?", cues: ["warm"], outcome: "LEAD QUALIFIED · GUIDE SENT" },
    ],
  },
  {
    id: "support",
    tab: "SUPPORT",
    role: "Staying calm through a broken order",
    employee: "JUNE · AI SUPPORT AGENT",
    lines: [
      { who: "caller", text: "This is the second time my order is wrong. I am honestly about to give up on you guys." },
      { who: "ai", text: "That is twice too many, and I hear you. Let us make it right before you decide anything.", cues: ["empathetic", "breath"] },
      { who: "caller", text: "The charger, again, wrong one in the box. I do not even want to explain it all" },
      { who: "ai", text: "[quick] You do not have to. Order four one two nine, correct charger, ships today, no charge.", cues: ["quick"], cutIn: 130, source: "ORDER.HISTORY" },
      { who: "caller", text: "Well. Okay. That was easy." },
      { who: "ai", text: "It should have been easy the first time. Tracking hits your phone within the hour.", cues: ["warm"], outcome: "RESOLVED · REPLACEMENT SHIPPED" },
    ],
  },
  {
    id: "scheduler",
    tab: "SCHEDULER",
    role: "Juggling six calendars at once",
    employee: "RHEA · AI SCHEDULER",
    lines: [
      { who: "caller", text: "I need one of your engineers this week. Anyone. It is urgent." },
      { who: "ai", text: "[direct] Understood. I see a cancellation tomorrow at eleven with Priya, your integration specialist.", cues: ["direct"], source: "TEAM.CALENDAR" },
      { who: "caller", text: "Tomorrow works. Actually wait, does she handle payment APIs or is that" },
      { who: "ai", text: "[quick] Payment APIs are exactly her lane. Eleven tomorrow, thirty minutes, camera optional.", cues: ["quick"], cutIn: 110 },
      { who: "caller", text: "Book it. And sorry for the panic." },
      { who: "ai", text: "No apology needed. Urgent is what tomorrow slots are for.", cues: ["warm"], outcome: "SLOT BOOKED · PREP NOTES SENT TO PRIYA" },
    ],
  },
];

export function Showreel() {
  const [scenario, setScenario] = useState(0);
  const [visible, setVisible] = useState(0); // lines shown
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const sc = SCENARIOS[scenario];

  const pick = (i: number) => {
    setScenario(i);
    setVisible(0);
    setDone(false);
  };

  useEffect(() => {
    if (paused || done) return;
    const total = sc.lines.length;
    if (visible >= total) {
      const t = setTimeout(() => setDone(true), 900);
      return () => clearTimeout(t);
    }
    const line = sc.lines[visible];
    const readMs = Math.min(2600, 650 + line.text.length * 16);
    // Start typing inside a microtask so no setState runs synchronously
    // during the effect body (react-hooks/set-state-in-effect).
    const t0 = setTimeout(() => setTyping(true), 0);
    const t1 = setTimeout(() => setTyping(false), readMs);
    const t2 = setTimeout(() => setVisible((v) => v + 1), readMs + 420);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, paused, done, sc]);

  const replay = () => {
    setVisible(0);
    setDone(false);
    setPaused(false);
  };

  const progress = done ? 100 : Math.round((visible / sc.lines.length) * 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      {/* Stage */}
      <div className="overflow-hidden rounded-[4px] border border-white/10 bg-ink-2">
        {/* Tab strip */}
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => pick(i)}
              className={cn(
                "rounded-[3px] px-3 py-1.5 font-mono-dy text-[10.5px] font-semibold tracking-[0.12em] transition-colors ease-mechanical",
                i === scenario
                  ? "bg-[#4A90E2] text-white"
                  : "text-neutral-400 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {s.tab}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <span className="chip-gold">SIMULATED DEMO</span>
          </span>
        </div>

        {/* Employee header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2FD4FF] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2FD4FF]" />
            </span>
            <span className="font-mono-dy text-[11px] font-semibold tracking-[0.14em] text-white">{sc.employee}</span>
          </div>
          <span className="hidden font-mono-dy text-[10px] tracking-[0.12em] text-neutral-500 sm:block">{sc.role.toUpperCase()}</span>
        </div>

        {/* Transcript */}
        <div className="min-h-[380px] space-y-4 px-5 py-5">
          {sc.lines.slice(0, visible).map((l, i) => (
            <div key={i} className={cn("flex flex-col gap-1.5", l.who === "caller" ? "items-start" : "items-end")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[4px] border px-4 py-2.5",
                  l.who === "caller"
                    ? "border-white/10 bg-white/[0.05] text-neutral-200"
                    : "border-[#2FD4FF]/25 bg-[#0A5BC4]/[0.12] text-white",
                )}
              >
                <p className="text-[14px] leading-relaxed">{l.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {l.source && <span className="cue-chip cue-soft">SOURCE · {l.source}</span>}
                  {l.cutIn !== undefined && (
                    <span className="cue-chip" style={{ borderColor: "rgba(47,212,255,0.5)", color: "#2FD4FF" }}>
                      CUT IN · YIELDED {l.cutIn}MS
                    </span>
                  )}
                </div>
              </div>
              {l.outcome && (
                <span className="chip-gold mt-1">{l.outcome}</span>
              )}
            </div>
          ))}
          {typing && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 rounded-[4px] border border-[#2FD4FF]/25 bg-[#0A5BC4]/[0.12] px-4 py-3">
                <span className="font-mono-dy text-[10px] tracking-[0.12em] text-[#2FD4FF]">REASONING</span>
                <span className="flex gap-1">
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2FD4FF] [animation-delay:0ms]" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2FD4FF] [animation-delay:150ms]" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2FD4FF] [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          {done && (
            <button onClick={replay} className="btn-flare mx-auto mt-2 px-6 py-2.5 text-[13px]">
              Replay the call
            </button>
          )}
        </div>

        {/* Progress rail */}
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-2.5">
          <button
            onClick={() => setPaused((p) => !p)}
            className="font-mono-dy text-[10px] tracking-[0.12em] text-neutral-400 transition-colors hover:text-white"
          >
            {paused ? "RESUME" : "PAUSE"}
          </button>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4A90E2] to-[#2FD4FF] transition-all duration-500 ease-mechanical"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono-dy text-[10px] text-neutral-500">{progress}%</span>
        </div>
      </div>

      {/* Live vitals rail */}
      <div className="flex flex-col gap-3">
        <div className="rounded-[4px] border border-white/10 bg-ink-2 p-4">
          <p className="eyebrow-dy mb-3 text-neutral-500">LIVE VITALS</p>
          <div className="mb-3 rounded-[3px] border border-white/[0.08] bg-[#070E1A] p-3">
            <Waveform amplitudes={SAMPLE_WAVE} color="#2FD4FF" baselineColor="#1C3050" height={44} label="OUTPUT" />
          </div>
          <dl className="space-y-2.5">
            {[
              ["EMOTION", "WARM · SETTLED"],
              ["FIRST TOKEN", "318 MS"],
              ["GROUNDING", "3 OF 3 TURNS"],
              ["HANDOFF", "NOT NEEDED"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-b-0 last:pb-0">
                <dt className="font-mono-dy text-[9.5px] tracking-[0.14em] text-neutral-500">{k}</dt>
                <dd className="font-mono-dy text-[10.5px] font-semibold text-[#A9E2FF]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-[4px] border border-white/10 bg-ink-2 p-4">
          <p className="eyebrow-dy mb-2 text-neutral-500">WHAT YOU ARE WATCHING</p>
          <p className="text-[12.5px] leading-relaxed text-neutral-400">
            A scripted sample of a real call flow. Your live version runs the same engine: real speech recognition,
            real reasoning, real interruptions. Test it yourself in Voice Studio.
          </p>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_WAVE = Array.from({ length: 42 }, (_, i) => {
  const v = Math.sin(i * 0.55) * 0.5 + Math.sin(i * 0.21) * 0.35 + 0.5;
  return Math.max(0.08, Math.min(1, v));
});

/* ==================================================================
   APP SECTION · store badges with honest COMING SOON, full app UI
   phone mockup, working notify list. Not a WhatsApp bot.
   ================================================================== */

export function AppSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const notify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, platform: "app" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      {/* Copy + badges + notify */}
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip-gold">IN YOUR POCKET</span>
          <span className="font-mono-dy text-[10px] tracking-[0.14em] text-neutral-500">IOS · ANDROID · WEB · DESKTOP</span>
        </div>
        <h3 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          Your whole front desk, one thumb away.
        </h3>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-400">
          Every live call, transcript, and handoff in a real mobile app. Not a WhatsApp bot. Not a Telegram channel.
          A native app for iOS and Android, plus full web and desktop.
        </p>

        {/* Store badges */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <StoreBadge icon={<Apple className="h-6 w-6 fill-white" />} top="Download on the" bottom="App Store" />
          <StoreBadge icon={<Play className="h-6 w-6 fill-white" />} top="GET IT ON" bottom="Google Play" />
        </div>
        <p className="mt-3 font-mono-dy text-[10px] tracking-[0.14em] text-neutral-500">
          BOTH STORES: SUBMITTED, COMING SOON. SHIP NOTIFICATION BELOW.
        </p>

        {/* Notify form */}
        <form onSubmit={notify} className="mt-6 flex max-w-md gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setState("idle");
            }}
            placeholder="you@business.com"
            className="h-11 flex-1 rounded-[3px] border border-white/15 bg-ink-2 px-3.5 text-[14px] text-white placeholder:text-neutral-600 focus:border-[#2FD4FF]/60 focus:outline-none"
          />
          <button type="submit" disabled={state === "sending"} className="btn-flare px-5 py-2.5 text-[13px]">
            {state === "sending" ? "Adding..." : state === "done" ? "You are on the list" : "Notify me"}
          </button>
        </form>
        {state === "done" && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#A9E2FF]">
            <Check className="h-3.5 w-3.5" /> We will email the moment each store approves the build.
          </p>
        )}
        {state === "error" && (
          <p className="mt-2 text-[12.5px] text-[#d08700]">That email did not look right, try again.</p>
        )}
      </div>

      {/* Phone mockup with full app UI */}
      <div className="mx-auto w-full max-w-[300px] [perspective:1200px]">
        <div className="tilt-3d relative rounded-[36px] border border-white/15 bg-[#0A1424] p-2.5 shadow-[0_40px_80px_-30px_rgba(10,91,196,0.45)]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#070E1A]">
            {/* Status bar + notch */}
            <div className="relative flex items-center justify-between px-5 pt-3 pb-1">
              <span className="font-mono-dy text-[10px] text-neutral-400">9:41</span>
              <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
              <span className="font-mono-dy text-[10px] text-neutral-400">5G · 100%</span>
            </div>

            {/* LIVE call card */}
            <div className="mx-3 mt-2 rounded-[8px] border border-[#2FD4FF]/30 bg-[#0A5BC4]/[0.14] p-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-[#2FD4FF] opacity-70 motion-reduce:hidden" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[#2FD4FF]" />
                </span>
                <span className="font-mono-dy text-[9.5px] font-bold tracking-[0.16em] text-[#2FD4FF]">LIVE · ADA · 01:24</span>
                <span className="ml-auto font-mono-dy text-[9px] text-neutral-500">MAYA CLINIC</span>
              </div>
              <div className="mt-2.5 flex justify-center py-1">
                <Waveform amplitudes={SAMPLE_WAVE} color="#2FD4FF" baselineColor="#1C3050" height={30} label="" />
              </div>
              <div className="mt-1 space-y-1.5 text-[11px] leading-snug">
                <p className="text-neutral-300">
                  <span className="font-mono-dy text-[9px] text-neutral-500">CALLER · </span>
                  What time do you close on Fridays?
                </p>
                <p className="text-white">
                  <span className="font-mono-dy text-[9px] text-[#2FD4FF]">ADA · </span>
                  Four in the afternoon, and the last cleaning slot is at three.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-[4px] border border-white/15 bg-white/[0.06] py-1.5 font-mono-dy text-[9.5px] font-bold tracking-[0.12em] text-white">
                  TAKEOVER
                </button>
                <button className="rounded-[4px] border border-[#2FD4FF]/40 bg-[#0A5BC4]/25 py-1.5 font-mono-dy text-[9.5px] font-bold tracking-[0.12em] text-[#2FD4FF]">
                  END CALL
                </button>
              </div>
            </div>

            {/* Floating telemetry chips */}
            <div className="mx-3 mt-2 flex flex-wrap gap-1.5">
              <span className="cue-chip cue-soft">VOICE · WARM TONE</span>
              <span className="cue-chip cue-soft">312 MS</span>
              <span className="cue-chip cue-soft">SOURCE · HOURS.TXT</span>
            </div>

            {/* Bottom nav */}
            <div className="mt-3 flex items-center justify-around border-t border-white/[0.08] px-2 py-2.5">
              {[
                { icon: Mic, label: "CALLS", active: true },
                { icon: Brain, label: "TEAM" },
                { icon: Bell, label: "ALERTS" },
                { icon: MonitorSmartphone, label: "MORE" },
              ].map((n) => (
                <div key={n.label} className="flex flex-col items-center gap-1">
                  <n.icon className={cn("h-4 w-4", n.active ? "text-[#2FD4FF]" : "text-neutral-600")} />
                  <span className={cn("font-mono-dy text-[8px] tracking-[0.1em]", n.active ? "text-[#2FD4FF]" : "text-neutral-600")}>
                    {n.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreBadge({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-[8px] border border-white/20 bg-white/[0.04] px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        {icon}
        <div>
          <p className="font-mono-dy text-[8.5px] tracking-[0.14em] text-neutral-400">{top.toUpperCase()}</p>
          <p className="font-display text-[15px] font-semibold leading-tight text-white">{bottom}</p>
        </div>
      </div>
      <span className="chip-gold absolute -right-2 -top-2">COMING SOON</span>
    </div>
  );
}

/* ==================================================================
   VOICE CLONE SECTION · your voice, their shift.
   Honest: measurement + matching live today; neural timbre pending.
   ================================================================== */

export function VoiceCloneSection() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      {/* Visual: your sample becomes the AI voice */}
      <div className="order-2 lg:order-1">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-[4px] border border-white/10 bg-ink-2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow-dy text-neutral-500">YOUR RECORDING · 30 SECONDS</p>
              <span className="cue-chip cue-soft">CONSENT ON FILE</span>
            </div>
            <Waveform amplitudes={Array.from({ length: 36 }, (_, i) => Math.max(0.1, Math.min(1, Math.sin(i * 0.4) * 0.55 + 0.5)))} color="#4A90E2" baselineColor="#1C3050" height={48} label="SAMPLE" />
          </div>

          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2FD4FF]/40 bg-[#0A5BC4]/20 shadow-[0_0_24px_rgba(47,212,255,0.35)]">
              <ArrowRight className="h-4 w-4 rotate-90 text-[#2FD4FF]" />
            </div>
          </div>

          <div className="rounded-[4px] border border-[#2FD4FF]/30 bg-[#0A5BC4]/[0.1] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow-dy text-[#A9E2FF]">AI SPEAKING IN YOUR VOICE</p>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#2FD4FF] opacity-70 motion-reduce:hidden" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#2FD4FF]" />
              </span>
            </div>
            <div className="dy-bar-anim flex h-12 items-end gap-1.5" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => {
                const h = 18 + Math.abs(Math.sin(i * 0.7)) * 30;
                return <span key={i} style={{ height: `${h}px`, animationDelay: `${(i % 7) * 90}ms` }} />;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="order-1 lg:order-2">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip-gold">VOICE CLONING</span>
          <span className="font-mono-dy text-[10px] tracking-[0.14em] text-neutral-500">UPLOAD AUDIO · CLONE LIVE</span>
        </div>
        <h3 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          Record once. It answers in your voice, every shift.
        </h3>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-400">
          Upload a short sample. Your AI employee measures your pitch, pace, and register, then speaks with them on
          every call. Customers hear a voice that already sounds like your business.
        </p>

        <ol className="mt-6 space-y-3">
          {[
            ["Record a 30 second sample", "Read anything. We measure pitch, pace, register, energy."],
            ["We build the profile", "Consent is captured and stored with the clone, by name, every time."],
            ["Assign it to any employee", "One clone can front your receptionist, or give each hire its own voice."],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-3">
              <span className="font-mono-dy mt-0.5 text-[11px] font-bold text-[#2FD4FF]">0{i + 1}</span>
              <div>
                <p className="text-[14.5px] font-semibold text-white">{t}</p>
                <p className="text-[13px] leading-relaxed text-neutral-500">{b}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-[4px] border border-white/10 bg-ink-2 p-4">
          <p className="eyebrow-dy mb-2 text-neutral-500">PER-CALL INSTRUCTIONS, OBEYED FIRST</p>
          <p className="text-[13.5px] leading-relaxed text-neutral-300">
            Type instructions before any call: <span className="font-mono-dy text-[#A9E2FF]">answer in three words</span>,{" "}
            <span className="font-mono-dy text-[#A9E2FF]">mention the Friday discount</span>,{" "}
            <span className="font-mono-dy text-[#A9E2FF]">stay under fifteen words</span>. Your directive outranks every
            default rule for that call.
          </p>
        </div>

        <p className="mt-4 font-mono-dy text-[10.5px] leading-relaxed tracking-[0.06em] text-neutral-500">
          LIVE TODAY: PITCH, PACE, REGISTER MATCHING. NEURAL TIMBRE CLONE: PENDING, LABELED HONESTLY. NO CONSENT, NO
          CLONE. EVER.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a href="#/app/clone-lab" className="btn-flare px-6 py-3 text-[14px]">
            Open Clone Lab
          </a>
          <a href="#/pricing" className="btn-glass px-6 py-3 text-[14px]">
            See plans
          </a>
        </div>
      </div>
    </div>
  );
}

/* Utility: hydration-safe amplitudes (precomputed, no Math.sin at render) */
export const CLONE_SAMPLE = Array.from({ length: 32 }, (_, i) => {
  const v = Number((Math.sin(i * 0.45) * 0.5 + 0.5).toFixed(1));
  return Math.max(0.1, Math.min(1, v));
});

export function SmartphoneNote() {
  return <Smartphone className="h-4 w-4" />;
}
