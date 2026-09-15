"use client";

import { useEffect, useState } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { AppPageHead, StatCard, EmptyState } from "./shell";
import { Button } from "@/components/ui/button";
import type { UsageSummary } from "@/lib/types";
import { UserRound, ArrowRight, Loader2 } from "lucide-react";

export function OverviewView() {
  const { navigate } = useDyRouter();
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d.overview ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-[#E10600] animate-spin" />
      </div>
    );
  }

  const o = data;
  const fresh = o ? o.employees === 0 && o.conversations === 0 : true;

  return (
    <div>
      <AppPageHead
        title="Overview"
        intro="The honest state of your organization: what exists, what happened, and what to do next. No vanity metrics."
      />

      {fresh ? (
        <EmptyState
          icon={UserRound}
          title="Create your first AI employee"
          body="Your workspace is empty and that is stated plainly. Create an AI employee from a role template, deploy it, and start a real web chat conversation to see the platform work end to end."
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
                onClick={() => navigate(ROUTES.appEmployees)}
              >
                Create your first AI employee <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-[#262626] text-white hover:bg-[#111111] rounded-[2px]"
                onClick={() => navigate(ROUTES.appIntegrations)}
              >
                Connect an integration
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="AI employees"
              value={o?.employees ?? 0}
              detail={`${o?.employees ?? 0} configured, counting drafts`}
            />
            <StatCard
              label="Conversations"
              value={o?.conversations ?? 0}
              detail={o?.lastActivityAt ? `Last AI reply ${new Date(o.lastActivityAt).toLocaleString()}` : "No AI replies yet"}
            />
            <StatCard label="AI messages" value={o?.messages ?? 0} detail="Generated and stored replies" />
            <StatCard label="Audit entries" value={o?.auditEntries ?? 0} detail="Immutable action log" />
          </div>

          <div className="mt-6 rounded-[2px] border border-[#262626] bg-[#111111] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Platform activity, last 14 days</p>
              <p className="text-xs text-[#A1A1A1]">Real usage events only</p>
            </div>
            <div className="mt-6 flex items-end gap-1.5 h-24">
              {(o?.eventsByDay ?? []).map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5" title={`${d.day}: ${d.count} events`}>
                  <div
                    className="w-full bg-[#E10600] rounded-t-[2px] min-h-[2px] ease-mechanical"
                    style={{ height: `${Math.max(2, (d.count / Math.max(1, Math.max(...(o?.eventsByDay ?? [{ count: 1 }]).map((x) => x.count)))) * 96)}px` }}
                  />
                  <span className="text-[9px] text-[#6b6b6b]">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#A1A1A1]">
              {(o?.eventsByDay ?? []).every((d) => d.count === 0)
                ? "No activity in this window yet. Events appear as your AI employees work."
                : `${o?.usageEvents ?? 0} total recorded events.`}
            </p>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(ROUTES.appEmployees)}
              className="rounded-[2px] border border-[#262626] bg-[#111111] p-5 text-left hover:border-[#3a3a3a] transition-colors ease-mechanical"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Next step</p>
              <p className="mt-2 text-sm font-semibold text-white">Tune your employees</p>
              <p className="mt-1 text-xs text-[#A1A1A1]">Instructions and escalation rules</p>
            </button>
            <button
              onClick={() => navigate(ROUTES.appInbox)}
              className="rounded-[2px] border border-[#262626] bg-[#111111] p-5 text-left hover:border-[#3a3a3a] transition-colors ease-mechanical"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Watch</p>
              <p className="mt-2 text-sm font-semibold text-white">Open the inbox</p>
              <p className="mt-1 text-xs text-[#A1A1A1]">Every conversation, every channel</p>
            </button>
            <button
              onClick={() => navigate(ROUTES.appKnowledge)}
              className="rounded-[2px] border border-[#262626] bg-[#111111] p-5 text-left hover:border-[#3a3a3a] transition-colors ease-mechanical"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Ground it</p>
              <p className="mt-2 text-sm font-semibold text-white">Add knowledge</p>
              <p className="mt-1 text-xs text-[#A1A1A1]">Approved answers only</p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
