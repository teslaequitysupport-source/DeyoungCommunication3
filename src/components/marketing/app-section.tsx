"use client";

import { useRef, useState } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { Waveform } from "@/components/brand/waveform";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Monitor,
  Globe,
  Apple,
  Bell,
  Check,
  Mic,
  AudioLines,
  Upload,
  ArrowDown,
  UserRound,
  Phone,
  PhoneOff,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Hand,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Store badges · Apple App Store + Google Play · coming soon          */
/* ------------------------------------------------------------------ */

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.06 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.542v21.036c0 .187.04.369.112.542l10.848-10.561L1.337.924zm12.568 10.548l3.358-3.337-12.556-7.11c-.288-.163-.617-.207-.928-.145l10.126 10.592zm0 2.077L2.744 24.135c.31.06.638.016.923-.144l12.588-7.137-3.35-3.305z" />
    </svg>
  );
}

function StoreBadge({
  kind,
  inputRef,
}: {
  kind: "apple" | "play";
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const label = kind === "apple" ? "Download on the" : "GET IT ON";
  const store = kind === "apple" ? "App Store" : "Google Play";
  return (
    <button
      onClick={() => inputRef.current?.focus()}
      className="group relative flex w-full max-w-[230px] items-center gap-3.5 rounded-[10px] border border-white/20 bg-black px-5 py-3.5 text-left transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-[#2fd4ff]/50 hover:shadow-[0_16px_40px_-14px_rgba(47,212,255,0.35)]"
      aria-label={`${store} app coming soon: get notified`}
    >
      {kind === "apple" ? (
        <AppleGlyph className="h-8 w-8 flex-none text-white" />
      ) : (
        <PlayGlyph className="h-8 w-8 flex-none text-white" />
      )}
      <span className="flex flex-col">
        <span className="font-mono-dy text-[10px] tracking-[0.14em] text-neutral-400">{label.toUpperCase()}</span>
        <span className="font-display text-[17px] font-bold leading-tight text-white">{store}</span>
      </span>
      <span className="absolute -right-2 -top-2.5 rounded-[3px] border border-[#2fd4ff]/50 bg-ink px-2 py-0.5 font-mono-dy text-[9px] font-semibold tracking-[0.12em] text-[#6fe4ff] shadow-[0_6px_18px_-6px_rgba(47,212,255,0.5)]">
        COMING SOON
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Phone mockup · the workspace app UI in a device                    */
/* ------------------------------------------------------------------ */

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px]">
      {/* Float chips */}
      <div className="absolute -left-8 top-16 z-10 hidden animate-[floatY_4s_ease-in-out_infinite] rounded-[4px] border border-white/12 bg-ink-2/90 px-3 py-2 backdrop-blur-md sm:block lg:-left-14">
        <p className="font-mono-dy text-[9.5px] tracking-[0.14em] text-neutral-400">AVG RESPONSE</p>
        <p className="font-display text-[16px] font-bold text-[#6fe4ff]">0.9s</p>
      </div>
      <div className="absolute -right-6 bottom-24 z-10 hidden animate-[floatY_5s_ease-in-out_infinite_reverse] rounded-[4px] border border-white/12 bg-ink-2/90 px-3 py-2 backdrop-blur-md sm:block lg:-right-12">
        <p className="font-mono-dy text-[9.5px] tracking-[0.14em] text-neutral-400">HANDOFF</p>
        <p className="font-display text-[16px] font-bold text-white">
          1 tap <span className="text-[#6fe4ff]">live</span>
        </p>
      </div>

      {/* Device */}
      <div
        className="relative aspect-[9/19] rounded-[44px] border border-white/15 bg-[#0a1424] p-[7px] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(47,212,255,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-700 ease-mechanical [transform:perspective(1400px)_rotateY(-7deg)_rotateX(1.5deg)] hover:[transform:perspective(1400px)_rotateY(0deg)_rotateX(0deg)]"
        role="img"
        aria-label="The DEYOUNG app on a phone: a live call with an AI employee, takeover and end call controls"
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-white/20" aria-hidden="true" />
        <span className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-l bg-white/20" aria-hidden="true" />
        <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-white/20" aria-hidden="true" />
        {/* Screen */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-ink grain-dy">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-20 h-[22px] w-[100px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
          {/* Status bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-3 font-mono-dy text-[10px] text-neutral-300">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full border border-neutral-300" />
              <span className="inline-block h-2 w-3.5 rounded-[2px] border border-neutral-300" />
            </span>
          </div>

          {/* App header */}
          <div className="mt-1.5 flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect x="5" y="5" width="4" height="22" rx="1" fill="#EAF4FF" />
                <rect x="12" y="8" width="14" height="3.4" rx="1.2" fill="#EAF4FF" />
                <rect x="12" y="14.3" width="15" height="3.4" rx="1.2" fill="#00C8FF" />
                <rect x="12" y="20.6" width="10" height="3.4" rx="1.2" fill="#EAF4FF" />
              </svg>
              <span className="font-display text-[12px] font-bold tracking-[0.02em] text-white">
                DEYOUNG<span className="text-[#00c8ff]">.</span>
              </span>
            </span>
            <span className="dy-status dy-status-live font-mono-dy text-[9px] tracking-[0.14em]">
              <span className="dy-status-dot" />
              LIVE
            </span>
          </div>

          {/* Live call card */}
          <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
            <div className="flex items-center gap-3 rounded-[6px] border border-[#2fd4ff]/25 bg-[#2fd4ff]/[0.06] p-3">
              <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#2fd4ff]/40 bg-ink-2 font-display text-[15px] font-bold text-[#6fe4ff]">
                G
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-[#2fd4ff]" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[14px] font-bold text-white">Grace</p>
                <p className="font-mono-dy text-[9.5px] tracking-[0.12em] text-neutral-400">RECEPTIONIST · 02:14</p>
              </div>
              <span className="ml-auto font-mono-dy text-[9.5px] text-neutral-500">IN CALL</span>
            </div>

            {/* Waveform */}
            <div className="dy-bar-anim flex h-10 items-end justify-center gap-[3px] rounded-[6px] border border-white/10 bg-ink-2 px-3 py-2">
              {Array.from({ length: 34 }).map((_, i) => (
                <span
                  key={i}
                  className="block w-[3px] rounded-[2px] bg-[#2fd4ff]"
                  style={{
                    height: `${(30 + Math.abs(Math.sin(i * 1.3)) * 65).toFixed(1)}%`,
                    animationDelay: `${(i % 8) * 100}ms`,
                    animationDuration: `${800 + (i % 4) * 150}ms`,
                  }}
                />
              ))}
            </div>

            {/* Transcript */}
            <div className="space-y-2.5">
              <div className="max-w-[88%] rounded-[5px] border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="font-mono-dy text-[8.5px] tracking-[0.18em] text-neutral-600">CALLER</p>
                <p className="mt-1 text-[11.5px] leading-snug text-neutral-300">
                  Can you move my cleaning to Friday morning?
                </p>
              </div>
              <div className="ml-auto max-w-[88%] rounded-[5px] border border-[#2fd4ff]/25 bg-[#2fd4ff]/[0.06] px-3 py-2">
                <p className="font-mono-dy text-[8.5px] tracking-[0.18em] text-[#6fe4ff]">GRACE · AI</p>
                <p className="mt-1 text-[11.5px] leading-snug text-neutral-100">Friday at 9:00 is open. Want me to lock it in?</p>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  <span className="cue-chip !px-1.5 !py-[1px] !text-[8.5px]">[warm]</span>
                  <span className="cue-chip cue-soft !px-1.5 !py-[1px] !text-[8.5px]">[quick]</span>
                </span>
              </div>
            </div>
          </div>

          {/* Call actions */}
          <div className="flex gap-2 px-4 pb-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-white/15 bg-white/5 py-2.5 font-mono-dy text-[10px] font-semibold tracking-[0.12em] text-neutral-200">
              <Hand className="h-3 w-3" strokeWidth={1.8} />
              TAKEOVER
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-gradient-to-b from-[#45b6ff] to-[#2a58a8] py-2.5 font-mono-dy text-[10px] font-semibold tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(47,212,255,0.5)]">
              <PhoneOff className="h-3 w-3" strokeWidth={1.8} />
              END CALL
            </button>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around border-t border-white/8 px-2 pb-4 pt-2.5">
            {[LayoutDashboard, Phone, MessageSquare, Settings].map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[5px]",
                  i === 1 ? "bg-[#2fd4ff]/12 text-[#6fe4ff]" : "text-neutral-600",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The app section                                                     */
/* ------------------------------------------------------------------ */

export function AppSection() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const notify = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, platform }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
      {/* Copy + badges + notify */}
      <div className="lg:col-span-6">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { icon: Apple, label: "iOS" },
            { icon: Smartphone, label: "ANDROID" },
            { icon: Globe, label: "WEB" },
            { icon: Monitor, label: "DESKTOP" },
          ].map((p) => (
            <span
              key={p.label}
              className="flex items-center gap-1.5 rounded-[3px] border border-white/10 bg-ink-2 px-2.5 py-1 font-mono-dy text-[10px] font-semibold tracking-[0.14em] text-neutral-300"
            >
              <p.icon className="h-3 w-3 text-[#6fe4ff]" strokeWidth={1.8} />
              {p.label}
            </span>
          ))}
        </div>

        <h3 className="font-display-strong mt-6 text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] tracking-[-0.03em] text-balance-dy">
          Your whole front desk, <span className="text-flare">in your pocket.</span>
        </h3>

        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-400">
          Not a WhatsApp bot. Not a Telegram channel. One real app that works across every platform: the same live
          calls, the same instant takeover, the same transcripts and analytics, everywhere you are.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <StoreBadge kind="apple" inputRef={emailRef} />
          <StoreBadge kind="play" inputRef={emailRef} />
        </div>

        {/* Notify me */}
        <div className="mt-8 max-w-lg rounded-[5px] border border-white/10 bg-ink-2 p-5">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-[#6fe4ff]" strokeWidth={1.8} />
            <p className="font-display text-[14px] font-bold text-white">Get notified at launch</p>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
            One email the day the app ships. Nothing else, ever.
          </p>
          {state === "done" ? (
            <div className="mt-4 flex items-center gap-2.5 rounded-[4px] border border-[#2fd4ff]/30 bg-[#2fd4ff]/[0.08] px-4 py-3">
              <Check className="h-4 w-4 text-[#6fe4ff]" strokeWidth={2} />
              <p className="text-[13px] font-semibold text-[#6fe4ff]">
                You are on the list. We will email you the moment it goes live.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === "error") setState("idle");
                  }}
                  placeholder="you@company.com"
                  className={cn(
                    "h-11 flex-1 rounded-[4px] border bg-ink-3 px-4 text-[13.5px] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1",
                    state === "error" ? "border-[#ef4444]/60 focus:border-[#ef4444] focus:ring-[#ef4444]" : "border-white/12 focus:border-[#2fd4ff] focus:ring-[#2fd4ff]/60",
                  )}
                  aria-label="Email address for launch notification"
                />
                <Button onClick={notify} disabled={state === "sending"} className="btn-flare h-11 px-6 text-[13px]">
                  {state === "sending" ? "SAVING" : "NOTIFY ME"}
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono-dy text-[10px] tracking-[0.12em] text-neutral-600">PLATFORM</span>
                {(["ios", "android"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "rounded-[3px] border px-3 py-1.5 font-mono-dy text-[10.5px] font-semibold tracking-[0.12em] transition-colors ease-mechanical",
                      platform === p
                        ? "border-[#2fd4ff]/50 bg-[#2fd4ff]/10 text-[#6fe4ff]"
                        : "border-white/10 text-neutral-500 hover:text-neutral-300",
                    )}
                  >
                    {p === "ios" ? "iOS" : "ANDROID"}
                  </button>
                ))}
                {state === "error" && (
                  <span className="ml-auto font-mono-dy text-[10px] tracking-[0.08em] text-[#ef4444]">
                    ENTER A VALID EMAIL
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="relative lg:col-span-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side_at_50%_45%,rgba(47,212,255,0.14),transparent_72%)]"
          aria-hidden="true"
        />
        <PhoneMockup />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Voice cloning section                                               */
/* ------------------------------------------------------------------ */

const CLONE_STEPS = [
  {
    icon: Upload,
    title: "Input your audio",
    body: "Record straight into the studio or upload a sample. WAV, MP3, M4A: your file is measured right in your browser and never leaves your device.",
  },
  {
    icon: AudioLines,
    title: "Clone the profile",
    body: "We map your pitch, pace, energy, and tone into a voice profile. It is yours: name it, tune it, own it, delete it whenever you want.",
  },
  {
    icon: Mic,
    title: "Put it to work, live",
    body: "Assign your voice to any AI employee. They answer in it in real time, follow your script for the call, and hand off to you in one tap.",
  },
];

export function VoiceCloneSection() {
  const { navigate } = useDyRouter();
  const sample = Array.from({ length: 46 }, (_, i) => Number((0.25 + Math.abs(Math.sin(i * 0.7)) * 0.6).toFixed(3)));
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
      {/* Visual: your sample becomes the AI voice */}
      <div className="lg:col-span-5">
        <div className="relative rounded-[5px] border border-white/10 bg-ink-2 p-5 md:p-6">
          {/* Sample card */}
          <div className="rounded-[4px] border border-white/10 bg-ink-3 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono-dy text-[10px] tracking-[0.16em] text-neutral-400">
                <UserRound className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.8} />
                YOUR SAMPLE
              </span>
              <span className="font-mono-dy text-[10px] text-neutral-500">00:12 · voice-sample.wav</span>
            </div>
            <div className="mt-3">
              <Waveform amplitudes={sample} height={44} color="#9fb2c8" baselineColor="#1c3050" />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-4" aria-hidden="true">
            <ArrowDown className="h-5 w-5 animate-pulse text-[#2fd4ff]" strokeWidth={2} />
          </div>

          {/* Clone output */}
          <div className="rounded-[4px] border border-[#2fd4ff]/30 bg-[#2fd4ff]/[0.05] p-4 shadow-[0_20px_60px_-24px_rgba(47,212,255,0.35)]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono-dy text-[10px] tracking-[0.16em] text-[#6fe4ff]">
                <span className="dy-status dy-status-live">
                  <span className="dy-status-dot" />
                </span>
                AI SPEAKING · YOUR VOICE
              </span>
              <span className="font-mono-dy text-[10px] text-neutral-500">REAL TIME</span>
            </div>
            <div className="dy-bar-anim mt-3 flex h-11 items-end gap-[3px]" aria-hidden="true">
              {Array.from({ length: 46 }).map((_, i) => (
                <span
                  key={i}
                  className="block w-[3px] rounded-[2px] bg-[#2fd4ff]"
                  style={{
                    height: `${(25 + Math.abs(Math.sin(i * 1.1)) * 70).toFixed(1)}%`,
                    animationDelay: `${(i % 9) * 95}ms`,
                    animationDuration: `${820 + (i % 5) * 140}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <p className="mt-4 text-center font-mono-dy text-[10px] tracking-[0.14em] text-neutral-600">
            SAMPLE IN · YOUR EMPLOYEE SPEAKS OUT
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="lg:col-span-7">
        <div className="space-y-4">
          {CLONE_STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group flex items-start gap-4 rounded-[4px] border border-white/10 bg-ink-2 p-5 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-[#2fd4ff]/40"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[3px] border border-white/10 bg-ink-3 font-mono-dy text-[12px] font-semibold text-[#6fe4ff] transition-colors ease-mechanical group-hover:border-[#2fd4ff]/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4 className="font-display text-[17px] font-bold tracking-[-0.02em] text-white">{s.title}</h4>
                <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-neutral-400">{s.body}</p>
              </div>
              <s.icon className="ml-auto hidden h-5 w-5 flex-none text-neutral-600 transition-colors ease-mechanical group-hover:text-[#2fd4ff] sm:block" strokeWidth={1.6} />
            </div>
          ))}
        </div>

        {/* Script obedience */}
        <div className="mt-5 rounded-[4px] border border-white/10 bg-gradient-to-r from-ink-2 to-ink-3 p-5">
          <p className="font-display text-[14px] font-bold text-white">
            Script any call, and it obeys. <span className="text-neutral-500">Your words outrank every default.</span>
          </p>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-neutral-400">
            Tell the AI exactly what to say on a particular call and how to answer it: per-call instructions from you
            override every built-in guideline for that conversation.
          </p>
        </div>

        <p className="mt-5 text-[11.5px] leading-relaxed text-neutral-600">
          Honesty note: voice profiles measure your pitch, pace, and energy today, live in every call. Rebuilding your
          exact timbre needs a heavy neural model, so it stays labeled pending until it truly runs. Only clone voices
          you own or have written permission to use.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(ROUTES.appVoiceStudio)} className="btn-flare h-11 px-7 text-[13.5px]">
            Open the Voice Studio
          </Button>
          <Button onClick={() => navigate(ROUTES.productVoice)} variant="outline" className="btn-glass h-11 px-6 text-[13.5px]">
            How the voice pipeline runs
          </Button>
        </div>
      </div>
    </div>
  );
}
