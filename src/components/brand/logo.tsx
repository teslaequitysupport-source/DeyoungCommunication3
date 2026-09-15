import { cn } from "@/lib/utils";

/**
 * DEYOUNG speech-act monogram: a D built from a stem plus three staggered
 * voice bars. Reads as both a D and a leveled waveform. No AI cliches.
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="DEYOUNG mark"
      role="img"
      className={className}
    >
      <rect x="5" y="5" width="4" height="22" rx="1" fill="currentColor" />
      <rect x="12" y="8" width="14" height="3.4" rx="1.2" fill="currentColor" />
      <rect
        x="12"
        y="14.3"
        width="15"
        height="3.4"
        rx="1.2"
        fill={redBar ? "#E10600" : "currentColor"}
      />
      <rect x="12" y="20.6" width="10" height="3.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  variant = "dark",
  className,
  compact = false,
}: {
  variant?: "dark" | "light" | "mono-white" | "mono-black";
  className?: string;
  compact?: boolean;
}) {
  const mainColor =
    variant === "light" || variant === "mono-white" ? "#FFFFFF" : "#090909";
  const subColor =
    variant === "mono-white"
      ? "#FFFFFF"
      : variant === "mono-black"
        ? "#090909"
        : variant === "light"
          ? "#A1A1A1"
          : "#A1A1A1";
  if (compact) {
    return (
      <span
        className={cn("font-display leading-none select-none", className)}
        style={{ color: mainColor }}
        aria-label="DEYOUNG COMM"
      >
        DEYOUNG<span style={{ color: "#E10600" }}>.</span>
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
  variant = "dark",
  size = 34,
  className,
}: {
  variant?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Monogram size={size} className={variant === "light" ? "text-white" : "text-[#090909]"} />
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
  variant = "dark",
  size = 30,
  className,
}: {
  siteName: string;
  variant?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  const mainColor = variant === "light" ? "#FFFFFF" : "#090909";
  const subColor = variant === "light" ? "#A1A1A1" : "#A1A1A1";
  const trimmed = siteName.trim() || "DEYOUNG COMMUNICATION";
  const words = trimmed.split(/\s+/);
  const first = words[0].toUpperCase();
  const rest = words.slice(1).join(" ").toUpperCase();

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Monogram size={size} className={variant === "light" ? "text-white" : "text-[#090909]"} />
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
