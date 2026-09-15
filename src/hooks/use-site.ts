"use client";

import useSWR from "swr";
import type { SiteSettingsDTO, ContentMap } from "@/lib/types";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

export const SITE_DEFAULTS: SiteSettingsDTO = {
  siteName: "DEYOUNG COMMUNICATION",
  tagline: "AI employees that answer, understand, and act",
  supportEmail: "support@deyoungcommunication.com",
  bannerEnabled: true,
  bannerText: "Real-time voice with emotion is live on paid plans. Text chat is free forever.",
  bannerLabel: "Try a call",
  bannerHref: "#/signup",
  flagShowPricing: true,
  flagShowStats: true,
  flagShowTestimonials: true,
  flagShowVoiceDemo: true,
  flagRequireApproval: true,
};

export type PublicStats = {
  users: number;
  organizations: number;
  employees: number;
  conversations: number;
  messages: number;
  calls: number;
  callTurns: number;
};

/** Site-wide settings + visible content, with safe defaults while loading. */
export function useSite() {
  const { data, isLoading } = useSWR<{ settings: SiteSettingsDTO; content: ContentMap }>(
    "/api/site",
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );
  const settings = data?.settings ?? SITE_DEFAULTS;
  return { settings, content: data?.content ?? {}, loading: isLoading };
}

/** One content block with its visible flag applied. Hidden = fallback text (never the hidden value). */
export function useContent(content: ContentMap, key: string, fallback: string): string {
  const block = content[key];
  return block && block.visible && block.value.trim() ? block.value : fallback;
}

/** Public platform telemetry: real DB counts, zero until real work happens. */
export function usePublicStats() {
  const { data } = useSWR<{ stats: PublicStats }>("/api/stats", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });
  return data?.stats ?? null;
}
