"use client";

/**
 * Admin operations views: Users (lifecycle), Live Calls (real-time transcripts),
 * Audit Log. All data is real; all actions audit-logged + broadcast.
 */

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AdminHead } from "./console";
import { useAdminRealtime } from "./realtime";
import { StatusPill } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AdminUserRow, CallSessionDTO, CallTurnDTO } from "@/lib/types";
import { stripCues } from "@/lib/emotion";
import {
  Search,
  Loader2,
  Check,
  X,
  Ban,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  StickyNote,
  Phone,
  PhoneOff,
  ChevronLeft,
  ScrollText,
} from "lucide-react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

/* ================= USERS ================= */

const LIFECYCLE = [
  { action: "approve", label: "Approve", icon: Check, needsReason: false, show: (u: AdminUserRow) => u.status === "pending" },
  { action: "reject", label: "Reject", icon: X, needsReason: true, show: (u: AdminUserRow) => u.status === "pending" || u.status === "active" },
  { action: "block", label: "Block", icon: Ban, needsReason: true, show: (u: AdminUserRow) => u.status === "active" || u.status === "pending" || u.status === "rejected" },
  { action: "unblock", label: "Unblock", icon: RotateCcw, needsReason: false, show: (u: AdminUserRow) => u.status === "blocked" },
  { action: "makeAdmin", label: "Make admin", icon: ShieldCheck, needsReason: false, show: (u: AdminUserRow) => u.role !== "admin" },
  { action: "removeAdmin", label: "Remove admin", icon: ShieldOff, needsReason: false, show: (u: AdminUserRow) => u.role === "admin" },
] as const;

export function AdminUsersView() {
  const { toast } = useToast();
  const { lastEvent } = useAdminRealtime();
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<{ user: AdminUserRow; action: string } | null>(null);
  const [reason, setReason] = useState("");
  const [notesFor, setNotesFor] = useState<AdminUserRow | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data, mutate, isLoading } = useSWR<{ users: AdminUserRow[] }>(
    () => (q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users"),
    fetcher,
    { refreshInterval: 10000 },
  );

  useEffect(() => {
    if (lastEvent && (lastEvent.event.startsWith("user:"))) mutate();
  }, [lastEvent, mutate]);

  const users = data?.users ?? [];
  const pendingCount = users.filter((u) => u.status === "pending").length;

  const act = async (user: AdminUserRow, action: string, reasonText = "", plan?: string) => {
    setPending(user.id + action);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action, reason: reasonText, plan }),
      });
      const d = await res.json();
      if (res.ok) {
        toast({ title: `${user.email}: ${action}`, description: "Action applied and audit-logged." });
        mutate();
      } else {
        toast({ title: "Action failed", description: d.error ?? "Try again.", variant: "destructive" });
      }
    } finally {
      setPending(null);
      setReasonFor(null);
      setReason("");
    }
  };

  const saveNotes = async () => {
    if (!notesFor) return;
    const res = await fetch(`/api/admin/users/${notesFor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNotes: notesDraft }),
    });
    if (res.ok) {
      toast({ title: "Internal note saved", description: "Visible to admins only: never serialized to user endpoints." });
      mutate();
    }
    setNotesFor(null);
  };

  return (
    <div>
      <AdminHead
        title="Users"
        intro={`The real approval queue and account lifecycle. ${pendingCount > 0 ? `${pendingCount} account${pendingCount === 1 ? "" : "s"} awaiting activation.` : "No accounts waiting right now."} Approve, reject, block, unblock, and grant admin: every action is audit-logged and takes effect immediately.`}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f6f6a]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name…"
          className="rounded-[2px] border-[#1C3050] bg-[#0A1424] pl-9 text-[13px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
        />
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#1C3050]">
        <div className="hidden grid-cols-[1.6fr_0.7fr_0.85fr_0.8fr_0.9fr_2.1fr] gap-4 border-b border-[#1C3050] bg-[#0A1220] px-5 py-3 md:grid">
          {["ACCOUNT", "ROLE", "PLAN", "STATUS", "LAST SEEN", "LIFECYCLE"].map((h) => (
            <span key={h} className="font-mono-dy text-[9.5px] tracking-[0.18em] text-[#6f6f6a]">{h}</span>
          ))}
        </div>
        {isLoading && !data ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-12 text-center font-mono-dy text-[10.5px] tracking-[0.12em] text-[#6f6f6a]">
            NO ACCOUNTS MATCH
          </p>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              className={cn(
                "grid grid-cols-1 gap-3 bg-[#0A1424] px-5 py-4 transition-colors hover:bg-[#0B1628] md:grid-cols-[1.6fr_0.7fr_0.85fr_0.8fr_0.9fr_2.1fr] md:items-center md:gap-4",
                i > 0 && "border-t border-[#1C3050]",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-white">{u.email}</p>
                  {u.role === "admin" && (
                    <span className="rounded-[2px] border border-[#4A90E2]/40 bg-[#4A90E2]/[0.08] px-1.5 py-0.5 font-mono-dy text-[9px] tracking-[0.1em] text-[#6FCBFF]">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11.5px] text-[#6f6f6a]">
                  {u.name ?? "0"} · {u.orgName ?? "no workspace"}
                </p>
                {u.statusReason && (
                  <p className="mt-1 font-mono-dy text-[10px] text-[#d08700]">REASON: {u.statusReason}</p>
                )}
              </div>
              <span className="font-mono-dy text-[11px] text-neutral-400">{u.role.toUpperCase()}</span>
              {/* Plan switch: the free tier carries no major functions; admins flip this live */}
              <div className="flex items-center gap-1">
                {([
                  { p: "starter", tag: "FREE", title: "Starter (free): text chat only" },
                  { p: "business", tag: "BIZ", title: "Business: live voice, emotion, channels" },
                  { p: "agency", tag: "AGY", title: "Agency: unlimited, white-label" },
                ] as const).map((o) => {
                  const current = (u.plan ?? "starter") === o.p;
                  return (
                    <button
                      key={o.p}
                      title={o.title}
                      disabled={current || pending === u.id + "setPlan"}
                      onClick={() => act(u, "setPlan", "", o.p)}
                      className={cn(
                        "rounded-[2px] border px-2 py-1 font-mono-dy text-[9.5px] tracking-[0.08em] transition-colors ease-mechanical disabled:cursor-default",
                        current
                          ? o.p === "starter"
                            ? "border-[#6f6f6a]/40 bg-white/[0.03] text-[#A1A1A1]"
                            : "border-[#4A90E2]/50 bg-[#4A90E2]/[0.1] text-[#6FCBFF]"
                          : "border-[#1C3050] text-[#6f6f6a] hover:border-[#3a3a3a] hover:text-[#A1A1A1]",
                      )}
                    >
                      {o.tag}
                    </button>
                  );
                })}
              </div>
              <StatusPill state={u.status} />
              <span className="font-mono-dy text-[10.5px] tabular-nums text-[#6f6f6a]">
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "never"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {LIFECYCLE.filter((a) => a.show(u)).map((a) => (
                  <button
                    key={a.action}
                    disabled={pending === u.id + a.action}
                    onClick={() => (a.needsReason ? setReasonFor({ user: u, action: a.action }) : act(u, a.action))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 font-mono-dy text-[10px] tracking-[0.06em] transition-colors ease-mechanical disabled:opacity-40",
                      a.action === "approve" || a.action === "unblock"
                        ? "border-[#3e9e63]/40 bg-[#3e9e63]/[0.08] text-[#6ecf95] hover:bg-[#3e9e63]/[0.15]"
                        : a.action === "makeAdmin"
                          ? "border-[#4A90E2]/40 bg-[#4A90E2]/[0.08] text-[#6FCBFF] hover:bg-[#4A90E2]/[0.15]"
                          : "border-[#1C3050] text-[#A1A1A1] hover:border-[#4A90E2]/40 hover:text-white",
                    )}
                  >
                    {pending === u.id + a.action ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <a.icon className="h-3 w-3" />
                    )}
                    {a.label.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setNotesFor(u);
                    setNotesDraft(u.internalNotes);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-dashed border-[#1C3050] px-2.5 py-1.5 font-mono-dy text-[10px] tracking-[0.06em] text-[#6f6f6a] transition-colors hover:border-[#333] hover:text-[#A1A1A1]"
                  title="Internal note (admin-only)"
                >
                  <StickyNote className="h-3 w-3" />
                  NOTE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reason dialog */}
      <Dialog open={reasonFor !== null} onOpenChange={(o) => !o && setReasonFor(null)}>
        <DialogContent className="dy-dark border-[#1C3050] bg-[#0A1220] text-[#F5F5F3] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              {reasonFor?.action === "reject" ? "Reject signup" : "Block account"}: {reasonFor?.user.email}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#A1A1A1]">
              The reason is shown to the account owner honestly (on their login screen), and stored
              in the audit log. Say it plainly.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Could not verify the business details: reply to our email to proceed."
            className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonFor(null)} className="rounded-[2px] border-[#1C3050] bg-transparent text-[#F5F5F3] hover:bg-[#0A1424]">
              Cancel
            </Button>
            <Button
              onClick={() => reasonFor && act(reasonFor.user, reasonFor.action, reason.trim() || (reasonFor.action === "reject" ? "Signup not approved." : "Blocked by administrator."))}
              className="rounded-[2px] bg-[#2E7CDE] text-[13px] font-semibold text-white hover:bg-[#4A90E2]"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal notes dialog */}
      <Dialog open={notesFor !== null} onOpenChange={(o) => !o && setNotesFor(null)}>
        <DialogContent className="dy-dark border-[#1C3050] bg-[#0A1220] text-[#F5F5F3] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-white">Internal note: {notesFor?.email}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#A1A1A1]">
              Admin-only. This text is never sent to any user endpoint: exactly the kind of data
              the visibility model keeps behind the admin wall.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Context for fellow admins…"
            className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-[13px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesFor(null)} className="rounded-[2px] border-[#1C3050] bg-transparent text-[#F5F5F3] hover:bg-[#0A1424]">
              Cancel
            </Button>
            <Button onClick={saveNotes} className="rounded-[2px] bg-[#2E7CDE] text-[13px] font-semibold text-white hover:bg-[#4A90E2]">
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= LIVE CALLS ================= */

type CallDetail = CallSessionDTO & { turns: CallTurnDTO[] };

export function AdminCallsView() {
  const { lastEvent } = useAdminRealtime();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: listData, mutate: mutateList, isLoading } = useSWR<{ calls: CallSessionDTO[] }>(
    "/api/admin/calls",
    fetcher,
    { refreshInterval: 5000 },
  );
  const { data: detailData, mutate: mutateDetail } = useSWR<{ call: CallDetail }>(
    openId ? `/api/admin/calls?id=${openId}` : null,
    fetcher,
    { refreshInterval: 3000 },
  );

  useEffect(() => {
    if (lastEvent?.event.startsWith("call:")) {
      mutateList();
      if (openId) mutateDetail();
    }
  }, [lastEvent, mutateList, mutateDetail, openId]);

  const calls = listData?.calls ?? [];
  const detail = detailData?.call;
  const live = calls.filter((c) => c.status === "live");

  return (
    <div>
      <AdminHead
        title="Live Calls"
        intro={`Every voice session across all workspaces, streaming in real time. ${live.length > 0 ? `${live.length} live right now.` : "No calls live at this moment: turns appear the instant they happen."} Transcripts include the emotion cues and barge-in markers exactly as they occurred.`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className={cn("overflow-hidden rounded-[4px] border border-[#1C3050]", openId ? "xl:col-span-2" : "xl:col-span-3")}>
          <div className="hairline-b flex items-center justify-between border-b border-[#1C3050] bg-[#0A1220] px-5 py-3.5">
            <span className="font-mono-dy text-[10px] tracking-[0.16em] text-[#6f6f6a]">SESSIONS</span>
            <span className="font-mono-dy text-[10px] tabular-nums text-[#6f6f6a]">{calls.length} TOTAL</span>
          </div>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#4A90E2]" />
            </div>
          ) : calls.length === 0 ? (
            <p className="px-5 py-10 text-center font-mono-dy text-[10.5px] leading-relaxed tracking-[0.1em] text-[#6f6f6a]">
              NO CALLS YET · START ONE FROM ANY WORKSPACE&rsquo;S LIVE CALLS ROOM
            </p>
          ) : (
            <div className="dy-scroll max-h-[560px] overflow-y-auto">
              {calls.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setOpenId(openId === c.id ? null : c.id)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 bg-[#0A1424] px-5 py-3.5 text-left transition-colors hover:bg-[#0B1628]",
                    i > 0 && "border-t border-[#0B1628]",
                    openId === c.id && "bg-[#0B1628]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusPill state={c.status} />
                    <span className="text-[13px] font-semibold text-white">{c.employeeName ?? "AI employee"}</span>
                    <span className="text-[11.5px] text-[#6f6f6a]">← {c.userEmail ?? "unknown"}</span>
                  </div>
                  <span className="font-mono-dy text-[10px] tabular-nums tracking-[0.06em] text-[#6f6f6a]">
                    {new Date(c.startedAt).toLocaleString()} ·{" "}
                    {c.status === "live" ? "IN PROGRESS" : `${Math.floor(c.durationSec / 60)}m ${c.durationSec % 60}s`} ·{" "}
                    {c.turnsCount} TURNS · {c.interruptions} BARGE-INS
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {openId && (
          <div className="overflow-hidden rounded-[4px] border border-[#1C3050] bg-[#0A1220] xl:col-span-3">
            <div className="hairline-b flex items-center justify-between border-b border-[#1C3050] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <button onClick={() => setOpenId(null)} className="text-[#A1A1A1] transition-colors hover:text-white" aria-label="Close transcript">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-display text-[14px] font-bold text-white">
                  {detail?.employeeName ?? "Call"}: transcript
                </span>
                {detail?.status === "live" && (
                  <span className="dy-status dy-status-live">
                    <span className="dy-status-dot" /> LIVE
                  </span>
                )}
              </div>
              <span className="font-mono-dy text-[10px] tabular-nums text-[#6f6f6a]">
                {detail?.turns.length ?? 0} TURNS · REALTIME
              </span>
            </div>
            <div className="dy-scroll max-h-[560px] space-y-3 overflow-y-auto px-4 py-4">
              {!detail ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-[#4A90E2]" />
                </div>
              ) : detail.turns.length === 0 ? (
                <p className="py-8 text-center font-mono-dy text-[10.5px] tracking-[0.12em] text-[#6f6f6a]">
                  CALL CONNECTED · NO SPEECH YET
                </p>
              ) : (
                detail.turns.map((t) => (
                  <div key={t.id} className={cn("flex", t.speaker === "human" ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[84%] rounded-[3px] border px-4 py-3",
                        t.speaker === "human"
                          ? "border-[#1C3050] bg-[#0A1424]"
                          : t.interrupted
                            ? "border-[#d08700]/60 bg-[#d08700]/[0.06]"
                            : "border-[#4A90E2]/25 bg-[#4A90E2]/[0.05]",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "font-mono-dy text-[9.5px] tracking-[0.16em]",
                            t.source === "operator_script" || t.source === "operator_injection" ? "text-[#A9E2FF]" : "text-[#6f6f6a]",
                          )}
                        >
                          {t.speaker === "human" ? "CALLER" : (detail.employeeName ?? "AI").toUpperCase()}
                          {t.speaker === "ai" && t.source === "operator_script" && " · OPERATOR SCRIPT, VERBATIM"}
                          {t.speaker === "ai" && t.source === "operator_injection" && " · OPERATOR SAID THIS"}
                          {t.speaker === "ai" && t.source !== "operator_script" && t.source !== "operator_injection" && t.latencyMs > 0 ? `: ${t.latencyMs}MS` : ""}
                        </span>
                        {t.cues.map((c) => (
                          <span key={c} className="cue-chip">{c}</span>
                        ))}
                        {t.interrupted && (
                          <span className="font-mono-dy text-[9px] font-semibold tracking-[0.14em] text-[#d08700]">
                            INTERRUPTED
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-snug text-neutral-200">{stripCues(t.content)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {detail && Object.keys(detail.cuesSummary ?? {}).length > 0 && (
              <div className="hairline-t border-t border-[#1C3050] px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-dy text-[9.5px] tracking-[0.16em] text-[#6f6f6a]">EMOTION CUES: COUNTED</span>
                  {Object.entries(detail.cuesSummary).map(([cue, n]) => (
                    <span key={cue} className="cue-chip">{cue} ×{Number(n)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= AUDIT LOG ================= */

type AuditRow = {
  id: string;
  action: string;
  actor: string;
  target: string;
  reason: string;
  at: string;
  by: { email: string; name: string | null; role: string } | null;
};

export function AdminAuditView() {
  const { lastEvent } = useAdminRealtime();
  const [filter, setFilter] = useState("");
  const { data, mutate, isLoading } = useSWR<{ logs: AuditRow[] }>("/api/admin/audit", fetcher, {
    refreshInterval: 10000,
  });

  useEffect(() => {
    if (lastEvent) mutate();
  }, [lastEvent, mutate]);

  const logs = useMemo(() => {
    const all = data?.logs ?? [];
    if (!filter.trim()) return all;
    const f = filter.toLowerCase();
    return all.filter((l) => l.action.includes(f) || (l.target ?? "").toLowerCase().includes(f) || (l.by?.email ?? "").toLowerCase().includes(f));
  }, [data, filter]);

  return (
    <div>
      <AdminHead
        title="Audit Log"
        intro="Append-only record of every consequential action: admin decisions, auth events, content edits, media changes. This is the file an auditor asks for."
      />
      <div className="relative mb-4 max-w-sm">
        <ScrollText className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f6f6a]" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, target, or actor…"
          className="rounded-[2px] border-[#1C3050] bg-[#0A1424] pl-9 text-[13px] text-white placeholder:text-[#6f6f6a] focus-visible:ring-[#4A90E2]"
        />
      </div>
      <div className="overflow-hidden rounded-[4px] border border-[#1C3050]">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[#4A90E2]" />
          </div>
        ) : logs.length === 0 ? (
          <p className="px-5 py-10 text-center font-mono-dy text-[10.5px] tracking-[0.12em] text-[#6f6f6a]">
            NO ENTRIES MATCH
          </p>
        ) : (
          logs.map((l, i) => (
            <div
              key={l.id}
              className={cn(
                "grid grid-cols-1 gap-1.5 bg-[#0A1424] px-5 py-3.5 md:grid-cols-[2fr_1.2fr_2fr_1fr] md:items-center md:gap-4",
                i > 0 && "border-t border-[#0B1628]",
              )}
            >
              <span className="font-mono-dy text-[11px] tracking-[0.04em] text-neutral-200">{l.action}</span>
              <span className="truncate text-[11.5px] text-[#A1A1A1]">{l.by?.email ?? l.actor}</span>
              <span className="truncate text-[11.5px] text-[#6f6f6a]">
                {l.target}
                {l.reason ? `: ${l.reason}` : ""}
              </span>
              <span className="font-mono-dy text-[10px] tabular-nums text-[#6f6f6a]">
                {new Date(l.at).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
