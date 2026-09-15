"use client";

/**
 * Admin CMS views: Content (copy + visibility), Media (device photo uploads),
 * Settings (site name, banner, feature flags). Edits apply instantly across
 * the public site: no redeploys, honest preview notes.
 */

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AdminHead } from "./console";
import { useAdminRealtime } from "./realtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SiteSettingsDTO } from "@/lib/types";
import {
  Loader2,
  Eye,
  EyeOff,
  Save,
  Upload,
  Trash2,
  Copy,
  ImageIcon,
  Type,
  AlignLeft,
  Megaphone,
  Check,
} from "lucide-react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

/* ================= CONTENT ================= */

type Block = {
  id: string;
  key: string;
  group: string;
  label: string;
  type: string;
  value: string;
  visible: boolean;
};

const GROUP_LABELS: Record<string, string> = {
  home: "Home page",
  banner: "Banner",
  product: "Product pages",
  about: "About page",
  contact: "Contact page",
};

export function AdminContentView() {
  const { toast } = useToast();
  const { lastEvent } = useAdminRealtime();
  const { data, mutate, isLoading } = useSWR<{ blocks: Block[] }>("/api/admin/content", fetcher, {
    refreshInterval: 15000,
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (lastEvent?.event === "content:updated") mutate();
  }, [lastEvent, mutate]);

  const blocks = data?.blocks ?? [];
  const groups = [...new Set(blocks.map((b) => b.group))];

  const save = async (b: Block, value?: string, visible?: boolean) => {
    setSaving(b.key);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: b.key,
          ...(value !== undefined ? { value } : {}),
          ...(visible !== undefined ? { visible } : {}),
        }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: `${b.key} is live on the site now.` });
        setDrafts((d) => {
          const next = { ...d };
          delete next[b.key];
          return next;
        });
        mutate();
      } else {
        toast({ title: "Save failed", variant: "destructive" });
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <AdminHead
        title="Content"
        intro="Every editable line of public copy, with a visibility switch per block. Hidden blocks never leave the server: the public API filters them out. Changes go live the moment you save."
      />
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g}>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono-dy text-[10px] font-semibold tracking-[0.2em] text-[#4A90E2]">
                  {String(groups.indexOf(g) + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-[16px] font-bold text-white">
                  {GROUP_LABELS[g] ?? g}
                </h2>
                <span className="h-px flex-1 bg-[#1C3050]" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                {blocks
                  .filter((b) => b.group === g)
                  .map((b) => {
                    const draft = drafts[b.key];
                    const dirty = draft !== undefined && draft !== b.value;
                    const Icon = b.type === "textarea" ? AlignLeft : b.type === "image" ? ImageIcon : Type;
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "rounded-[4px] border bg-[#0A1424] p-5 transition-colors",
                          b.visible ? "border-[#1C3050]" : "border-dashed border-[#2e2e2e] opacity-60",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-[#A1A1A1]" strokeWidth={1.75} />
                            <span className="text-[13.5px] font-semibold text-white">{b.label || b.key}</span>
                            <span className="font-mono-dy text-[10px] tracking-[0.08em] text-[#6f6f6a]">{b.key}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "dy-status",
                                b.visible ? "dy-status-connected text-[#6ecf95]" : "dy-status-neutral text-[#6f6f6a]",
                              )}
                            >
                              {b.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {b.visible ? "VISIBLE" : "HIDDEN"}
                            </span>
                            <Switch
                              checked={b.visible}
                              onCheckedChange={(v) => save(b, undefined, v)}
                              aria-label={`Toggle visibility for ${b.key}`}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          {b.type === "textarea" ? (
                            <Textarea
                              value={draft ?? b.value}
                              onChange={(e) => setDrafts((d) => ({ ...d, [b.key]: e.target.value }))}
                              rows={3}
                              maxLength={4000}
                              className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13px] leading-relaxed text-white focus-visible:ring-[#4A90E2]"
                            />
                          ) : (
                            <Input
                              value={draft ?? b.value}
                              onChange={(e) => setDrafts((d) => ({ ...d, [b.key]: e.target.value }))}
                              maxLength={4000}
                              className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13px] text-white focus-visible:ring-[#4A90E2]"
                            />
                          )}
                        </div>
                        {dirty && (
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => save(b, draft)}
                              disabled={saving === b.key}
                              className="rounded-[2px] bg-[#4A90E2] px-4 text-[12px] font-semibold text-white hover:bg-[#2E7CDE]"
                            >
                              {saving === b.key ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
                              Save & publish
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDrafts((d) => ({ ...d, [b.key]: b.value }))}
                              className="rounded-[2px] px-3 text-[12px] text-[#A1A1A1]"
                            >
                              Revert
                            </Button>
                            <span className="font-mono-dy text-[10px] tracking-[0.1em] text-[#d08700]">UNSAVED CHANGES</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= MEDIA ================= */

type Asset = {
  id: string;
  filename: string;
  url: string;
  mime: string;
  size: number;
  alt: string;
  createdAt: string;
};

export function AdminMediaView() {
  const { toast } = useToast();
  const { lastEvent } = useAdminRealtime();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { data, mutate, isLoading } = useSWR<{ assets: Asset[] }>("/api/admin/media", fetcher, {
    refreshInterval: 20000,
  });

  useEffect(() => {
    if (lastEvent?.event === "media:updated") mutate();
  }, [lastEvent, mutate]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const d = await res.json();
        if (res.ok) {
          toast({ title: "Uploaded", description: `${d.asset.filename} is live at ${d.asset.url}` });
        } else {
          toast({ title: "Upload failed", description: d.error ?? "Try another file.", variant: "destructive" });
        }
      }
      mutate();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (asset: Asset) => {
    const res = await fetch(`/api/admin/media?id=${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Deleted", description: `${asset.filename} removed.` });
      mutate();
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copied", description: url });
    } catch {
      toast({ title: url, description: "Copy it manually: clipboard was blocked." });
    }
  };

  const assets = data?.assets ?? [];

  return (
    <div>
      <AdminHead
        title="Media"
        intro="Upload photos from this device (or any device an admin signs in from). Files land in workspace storage, get a stable URL, and can be referenced by content blocks or pasted anywhere."
      />

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-[4px] border-2 border-dashed p-10 text-center transition-colors ease-mechanical",
          dragOver ? "border-[#4A90E2]/60 bg-[#4A90E2]/[0.04]" : "border-[#2e2e2e] bg-[#0A1220]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
        <Upload className={cn("mx-auto h-6 w-6", dragOver ? "text-[#4A90E2]" : "text-[#6f6f6a]")} strokeWidth={1.75} />
        <p className="font-display mt-4 text-[15px] font-bold text-white">
          Drop photos here, or
          <button
            onClick={() => inputRef.current?.click()}
            className="ml-1.5 text-[#4A90E2] underline decoration-[#4A90E2]/40 underline-offset-4 transition-colors hover:text-[#6fcbff]"
          >
            choose from your device
          </button>
        </p>
        <p className="mt-2 font-mono-dy text-[10px] tracking-[0.12em] text-[#6f6f6a]">
          JPG · PNG · WEBP · GIF · SVG · AVIF · UP TO 5 MB EACH
        </p>
        {uploading && (
          <p className="mt-4 flex items-center justify-center gap-2 font-mono-dy text-[11px] text-[#A1A1A1]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4A90E2]" /> UPLOADING…
          </p>
        )}
      </div>

      {/* Library */}
      <h2 className="font-display mt-8 mb-3 text-[16px] font-bold text-white">Library: {assets.length} asset{assets.length === 1 ? "" : "s"}</h2>
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-[#4A90E2]" />
        </div>
      ) : assets.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-[#1C3050] bg-[#0A1322] px-5 py-10 text-center font-mono-dy text-[10.5px] leading-relaxed tracking-[0.1em] text-[#6f6f6a]">
          NO MEDIA YET · THE LIBRARY SHOWS EXACTLY WHAT HAS BEEN UPLOADED, NOTHING STOCKED
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="group overflow-hidden rounded-[4px] border border-[#1C3050] bg-[#0A1424]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0A1220]">
                { }
                <img src={a.url} alt={a.alt} className="h-full w-full object-cover transition-transform duration-300 ease-mechanical group-hover:scale-[1.03]" />
              </div>
              <div className="p-3">
                <p className="truncate font-mono-dy text-[10.5px] text-neutral-300">{a.filename}</p>
                <p className="mt-0.5 font-mono-dy text-[9.5px] text-[#6f6f6a]">
                  {Math.round(a.size / 1024)} KB · {new Date(a.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  <button
                    onClick={() => copyUrl(a.url)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-[2px] border border-[#1C3050] py-1.5 font-mono-dy text-[9.5px] tracking-[0.08em] text-[#A1A1A1] transition-colors hover:border-[#333] hover:text-white"
                  >
                    <Copy className="h-3 w-3" /> URL
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="flex items-center justify-center rounded-[2px] border border-[#1C3050] px-2.5 py-1.5 text-[#A1A1A1] transition-colors hover:border-[#4A90E2]/50 hover:text-[#6fcbff]"
                    aria-label={`Delete ${a.filename}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= SETTINGS ================= */

const FLAGS: { key: keyof SiteSettingsDTO; label: string; desc: string }[] = [
  { key: "flagShowPricing", label: "Show pricing", desc: "Pricing page + nav link + home section" },
  { key: "flagShowStats", label: "Show live stats", desc: "Public telemetry rail on home + about" },
  { key: "flagShowTestimonials", label: "Testimonials section", desc: "Hidden by default: we have none yet, honestly" },
  { key: "flagShowVoiceDemo", label: "Voice demo entry points", desc: "Hero console preview + studio mentions" },
  { key: "flagRequireApproval", label: "Require account approval", desc: "New signups wait in the admin queue (recommended)" },
];

export function AdminSettingsView() {
  const { toast } = useToast();
  const { lastEvent } = useAdminRealtime();
  const { data, mutate, isLoading } = useSWR<{ settings: SiteSettingsDTO & Record<string, unknown> }>(
    "/api/admin/settings",
    fetcher,
  );
  const [draft, setDraft] = useState<Partial<SiteSettingsDTO>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lastEvent?.event === "settings:updated") mutate();
  }, [lastEvent, mutate]);

  const s = { ...(data?.settings ?? {}), ...draft } as Partial<SiteSettingsDTO>;
  const dirty = Object.keys(draft).length > 0;
  const set = <K extends keyof SiteSettingsDTO>(key: K, value: SiteSettingsDTO[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        toast({ title: "Settings live", description: "The whole site now reflects these values." });
        setDraft({});
        mutate();
      } else {
        toast({ title: "Save failed", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
      </div>
    );
  }

  return (
    <div>
      <AdminHead
        title="Settings"
        intro="The site-wide control surface: name, tagline, announcement banner, and what the public is allowed to see. Everything saves instantly: reload the marketing site to watch it change."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Identity */}
        <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-6">
          <div className="flex items-center gap-2.5">
            <Type className="h-4 w-4 text-[#4A90E2]" strokeWidth={1.75} />
            <h2 className="font-display text-[15px] font-bold text-white">Identity</h2>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6f6f6a]">
            The site name renames everything: nav, footer, giant wordmark, emails, legal pages.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">SITE NAME</Label>
              <Input
                value={s.siteName ?? ""}
                onChange={(e) => set("siteName", e.target.value)}
                maxLength={80}
                className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[14px] font-semibold text-white focus-visible:ring-[#4A90E2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">TAGLINE</Label>
              <Input
                value={s.tagline ?? ""}
                onChange={(e) => set("tagline", e.target.value)}
                maxLength={200}
                className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13.5px] text-white focus-visible:ring-[#4A90E2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">SUPPORT EMAIL</Label>
              <Input
                type="email"
                value={s.supportEmail ?? ""}
                onChange={(e) => set("supportEmail", e.target.value)}
                className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13.5px] text-white focus-visible:ring-[#4A90E2]"
              />
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Megaphone className="h-4 w-4 text-[#4A90E2]" strokeWidth={1.75} />
              <h2 className="font-display text-[15px] font-bold text-white">Announcement banner</h2>
            </div>
            <Switch
              checked={!!s.bannerEnabled}
              onCheckedChange={(v) => set("bannerEnabled", v)}
              aria-label="Toggle announcement banner"
            />
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6f6f6a]">
            The strip above the nav on every marketing page. Turn it off and it vanishes site-wide
            instantly.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">BANNER TEXT</Label>
              <Input
                value={s.bannerText ?? ""}
                onChange={(e) => set("bannerText", e.target.value)}
                maxLength={300}
                disabled={!s.bannerEnabled}
                className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13.5px] text-white focus-visible:ring-[#4A90E2] disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">CTA LABEL</Label>
                <Input
                  value={s.bannerLabel ?? ""}
                  onChange={(e) => set("bannerLabel", e.target.value)}
                  maxLength={60}
                  disabled={!s.bannerEnabled}
                  className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13.5px] text-white focus-visible:ring-[#4A90E2] disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono-dy text-[10px] tracking-[0.16em] text-[#A1A1A1]">CTA LINK</Label>
                <Input
                  value={s.bannerHref ?? ""}
                  onChange={(e) => set("bannerHref", e.target.value)}
                  maxLength={300}
                  disabled={!s.bannerEnabled}
                  placeholder="#/signup"
                  className="rounded-[2px] border-[#1C3050] bg-[#0A1220] text-[13.5px] text-white focus-visible:ring-[#4A90E2] disabled:opacity-50"
                />
              </div>
            </div>
            {s.bannerEnabled && (s.bannerText ?? "").trim() && (
              <div className="rounded-[3px] border border-[#1C3050] bg-[#0A1220] px-4 py-2.5">
                <p className="font-mono-dy text-[10.5px] text-neutral-300">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#4A90E2]" />
                  {s.bannerText} <span className="text-[#6fcbff]">{s.bannerLabel} →</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Flags */}
        <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-6 xl:col-span-2">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-[#4A90E2]" strokeWidth={1.75} />
            <h2 className="font-display text-[15px] font-bold text-white">Public visibility</h2>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6f6f6a]">
            What the public site shows. These are hard switches: a hidden section does not render
            at all, and its data is not sent to the browser.
          </p>
          <div className="mt-5 space-y-1">
            {FLAGS.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between gap-4 rounded-[3px] border border-[#1c1c1c] bg-[#0A1220] px-4 py-3.5"
              >
                <div>
                  <p className="text-[13.5px] font-semibold text-white">{f.label}</p>
                  <p className="mt-0.5 text-[11.5px] text-[#6f6f6a]">{f.desc}</p>
                </div>
                <Switch
                  checked={!!(s[f.key] as boolean)}
                  onCheckedChange={(v) => set(f.key, v as never)}
                  aria-label={f.label}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-[4px] border border-[#4A90E2]/40 bg-[#0A1424] px-5 py-4 shadow-[0_16px_48px_-12px_rgba(10,91,196,0.45)]">
          <span className="font-mono-dy text-[11px] tracking-[0.1em] text-[#6fcbff]">
            {Object.keys(draft).length} UNSAVED SETTING{Object.keys(draft).length === 1 ? "" : "S"}: NOT YET LIVE
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDraft({})} className="rounded-[2px] text-[12px] text-[#A1A1A1]">
              Discard
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="rounded-[2px] bg-[#4A90E2] px-5 text-[12.5px] font-semibold text-white hover:bg-[#2E7CDE]"
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Save & publish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
