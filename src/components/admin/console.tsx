"use client";

/**
 * /admin: the DEYOUNG Control Center.
 * Everything real: content edits, media uploads, user lifecycle, live calls,
 * audit log. Guarded server-side on every /api/admin/* request.
 */

import { useEffect } from "react";
import useSWR from "swr";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSession } from "@/lib/session";
import { AdminRealtimeProvider, useAdminRealtime, type AdminEvent } from "./realtime";
import { AdminUsersView, AdminCallsView, AdminAuditView } from "./views-ops";
import { AdminContentView, AdminMediaView, AdminSettingsView } from "./views-cms";
import { Button } from "@/components/ui/button";
import { Monogram } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  ImagePlus,
  Radio,
  ScrollText,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  ArrowLeft,
  UserPlus,
  Phone,
  PhoneOff,
  Megaphone,
  Mail,
  Eye,
  RefreshCw,
} from "lucide-react";

const NAV = [
  { label: "Overview", to: "", icon: LayoutDashboard, exact: true },
  { label: "Users", to: "users", icon: Users },
  { label: "Content", to: "content", icon: FileText },
  { label: "Media", to: "media", icon: ImagePlus },
  { label: "Live Calls", to: "calls", icon: Radio },
  { label: "Audit Log", to: "audit", icon: ScrollText },
  { label: "Settings", to: "settings", icon: Settings },
];

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

/* ---------------- Event feed panel ---------------- */

const EVENT_META: Record<string, { icon: typeof UserPlus; tint: string; label: string }> = {
  "user:created": { icon: UserPlus, tint: "text-white", label: "New signup" },
  "user:status": { icon: ShieldCheck, tint: "text-white", label: "Account status" },
  "user:role": { icon: ShieldAlert, tint: "text-white", label: "Role change" },
  "call:started": { icon: Phone, tint: "text-[#6fcbff]", label: "Call started" },
  "call:turn": { icon: RefreshCw, tint: "text-neutral-400", label: "Call turn" },
  "call:coached": { icon: Megaphone, tint: "text-[#A9E2FF]", label: "Operator coached" },
  "call:ended": { icon: PhoneOff, tint: "text-neutral-400", label: "Call ended" },
  "contact:new": { icon: Mail, tint: "text-white", label: "Contact inquiry" },
  "content:updated": { icon: FileText, tint: "text-white", label: "Content" },
  "settings:updated": { icon: Settings, tint: "text-white", label: "Settings" },
  "media:updated": { icon: ImagePlus, tint: "text-white", label: "Media" },
};

function EventFeed() {
  const { events } = useAdminRealtime();
  return (
    <div className="flex h-full flex-col rounded-[4px] border border-[#1C3050] bg-[#0A1220]">
      <div className="hairline-b flex items-center justify-between border-b border-[#1C3050] px-5 py-4">
        <h3 className="font-display text-[14px] font-bold text-white">Live event feed</h3>
        <span className="font-mono-dy text-[10px] tracking-[0.14em] text-[#6f6f6a]">
          SOCKET.IO · REALTIME
        </span>
      </div>
      <div className="dy-scroll max-h-[420px] flex-1 overflow-y-auto px-3 py-2">
        {events.length === 0 ? (
          <p className="px-2 py-8 text-center font-mono-dy text-[10.5px] leading-relaxed tracking-[0.1em] text-[#6f6f6a]">
            NO EVENTS YET · SIGNUPS, CALL TURNS, APPROVALS, AND CONTENT EDITS STREAM HERE THE
            MOMENT THEY HAPPEN.
          </p>
        ) : (
          events.map((e, i) => <EventRow key={`${e.at}-${i}`} e={e} />)
        )}
      </div>
    </div>
  );
}

function EventRow({ e }: { e: AdminEvent }) {
  const meta = EVENT_META[e.event] ?? { icon: Eye, tint: "text-neutral-400", label: e.event };
  const p = (e.payload ?? {}) as Record<string, unknown>;
  let detail = "";
  if (e.event === "user:created") detail = `${p.name ?? ""} (${p.email ?? ""}): ${p.orgName ?? ""}`;
  else if (e.event === "user:status") detail = `${p.email ?? ""} → ${p.action ?? ""}${p.reason ? `: ${p.reason}` : ""}`;
  else if (e.event === "user:role") detail = `${p.email ?? ""} → ${p.action ?? ""}`;
  else if (e.event === "call:started") detail = `${p.employeeName ?? ""} ← ${p.userName ?? ""}`;
  else if (e.event === "call:turn") {
    const ai = p.ai as Record<string, unknown> | undefined;
    detail = `${p.employeeName ?? ""}: ${ai ? String(ai.text ?? "").slice(0, 60) : ""}${ai?.source === "operator_script" ? " (operator script)" : ai?.source === "operator_injection" ? " (operator said this)" : ""}`;
  } else if (e.event === "call:coached") {
    detail = `${p.employeeName ?? ""}: ${String(p.directive ?? "").slice(0, 80)} (${p.mode === "exact" ? "say now" : "instruct"})`;
  } else if (e.event === "call:ended") detail = `${Math.floor(Number(p.durationSec ?? 0) / 60)}m ${Number(p.durationSec ?? 0) % 60}s · ${p.turnsCount ?? 0} turns`;
  else if (e.event === "contact:new") detail = `${p.name ?? ""}: ${p.preview ?? ""}`;
  else if (e.event === "content:updated") detail = `${p.key ?? ""}${p.visible ? " (visible)" : " (hidden)"}`;
  else if (e.event === "media:updated") detail = p.filename ? String(p.filename) : p.deleted ? `deleted ${String(p.deleted)}` : "";
  else if (e.event === "settings:updated") detail = "site settings changed";

  return (
    <div className="flex items-start gap-3 rounded-[3px] px-2 py-2.5 transition-colors hover:bg-[#0A1424]">
      <meta.icon className={cn("mt-0.5 h-3.5 w-3.5 flex-none", meta.tint)} strokeWidth={1.8} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono-dy text-[10px] font-semibold tracking-[0.12em] text-neutral-300">
            {meta.label.toUpperCase()}
          </span>
          <span className="font-mono-dy text-[9.5px] tabular-nums text-[#6f6f6a]">
            {new Date(e.at).toLocaleTimeString()}
          </span>
        </div>
        {detail && <p className="mt-0.5 truncate text-[12px] text-neutral-400">{detail}</p>}
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */

type Stats = {
  counts: Record<string, number>;
  recentAudit: { id: string; action: string; actor: string; target: string; at: string; by: string | null }[];
  serverTime: string;
};

function AdminOverview() {
  const { lastEvent } = useAdminRealtime();
  const { data, mutate, isLoading } = useSWR<Stats>("/api/admin/stats", fetcher, {
    refreshInterval: 8000,
  });
  useEffect(() => {
    if (lastEvent) mutate();
  }, [lastEvent, mutate]);

  const c = data?.counts;
  const cards = [
    { l: "TOTAL USERS", v: c?.usersTotal, d: `${c?.usersActive ?? 0} active · ${c?.usersPending ?? 0} pending · ${c?.usersBlocked ?? 0} blocked` },
    { l: "ORGANIZATIONS", v: c?.orgs, d: "real workspaces created" },
    { l: "AI EMPLOYEES", v: c?.employees, d: `${c?.employeesDeployed ?? 0} deployed` },
    { l: "LIVE CALLS", v: c?.callsLive, d: `${c?.callsTotal ?? 0} total sessions`, live: true },
    { l: "CALL TURNS", v: c?.callTurns, d: "voice turns with transcripts" },
    { l: "MESSAGES", v: c?.messages, d: `${c?.conversations ?? 0} conversations` },
    { l: "KNOWLEDGE", v: c?.knowledge, d: "sources connected" },
    { l: "INQUIRIES", v: c?.inquiries, d: `${c?.media ?? 0} media assets` },
  ];

  return (
    <div>
      <AdminHead
        title="Overview"
        intro="Every counter reads the live database. Approvals, blocks, calls, and edits appear here the moment they happen."
      />
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {cards.map((s) => (
                <div
                  key={s.l}
                  className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-4 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-[#333]"
                >
                  <p className="font-mono-dy text-[9.5px] tracking-[0.18em] text-[#A1A1A1]">{s.l}</p>
                  <p className="mt-2.5 font-display-strong text-[26px] leading-none tabular-nums text-white">
                    {s.v ?? 0}
                  </p>
                  <p className="mt-2 text-[10.5px] leading-snug text-[#6f6f6a]">{s.d}</p>
                  {s.live && (s.v ?? 0) > 0 && (
                    <span className="dy-status dy-status-live mt-1.5">
                      <span className="dy-status-dot" /> LIVE NOW
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[4px] border border-[#1C3050] bg-[#0A1220]">
              <div className="hairline-b flex items-center justify-between border-b border-[#1C3050] px-5 py-4">
                <h3 className="font-display text-[14px] font-bold text-white">Recent admin actions</h3>
                <span className="font-mono-dy text-[10px] tracking-[0.14em] text-[#6f6f6a]">AUDIT TRAIL</span>
              </div>
              <div className="dy-scroll max-h-72 overflow-y-auto">
                {(data?.recentAudit ?? []).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 border-b border-[#0B1628] px-5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="font-mono-dy text-[11px] tracking-[0.06em] text-neutral-300">{a.action}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-[#6f6f6a]">
                        {a.by ?? a.actor} {a.target ? `→ ${a.target}` : ""}
                      </p>
                    </div>
                    <span className="flex-none font-mono-dy text-[9.5px] tabular-nums text-[#6f6f6a]">
                      {new Date(a.at).toLocaleString()}
                    </span>
                  </div>
                ))}
                {(data?.recentAudit ?? []).length === 0 && (
                  <p className="px-5 py-8 text-center font-mono-dy text-[10.5px] tracking-[0.1em] text-[#6f6f6a]">
                    NO ACTIONS YET
                  </p>
                )}
              </div>
            </div>
          </div>
          <EventFeed />
        </div>
      )}
    </div>
  );
}

/* ---------------- Shared head ---------------- */

export function AdminHead({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display-strong text-2xl tracking-[-0.02em] text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#A1A1A1]">{intro}</p>
    </div>
  );
}

/* ---------------- Console shell ---------------- */

function TransportChip() {
  const { connected } = useAdminRealtime();
  return connected ? (
    <span className="dy-status dy-status-connected">
      <span className="dy-status-dot" />
      REALTIME: SOCKET LIVE
    </span>
  ) : (
    <span className="dy-status dy-status-attention">
      <span className="dy-status-dot" />
      POLLING FALLBACK: 8S
    </span>
  );
}

function ConsoleInner() {
  const { path, navigate, is } = useDyRouter();
  const { user, logout } = useSession();
  const section = path[1] ?? "";

  return (
    <div className="dy-dark min-h-screen bg-[#070E1A] text-[#F5F5F3]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[#1C3050] bg-[#070E1A] lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[#1C3050] px-5">
          <Monogram size={24} className="text-white" />
          <span className="font-display text-[15px] leading-none text-white">
            CONTROL<span className="text-[#4A90E2]">/</span>CENTER
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto py-3 dy-scroll" aria-label="Admin sections">
          {NAV.map((item) => {
            const active = item.exact ? section === "" : section === item.to;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to ? `${ROUTES.admin}/${item.to}` : ROUTES.admin)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-[2px] px-3 py-2 text-[13.5px] transition-colors ease-mechanical",
                  active ? "bg-[#0A1424] text-white" : "text-[#A1A1A1] hover:bg-[#0A1322] hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && <span className="absolute inset-y-1.5 left-0 w-0.5 bg-[#4A90E2]" aria-hidden="true" />}
                <item.icon className={cn("h-4 w-4", active && "text-[#4A90E2]")} strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#1C3050] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1C3050] bg-[#0A1424] text-[11px] font-bold text-white">
              {(user?.name ?? "AD").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-white">{user?.email}</p>
              <p className="font-mono-dy text-[9.5px] tracking-[0.12em] text-[#4A90E2]">SITE ADMIN</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate(ROUTES.home);
              }}
              className="p-1.5 text-[#A1A1A1] transition-colors hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 border-b border-[#1C3050] bg-[#070E1A] lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Monogram size={20} className="text-white" />
            <span className="font-display text-[14px] text-white">CONTROL/CENTER</span>
          </div>
          <button onClick={() => navigate(ROUTES.app)} className="p-2 text-[#A1A1A1]" aria-label="Back to app">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex overflow-x-auto dy-scroll border-t border-[#1C3050]" aria-label="Admin sections">
          {NAV.map((item) => {
            const active = item.exact ? section === "" : section === item.to;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to ? `${ROUTES.admin}/${item.to}` : ROUTES.admin)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-4 py-2.5 text-[11.5px] font-medium transition-colors",
                  active ? "border-[#4A90E2] text-white" : "border-transparent text-[#A1A1A1]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="border-b border-[#1C3050] bg-[#0A1220] px-4 py-3 lg:pl-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-[#4A90E2]" strokeWidth={1.75} />
            <span className="font-mono-dy text-[10.5px] tracking-[0.14em] text-neutral-400">
              DEYOUNG CONTROL CENTER · ADMIN EYES ONLY
            </span>
          </div>
          <div className="flex items-center gap-4">
            <TransportChip />
            <button
              onClick={() => navigate(ROUTES.app)}
              className="hidden font-mono-dy text-[10.5px] tracking-[0.12em] text-[#A1A1A1] transition-colors hover:text-white sm:block"
            >
              ← BACK TO APP
            </button>
          </div>
        </div>
      </div>

      <main className="min-w-0 pb-16 lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {section === "" && <AdminOverview />}
          {section === "users" && <AdminUsersView />}
          {section === "content" && <AdminContentView />}
          {section === "media" && <AdminMediaView />}
          {section === "calls" && <AdminCallsView />}
          {section === "audit" && <AdminAuditView />}
          {section === "settings" && <AdminSettingsView />}
          {!["", "users", "content", "media", "calls", "audit", "settings"].includes(section) && <AdminOverview />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Guard + entry ---------------- */

export function AdminConsole() {
  const { user, loading } = useSession();
  const { navigate } = useDyRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#4A90E2]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dy-dark min-h-screen bg-[#070E1A] text-[#F5F5F3] flex flex-col items-center justify-center gap-4 px-4 dy-grid-bg">
        <ShieldAlert className="h-8 w-8 text-[#4A90E2]" strokeWidth={1.75} />
        <h1 className="font-display-strong text-2xl text-white">Admin sign-in required</h1>
        <p className="max-w-sm text-center text-sm text-[#A1A1A1]">
          The control center is for administrators. Every admin API request is verified
          server-side: this screen is the friendly version of that rule.
        </p>
        <Button
          onClick={() => navigate(ROUTES.login)}
          className="rounded-[2px] bg-[#4A90E2] text-[13.5px] font-semibold text-white hover:bg-[#2E7CDE]"
        >
          Sign in as admin
        </Button>
      </div>
    );
  }

  if (user.accountRole !== "admin") {
    return (
      <div className="dy-dark min-h-screen bg-[#070E1A] text-[#F5F5F3] flex flex-col items-center justify-center gap-4 px-4">
        <ShieldAlert className="h-8 w-8 text-[#4A90E2]" strokeWidth={1.75} />
        <h1 className="font-display-strong text-2xl text-white">403: Admin access required</h1>
        <p className="max-w-md text-center text-sm leading-relaxed text-[#A1A1A1]">
          Your account ({user.email}) is a workspace account. Admin rights are granted by another
          administrator and every grant is audit-logged.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.app)}
          className="rounded-[2px] border-[#1C3050] text-white hover:bg-[#0A1424]"
        >
          Back to your workspace
        </Button>
      </div>
    );
  }

  return (
    <AdminRealtimeProvider>
      <ConsoleInner />
    </AdminRealtimeProvider>
  );
}
