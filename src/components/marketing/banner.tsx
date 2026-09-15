"use client";

/**
 * Announcement banner: controlled from Admin → Settings, live.
 * Disabled there = it disappears here. No hardcoded campaigns.
 */

import { useSite } from "@/hooks/use-site";
import { useDyRouter } from "@/lib/router";
import { ChevronRight, Radio } from "lucide-react";

export function SiteBanner() {
  const { settings } = useSite();
  const { navigate } = useDyRouter();

  if (!settings.bannerEnabled || !settings.bannerText.trim()) return null;

  return (
    <div className="relative z-50 bg-ink text-white">
      <div className="container-dy flex min-h-10 items-center justify-center gap-3 py-2">
        <span className="dy-status dy-status-live" aria-hidden="true">
          <span className="dy-status-dot" />
        </span>
        <p className="font-mono-dy text-[11px] tracking-[0.08em] font-medium text-neutral-200">
          {settings.bannerText}
        </p>
        {settings.bannerLabel.trim() && (
          <button
            onClick={() => navigate(settings.bannerHref.replace(/^#/, ""))}
            className="group inline-flex items-center gap-1 font-mono-dy text-[11px] font-semibold tracking-[0.08em] text-white transition-colors hover:text-white"
          >
            <span className="border-b border-[#6fcbff]/60 pb-px">{settings.bannerLabel}</span>
            <ChevronRight className="h-3 w-3 transition-transform ease-mechanical group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
      <div className="hairline-b" />
    </div>
  );
}

/** Compact "on air" indicator reused in nav when a call is live anywhere. */
export function OnAirChip() {
  return (
    <span className="dy-status dy-status-live">
      <span className="dy-status-dot" />
      <Radio className="h-3 w-3" />
      ON AIR
    </span>
  );
}
