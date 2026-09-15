import { db } from "@/lib/db";
import type { SiteSettingsDTO, ContentMap } from "@/lib/types";

const DEFAULT_SETTINGS: SiteSettingsDTO = {
  siteName: "DEYOUNG COMMUNICATION",
  tagline: "AI employees that answer, understand, and act",
  supportEmail: "support@deyoungcommunication.com",
  bannerEnabled: true,
  bannerText: "Live calls now run in your browser: free, real-time, with emotion.",
  bannerLabel: "Try a call",
  bannerHref: "#/signup",
  flagShowPricing: true,
  flagShowStats: true,
  flagShowTestimonials: true,
  flagShowVoiceDemo: true,
  flagRequireApproval: true,
};

/** Site-wide settings (admin-editable). Falls back to defaults if the row is missing. */
export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  try {
    const row = await db.siteSettings.findUnique({ where: { id: "site" } });
    if (!row) return DEFAULT_SETTINGS;
    return {
      siteName: row.siteName,
      tagline: row.tagline,
      supportEmail: row.supportEmail,
      bannerEnabled: row.bannerEnabled,
      bannerText: row.bannerText,
      bannerLabel: row.bannerLabel,
      bannerHref: row.bannerHref,
      flagShowPricing: row.flagShowPricing,
      flagShowStats: row.flagShowStats,
      flagShowTestimonials: row.flagShowTestimonials,
      flagShowVoiceDemo: row.flagShowVoiceDemo,
      flagRequireApproval: row.flagRequireApproval,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Public content map: only visible blocks (hidden content never leaves the server). */
export async function getContentMap(): Promise<ContentMap> {
  try {
    const rows = await db.contentBlock.findMany({ where: { visible: true } });
    const map: ContentMap = {};
    for (const r of rows) map[r.key] = { value: r.value, visible: true };
    return map;
  } catch {
    return {};
  }
}

/** Admin view: all blocks including hidden ones. */
export async function getAllContentBlocks() {
  return db.contentBlock.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
}
