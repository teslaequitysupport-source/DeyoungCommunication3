"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * DEYOUNG speech-act monogram: a D built from a stem plus three staggered
 * voice bars. Reads as both a D and a leveled waveform. No AI cliches.
 *
 * Rendering notes:
 * - The whole site runs on dark ink backgrounds, so every component here
 *   defaults to LIGHT strokes/text (visible on dark). Pass variant="ink"
 *   only for the rare light-background placement.
 * - SVG gradient/filter ids are unique per instance (useId): multiple
 *   lockups on one page can never cross-reference each other's defs.
 */
export function Monogram({
  size = 28,
  className,
  redBar = true,
}: {
  size?: number;
  className?: string;
  redBar?: boolean;
}) {
  // useId returns ids with ":" which are invalid inside SVG url(#...) references.
  const uid = useId().replace(/[:]/g, "");
  const gradId = `dyMarkGrad-${uid}`;
  const glowId = `dyMarkGlow-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="DEYOUNG mark"
      role="img"
      className={cn("text-[#EAF2FF]", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="12" x2="30" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6FCBFF" />
          <stop offset="0.55" stopColor="#2FD4FF" />
          <stop offset="1" stopColor="#2E7CDE" />
        </linearGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowId})`}>
        <rect x="5" y="5" width="4" height="22" rx="1" fill="currentColor" />
        <rect x="12" y="8" width="14" height="3.4" rx="1.2" fill="currentColor" />
        <rect
          x="12"
          y="14.3"
          width="15"
          height="3.4"
          rx="1.2"
          fill={redBar ? `url(#${gradId})` : "currentColor"}
        />
        <rect x="12" y="20.6" width="10" height="3.4" rx="1.2" fill="currentColor" />
      </g>
    </svg>
  );
}

export function Wordmark({
  variant = "light",
  className,
  compact = false,
}: {
  /** "light" = light text for dark backgrounds (site default). "ink" = dark text. */
  variant?: "light" | "ink" | "mono-white" | "mono-black";
  className?: string;
  compact?: boolean;
}) {
  const mainColor =
    variant === "ink" || variant === "mono-black" ? "#070E1A" : "#FFFFFF";
  const subColor =
    variant === "mono-white"
      ? "#FFFFFF"
      : variant === "mono-black"
        ? "#070E1A"
        : "#9FB4CC";
  if (compact) {
    return (
      <span
        className={cn("font-display leading-none select-none", className)}
        style={{ color: mainColor }}
        aria-label="DEYOUNG COMM"
      >
        DEYOUNG<span style={{ color: "#00C8FF" }}>.</span>
      </span>
    );
  }
  return (
    <span className={cn("select-none inline-flex flex-col", className)} aria-label="DEYOUNG COMMUNICATION">
      <span
        className="font-display leading-[0.95] text-[1.15em] tracking-[-0.01em]"
        style={{ color: mainColor }}
      >
        DEYOUNG
      </span>
      <span
        className="font-bold leading-none text-[0.34em] tracking-[0.34em] mt-[0.28em]"
        style={{ color: subColor }}
      >
        COMMUNICATION
      </span>
    </span>
  );
}

export function LogoLockup({
  variant = "light",
  size = 34,
  className,
}: {
  variant?: "light" | "ink";
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Monogram size={size} className={variant === "ink" ? "text-[#070E1A]" : "text-white"} />
      <Wordmark variant={variant} />
    </span>
  );
}

/**
 * Site-name lockup driven by Admin → Settings (rename the whole product live).
 * Two-word names get the tiered DEYOUNG / COMMUNICATION treatment;
 * anything else renders as a single display line.
 */
export function SiteLockup({
  siteName,
  variant = "light",
  size = 30,
  className,
}: {
  siteName: string;
  variant?: "light" | "ink";
  size?: number;
  className?: string;
}) {
  const mainColor = variant === "ink" ? "#070E1A" : "#FFFFFF";
  const subColor = variant === "ink" ? "#5B6B7E" : "#9FB4CC";
  const trimmed = siteName.trim() || "DEYOUNG COMMUNICATION";
  const words = trimmed.split(/\s+/);
  const first = words[0].toUpperCase();
  const rest = words.slice(1).join(" ").toUpperCase();

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Monogram size={size} className={variant === "ink" ? "text-[#070E1A]" : "text-white"} />
      {rest ? (
        <span className="inline-flex flex-col select-none">
          <span
            className="font-display leading-[0.95] text-[15px] font-bold tracking-[-0.01em]"
            style={{ color: mainColor }}
          >
            {first}
          </span>
          <span
            className="font-mono-dy leading-none text-[8.5px] font-medium tracking-[0.3em] mt-[3px]"
            style={{ color: subColor }}
          >
            {rest}
          </span>
        </span>
      ) : (
        <span
          className="font-display text-[15px] font-bold tracking-[-0.01em] select-none"
          style={{ color: mainColor }}
        >
          {first}
        </span>
      )}
    </span>
  );
}
