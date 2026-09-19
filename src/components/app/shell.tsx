"use client";

import { useEffect } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSession } from "@/lib/session";
import { Monogram } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UserRound,
  Radio,
  Inbox,
  Users,
  BookOpen,
  AudioWaveform,
  Workflow,
  Plug,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  ShieldCheck,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", to: ROUTES.app, icon: LayoutDashboard, exact: true },
  { label: "AI Employees", to: ROUTES.appEmployees, icon: UserRound },
  { label: "Live Calls", to: ROUTES.appLiveCalls, icon: Radio },
  { label: "Inbox", to: ROUTES.appInbox, icon: Inbox },
  { label: "Customers", to: ROUTES.appCustomers, icon: Users },
  { label: "Knowledge", to: ROUTES.appKnowledge, icon: BookOpen },
  { label: "Voice Studio", to: ROUTES.appVoiceStudio, icon: AudioWaveform },
  { label: "Automations", to: ROUTES.appAutomations, icon: Workflow },
  { label: "Integrations", to: ROUTES.appIntegrations, icon: Plug },
  { label: "Analytics", to: ROUTES.appAnalytics, icon: BarChart3 },
  { label: "Settings", to: ROUTES.appSettings, icon: Settings },
];

/** Honest awaiting-activation screen: checks live so approval unlocks it within seconds. */
function ActivationGate({ reason }: { reason: string }) {
  const { refresh } = useSession();
  const { navigate } = useDyRouter();
  const { logout } = useSession();

  // Poll every 4s: an admin approving flips this screen to the workspace automatically.
  useEffect(() => {
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div className="dy-dark min-h-screen bg-[#070E1A] text-[#F5F5F3] flex flex-col items-center justify-center px-4 grain-dy">
      <div className="absolute inset-0 dy-grid-bg opacity-40" aria-hidden="true" />
      <div className="relative max-w-lg w-full rounded-[4px] border border-[#1C3050] bg-[#0A1220] p-8 md:p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#1C3050] bg-[#0A1424]">
          <Hourglass className="h-5 w-5 text-[#4A90E2]" strokeWidth={1.75} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <span className="dy-status dy-status-attention">
            <span className="dy-status-dot" />
            AWAITING ACTIVATION
          </span>
        </div>
        <h1 className="font-display-strong mt-5 text-2xl leading-tight tracking-[-0.02em] text-white">
          Your workspace is created: an administrator is activating it.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#A1A1A1]">
          This screen is honest: new accounts wait in a real approval queue. The moment you are
          approved, this page becomes your dashboard automatically. No refresh needed.
        </p>
        {reason && (
          <p className="mt-4 rounded-[3px] border border-[#1C3050] bg-[#0A1424] px-4 py-3 font-mono-dy text-[11px] leading-relaxed tracking-[0.06em] text-[#A1A1A1]">
            REASON ON FILE: {reason.toUpperCase()}
          </p>
        )}
        <p className="mt-6 font-mono-dy text-[10px] tracking-[0.16em] text-[#6f6f6a]">
          STATUS CHECKS EVERY 4 SECONDS · ASK {""}
          <span className="text-[#A1A1A1]">SUPPORT@DEYOUNGCOMMUNICATION.COM</span> TO HURRY
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate(ROUTES.home);
            }}
            className="rounded-[2px] border-[#1C3050] bg-transparent text-[#F5F5F3] hover:bg-[#0A1424]"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { path, navigate, is } = useDyRouter();
  const { user, loading, logout } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-white flex flex-col items-center justify-center gap-4 px-4 dy-grid-bg grain-dy">
        <Monogram size={40} className="text-white" />
        <h1 className="font-display text-2xl">Sign in to open your workspace</h1>
        <p className="text-sm text-[#A1A1A1] max-w-sm text-center">
          The DEYOUNG application is for signed-in organizations. Create an account and your
          workspace opens with honest, real states.
        </p>
        <div className="flex gap-3">
          <Button
            className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
            onClick={() => navigate(ROUTES.signup)}
          >
            Create your AI employee
          </Button>
          <Button
            variant="outline"
            className="border-[#1C3050] text-white hover:bg-[#0A1424] rounded-[2px]"
            onClick={() => navigate(ROUTES.login)}
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  // Pending accounts see the honest gate: approved flips it live.
  if (user.status !== "active") {
    return <ActivationGate reason={user.statusReason} />;
  }

  const isAdmin = user.accountRole === "admin";
  const mobileActive = NAV.find((n) => (n.exact ? path.length === 1 : is(n.to)));

  return (
    <div className="dy-dark min-h-screen bg-[#070E1A] text-[#F5F5F3] flex flex-col">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-[#070E1A] border-r border-[#1C3050] flex-col z-40">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#1C3050]">
          <Monogram size={24} className="text-white" />
          <span className="font-display text-base text-white leading-none">
            DEYOUNG<span className="text-[#4A90E2]">.</span>
          </span>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto dy-scroll" aria-label="Application sections">
          {NAV.map((item) => {
            const active = item.exact ? path.length === 1 : is(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[2px] relative transition-colors ease-mechanical group",
                  active
                    ? "bg-[#0A1424] text-white"
                    : "text-[#A1A1A1] hover:text-white hover:bg-[#0A1322]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#4A90E2]" aria-hidden="true" />
                )}
                <item.icon
                  className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#4A90E2]" : "group-hover:text-white")}
                  strokeWidth={1.75}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
        {isAdmin && (
          <div className="px-3 pb-2">
            <button
              onClick={() => navigate(ROUTES.admin)}
              className="w-full flex items-center gap-3 rounded-[2px] border border-dashed border-[#2e2e2e] px-3 py-2.5 text-[13px] text-[#A1A1A1] transition-colors ease-mechanical hover:border-[#4A90E2]/50 hover:text-white"
            >
              <ShieldCheck className="h-4 w-4 text-[#4A90E2]" strokeWidth={1.75} />
              Admin console
            </button>
          </div>
        )}
        <div className="p-4 border-t border-[#1C3050]">
          {isAdmin && (
            <div className="mb-3 flex items-center justify-between rounded-[6px] border border-[#A9E2FF]/35 bg-gradient-to-b from-[#A9E2FF]/[0.08] to-transparent px-3 py-2">
              <span className="font-mono-dy text-[9.5px] font-semibold tracking-[0.16em] text-[#CFEAFF]">
                OWNER ACCESS
              </span>
              <span className="font-mono-dy text-[9px] tracking-[0.12em] text-[#8f8f89]">$0 · ALL</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#0A1424] border border-[#1C3050] flex items-center justify-center text-xs font-bold text-white">
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name ?? user.email}</p>
              <p className="text-[10px] text-[#A1A1A1] truncate">
                {isAdmin ? `Owner · ${user.organizationName}` : `${user.role} · ${user.organizationName}`}
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate(ROUTES.home);
              }}
              className="p-1.5 text-[#A1A1A1] hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#070E1A] border-b border-[#1C3050]">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monogram size={20} className="text-white" />
            <span className="text-sm font-semibold text-white">{mobileActive?.label ?? "Overview"}</span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => navigate(ROUTES.admin)}
                className="p-2 text-[#4A90E2]"
                aria-label="Admin console"
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate(ROUTES.home);
              }}
              className="p-2 text-[#A1A1A1]"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto dy-scroll border-t border-[#1C3050]" aria-label="Application sections">
          {NAV.map((item) => {
            const active = item.exact ? path.length === 1 : is(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ease-mechanical",
                  active ? "border-[#4A90E2] text-white" : "border-transparent text-[#A1A1A1]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 lg:ml-60 min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function AppPageHead({
  title,
  intro,
  actions,
}: {
  title: string;
  intro: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display-strong text-2xl lg:text-3xl tracking-[-0.02em] text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#A1A1A1] max-w-xl leading-relaxed">{intro}</p>
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-dashed border-[#1C3050] bg-[#0A1322] px-6 py-14 text-center max-w-lg mx-auto">
      <div className="mx-auto h-11 w-11 rounded-full border border-[#1C3050] bg-[#0A1424] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[#A1A1A1]" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 font-display font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm text-[#A1A1A1] leading-relaxed">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  live = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-5 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-[#333]">
      <p className="font-mono-dy text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">{label}</p>
      <p className="mt-3 font-display-strong text-3xl tabular-nums text-white">{value}</p>
      <p className="mt-2 text-xs text-[#A1A1A1] leading-relaxed">{detail}</p>
      {live && (
        <span className="dy-status dy-status-live mt-2">
          <span className="dy-status-dot" /> LIVE
        </span>
      )}
    </div>
  );
}

export function StatusPill({ state }: { state: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    connected: { cls: "dy-status-connected", label: "Connected" },
    needs_attention: { cls: "dy-status-attention", label: "Needs attention" },
    not_connected: { cls: "dy-status-neutral", label: "Not connected" },
    draft: { cls: "dy-status-neutral", label: "Draft" },
    deployed: { cls: "dy-status-connected", label: "Deployed" },
    paused: { cls: "dy-status-attention", label: "Paused" },
    indexed: { cls: "dy-status-connected", label: "Indexed" },
    pending: { cls: "dy-status-neutral", label: "Pending" },
    live: { cls: "dy-status-live", label: "Live" },
    completed: { cls: "dy-status-neutral", label: "Completed" },
    failed: { cls: "dy-status-blocked", label: "Failed" },
    needs_configuration: { cls: "dy-status-attention", label: "Configuration required" },
    open: { cls: "dy-status-live", label: "Open" },
    closed: { cls: "dy-status-neutral", label: "Closed" },
    unknown: { cls: "dy-status-neutral", label: "Unknown" },
    granted: { cls: "dy-status-connected", label: "Granted" },
    declined: { cls: "dy-status-attention", label: "Declined" },
    active: { cls: "dy-status-connected", label: "Active" },
    blocked: { cls: "dy-status-blocked", label: "Blocked" },
    rejected: { cls: "dy-status-blocked", label: "Rejected" },
  };
  const s = map[state] ?? { cls: "dy-status-neutral", label: state };
  return (
    <span className={`dy-status ${s.cls}`}>
      <span className="dy-status-dot" />
      {s.label}
    </span>
  );
}
