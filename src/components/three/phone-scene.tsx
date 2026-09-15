"use client";

/**
 * PhoneHero · hero product shot with honest degradation:
 * WebGL + motion  -> live 3D phone (phone-canvas.tsx), screen is a real texture.
 * No WebGL        -> DOM phone chassis with the real Mission Control card inside (CSS 3D tilt).
 * Reduced motion  -> DOM phone, static, still fully readable.
 * Visible at EVERY breakpoint · the phone is never hidden on mobile.
 */

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, PhoneOff, Volume2 } from "lucide-react";

const PhoneCanvas = dynamic(() => import("./phone-canvas"), { ssr: false });

const noopSubscribe = () => () => {};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const glSupport = () => (typeof window === "undefined" ? "ssr" : hasWebGL() ? "webgl" : "2d");

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export type PhoneStats = { users: number; employees: number; calls: number; messages: number } | null;

/* ---------------- Mission Control (the DOM console, also the fallback screen) ---------------- */

function MissionControl({ stats }: { stats: PhoneStats }) {
  const reduced = useReducedMotion();
  const cells = [
    { label: "USERS", value: stats ? String(stats.users) : "0" },
    { label: "EMPLOYEES", value: stats ? String(stats.employees) : "0" },
    { label: "CALLS", value: stats ? String(stats.calls) : "0" },
    { label: "MSGS", value: stats ? String(stats.messages) : "0" },
  ];
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-ink-2/90 shadow-[0_40px_120px_-32px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      {/* scanning top edge */}
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-px w-40 bg-gradient-to-r from-transparent via-brand to-transparent"
          animate={reduced ? undefined : { x: ["-160px", "100%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* telemetry header strip */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <span className="font-mono-dy text-[10px] tracking-[0.2em] text-neutral-400">LIVE TELEMETRY</span>
        <div className="flex items-center divide-x divide-white/10">
          {cells.map((c) => (
            <span key={c.label} className="flex items-baseline gap-1.5 px-3 first:pl-0">
              <span className="font-display-strong text-[15px] tabular-nums leading-none text-white">{c.value}</span>
              <span className="font-mono-dy text-[8.5px] tracking-[0.16em] text-neutral-500">{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* console body */}
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="font-mono-dy text-[10px] tracking-[0.18em] text-neutral-500">
              CALL CONSOLE · VOICE
            </span>
          </div>
          <span className="dy-status dy-status-live">
            <span className="dy-status-dot" />
            LIVE
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="max-w-[80%] rounded-[3px] rounded-bl-none border border-white/10 bg-ink-3 px-4 py-3">
            <p className="text-[13px] leading-snug text-neutral-300">
              &ldquo;Hi, do you take bookings on Sundays?&rdquo;
            </p>
          </div>
          <div className="ml-auto max-w-[85%] rounded-[3px] rounded-br-none border border-brand/25 bg-brand/[0.07] px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono-dy text-[10px] tracking-[0.14em] text-[#ff6a5e]">ADA · 412MS</span>
              <span className="cue-chip">breathes</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-neutral-200">
              &ldquo;We do. Sundays run nine to two. Would you like me to hold a slot?&rdquo;
            </p>
          </div>
          <div className="max-w-[80%] rounded-[3px] rounded-bl-none border border-white/10 bg-ink-3 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono-dy text-[9.5px] tracking-[0.14em] text-brand">INTERRUPTED · BARGE-IN</span>
            </div>
            <p className="text-[13px] leading-snug text-neutral-300">&ldquo;Wait, afternoon instead&rdquo;</p>
          </div>
        </div>

        {/* live waveform */}
        <div className="mt-5 flex h-14 items-end justify-center gap-[3px] rounded-[3px] border border-white/10 bg-ink-3/60 px-6 py-3">
          {Array.from({ length: 48 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-[1.5px] bg-brand"
              style={
                reduced
                  ? { height: `${18 + ((i * 37) % 44)}%` }
                  : {
                      height: `${16 + ((i * 37) % 48)}%`,
                      animation: `dy-bar ${0.7 + ((i % 7) * 0.13)}s cubic-bezier(0.7,0,0.2,1) ${(i % 11) * 0.07}s infinite`,
                    }
              }
            />
          ))}
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-neutral-300">
              <Mic className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-neutral-300">
              <Volume2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_24px_-6px_rgba(225,6,0,0.6)]">
            <PhoneOff className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <p className="border-t border-white/10 px-4 py-2.5 text-center font-mono-dy text-[9.5px] tracking-[0.16em] text-neutral-600">
        PRODUCT PREVIEW · COUNTERS READ THE LIVE DATABASE
      </p>
    </div>
  );
}

/* ---------------- DOM phone chassis (fallback) ---------------- */

function DomPhone({ stats }: { stats: PhoneStats }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[300px]"
      initial={reduced ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.7, 0, 0.2, 1] }}
    >
      {/* faint signal bloom behind the chassis */}
      <div
        className="absolute -inset-12 bg-[radial-gradient(ellipse_at_center,rgba(225,6,0,0.10),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <motion.div
        style={{ transform: "perspective(1400px) rotateX(3deg) rotateY(-4deg)" }}
        animate={reduced ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative rounded-[42px] border border-white/15 bg-[#101010] p-2.5 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.95)]">
          <div className="absolute left-1/2 top-[14px] z-10 h-5 w-[104px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
          <MissionControl stats={stats} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- exported hero shot ---------------- */

export function PhoneHero({ className, stats }: { className?: string; stats: PhoneStats }) {
  const support = useSyncExternalStore(noopSubscribe, glSupport, () => "ssr" as const);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  if (support === "ssr") {
    // Reserve layout space pre-hydration (no flash, no layout shift)
    return <div className={className} aria-hidden="true" />;
  }
  if (support === "2d" || reduced) {
    return (
      <div className={className}>
        <DomPhone stats={stats} />
      </div>
    );
  }
  return (
    <div className={className}>
      <PhoneCanvas stats={stats} reduced={reduced} />
    </div>
  );
}
