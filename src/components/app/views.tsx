"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { AppPageHead, EmptyState, StatusPill, StatCard } from "./shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/session";
import { Waveform, attachMicAnalyser } from "@/components/brand/waveform";
import { CallConsole } from "./call-console";
import { CloneLab, CloneVoicesList } from "./clone-lab";
import { cn } from "@/lib/utils";
import type { CustomerDTO, KnowledgeSourceDTO, UsageSummary, AiEmployeeDTO, CallSessionDTO, VoiceCloneDTO } from "@/lib/types";
import {
  Users,
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Mic,
  MicOff,
  Workflow,
  Plug,
  BarChart3,
  Settings,
  ShieldCheck,
  Lock,
  ArrowRight,
} from "lucide-react";

function data_sources_safe(d: { sources?: KnowledgeSourceDTO[] }): KnowledgeSourceDTO[] {
  return d.sources ?? [];
}

/* ---------------- Customers ---------------- */

export function CustomersView() {
  const [customers, setCustomers] = useState<CustomerDTO[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/customers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <AppPageHead
        title="Customers"
        intro="Unified profiles built from real conversations. The AI only accesses what your permissions allow, and human access to records is itself logged."
      />
      {customers === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          body="Customers appear here after your first conversations. Profiles are created when a conversation starts and grow with every interaction."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{c.name}</p>
                  <p className="text-xs text-[#A1A1A1] mt-0.5">
                    Customer since {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusPill state={c.consentStatus} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-[#A1A1A1]">
                {c.email && <p>{c.email}</p>}
                {c.phone && <p>{c.phone}</p>}
                <p>
                  {c.conversationCount ?? 0} conversation{(c.conversationCount ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Knowledge ---------------- */

export function KnowledgeView() {
  const { toast } = useToast();
  const [sources, setSources] = useState<KnowledgeSourceDTO[] | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("manual");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(() => {
    fetch("/api/knowledge", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSources(data_sources_safe(d)))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim()) {
      toast({ title: "Give the source a title." });
      return;
    }
    if ((type === "manual" || type === "faq" || type === "txt") && !content.trim()) {
      toast({ title: "Add the text content so it can be indexed." });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title:
            data.status === "indexed"
              ? "Source indexed."
              : "Source stored with its real status.",
          description:
            data.status === "indexed"
              ? `${data.chunkCount} chunks available for retrieval.`
              : data.error ?? "Document parsing ships with the knowledge worker in Phase 1.",
        });
        setOpen(false);
        setTitle("");
        setContent("");
        load();
      } else {
        toast({ title: data.error ?? "Could not add source." });
      }
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Source deleted. Chunks and index entries removed." });
      load();
    }
  }

  const typeLabel: Record<string, string> = {
    manual: "Manual entry",
    faq: "FAQ",
    txt: "Text",
    url: "Website URL",
    pdf: "PDF",
    docx: "DOCX",
  };

  return (
    <div>
      <AppPageHead
        title="Knowledge"
        intro="What your AI employees are allowed to know. Sources show type, status, version, and chunk counts. Nothing is marked indexed until it actually is."
        actions={
          <Button className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add source
          </Button>
        }
      />
      {sources === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge sources"
          body="Add your first source: a manual entry, an FAQ, or pasted text indexes immediately for retrieval. PDF and DOCX parsing arrives with the knowledge worker and is labeled accordingly."
          action={
            <Button className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]" onClick={() => setOpen(true)}>
              Add your first source
            </Button>
          }
        />
      ) : (
        <div className="rounded-[2px] border border-[#1C3050] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0A1424] border-b border-[#1C3050]">
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Source</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Chunks</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Updated</th>
                <th className="px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C3050] bg-[#0A1322]">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-white">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5 max-w-md">{s.statusDetail}</p>
                  </td>
                  <td className="px-4 py-3 text-[#A1A1A1] text-xs uppercase">{typeLabel[s.type] ?? s.type}</td>
                  <td className="px-4 py-3"><StatusPill state={s.status} /></td>
                  <td className="px-4 py-3 text-[#A1A1A1] tabular-nums">{s.chunkCount ?? 0}</td>
                  <td className="px-4 py-3 text-[#A1A1A1] text-xs">{new Date(s.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
                      className="p-1.5 text-[#A1A1A1] hover:text-[#4A90E2]"
                      aria-label={`Delete ${s.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A1322] border-[#1C3050] text-[#F5F5F3]">
          <DialogHeader>
            <DialogTitle className="text-white">Add knowledge source</DialogTitle>
            <DialogDescription className="text-[#A1A1A1]">
              Text, manual entries, and FAQs index now for keyword retrieval. Vector embeddings
              arrive with the knowledge worker.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Source type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[#0A1424] border-[#1C3050] text-white rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A1424] border-[#1C3050] text-white">
                  <SelectItem value="manual">Manual entry (indexes now)</SelectItem>
                  <SelectItem value="faq">FAQ (indexes now)</SelectItem>
                  <SelectItem value="txt">Text (indexes now)</SelectItem>
                  <SelectItem value="url">Website URL (needs knowledge worker)</SelectItem>
                  <SelectItem value="pdf">PDF (needs knowledge worker)</SelectItem>
                  <SelectItem value="docx">DOCX (needs knowledge worker)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="k-title" className="text-[#A1A1A1]">Title</Label>
              <Input
                id="k-title"
                placeholder="Service pricing 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#0A1424] border-[#1C3050] text-white placeholder:text-[#6b6b6b] rounded-[2px]"
              />
            </div>
            {["manual", "faq", "txt"].includes(type) && (
              <div className="space-y-2">
                <Label htmlFor="k-content" className="text-[#A1A1A1]">Content</Label>
                <Textarea
                  id="k-content"
                  rows={7}
                  placeholder={"Paste policies, FAQs, or service details.\n\nShort standalone statements with concrete numbers work best."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-[#0A1424] border-[#1C3050] text-white placeholder:text-[#6b6b6b] rounded-[2px]"
                />
              </div>
            )}
            {["url", "pdf", "docx"].includes(type) && (
              <p className="text-xs text-[#d08700] leading-relaxed border border-[#d08700]/30 bg-[#101e33] rounded-[2px] p-3">
                This type is stored with status configuration required. Document parsing and
                website crawling ship with the knowledge worker in Phase 1. Paste the same content
                as a manual source to index it today.
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#1C3050] text-[#A1A1A1] rounded-[2px]">
              Cancel
            </Button>
            <Button onClick={add} disabled={pending} className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Voice Studio ---------------- */

/* ---------------- Voice plan gate (major functions are paid) ---------------- */

function VoicePlanGate() {
  const { navigate } = useDyRouter();
  const { user } = useSession();
  return (
    <div className="relative overflow-hidden rounded-[4px] border border-brand/25 bg-brand/[0.04] p-7 md:p-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-brand/30 bg-brand/10">
          <Lock className="h-4 w-4 text-brand" />
        </span>
        <span className="font-mono-dy text-[10.5px] tracking-[0.18em] text-brand">
          PAID FEATURE · BUSINESS PLAN
        </span>
        {user && (
          <span className="ml-auto font-mono-dy text-[10.5px] tracking-[0.14em] text-neutral-500">
            YOUR PLAN: {user.plan.toUpperCase()}
          </span>
        )}
      </div>
      <h2 className="font-display mt-5 text-[22px] font-bold tracking-[-0.02em] text-white">
        Real-time voice lives in the paid plans
      </h2>
      <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-neutral-400">
        The free Starter plan covers text chat only, and that is deliberate: live voice minutes,
        the emotion engine, and true barge-in are the major functions of this platform, not free
        extras. Start the Business plan to unlock live calls and the practice console. Nothing is
        simulated or previewed here while locked. Text chat works fully right now under Inbox.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => navigate(ROUTES.pricing)}
          className="btn-flare h-11 px-6 text-[13.5px]"
        >
          See the plans
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.appInbox)}
          className="btn-glass h-11 px-6 text-[13.5px]"
        >
          Use text chat now
        </Button>
      </div>
      <p className="mt-5 font-mono-dy text-[10px] tracking-[0.14em] text-neutral-600">
        AN ADMINISTRATOR CAN ALSO SWITCH YOUR WORKSPACE PLAN INSTANTLY FROM THE ADMIN CONSOLE
      </p>
    </div>
  );
}

export function VoiceStudioView() {
  const { user } = useSession();
  const locked = !!user && user.accountRole !== "admin" && user.plan === "starter";
  const [micOn, setMicOn] = useState(false);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [clones, setClones] = useState<VoiceCloneDTO[] | null>(null);

  const loadClones = useCallback(() => {
    fetch("/api/voice-clones", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setClones(d.clones ?? []))
      .catch(() => setClones([]));
  }, []);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  useEffect(() => {
    loadClones();
  }, [loadClones]);

  async function toggleMic() {
    if (micOn) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cleanupRef.current = attachMicAnalyser(stream, setAmplitudes);
      setMicOn(true);
    } catch {
      setAmplitudes([]);
      setMicOn(false);
    }
  }

  return (
    <div>
      <AppPageHead
        title="Voice Studio"
        intro="Clone a voice, assign it to your AI employees, and practice with your real microphone. Samples are measured in your browser and never uploaded."
      />
      {locked ? (
        <VoicePlanGate />
      ) : (
      <div className="space-y-4">
        <CloneLab onSaved={loadClones} />

        <CloneVoicesList clones={clones} onChanged={loadClones} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">Practice console</p>
            <div className="mt-6">
              <Waveform
                amplitudes={amplitudes}
                height={88}
                color="#4A90E2"
                baselineColor="#1C3050"
                label={micOn ? "Your live microphone waveform" : "Idle waveform, flat baseline"}
              />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={toggleMic}
                className={micOn ? "bg-[#0B1628] border border-[#1C3050] text-white hover:bg-[#222] rounded-[2px]" : "bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"}
              >
                {micOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {micOn ? "Stop microphone" : "Start microphone"}
              </Button>
              <span className={`dy-status ${micOn ? "dy-status-live" : "dy-status-neutral"}`}>
                <span className="dy-status-dot" />
                {micOn ? "Listening to your real input" : "Idle, flat baseline"}
              </span>
            </div>
            <p className="mt-4 text-xs text-[#6b6b6b] leading-relaxed">
              Practice mode: this is your real microphone signal rendered live, not a simulated
              customer call. Nothing here is stored.
            </p>
          </div>

          <div className="rounded-[2px] border border-dashed border-[#1C3050] bg-[#0A1322] p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#A1A1A1]" />
              <p className="text-sm font-semibold text-white">How the cloning engine works, honestly</p>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#A1A1A1]">
              <p>
                <span className="font-mono-dy text-[10px] tracking-[0.12em] text-[#A9E2FF]">TIMBRE MATCH · LIVE</span>
                <br />
                Your recordings are measured in this browser: median pitch by autocorrelation, pace by
                syllable rate, energy by loudness. The numbers, never the audio, drive your
                employee&apos;s voice: register-matched system voice, pitch and pace multipliers, live on
                every call.
              </p>
              <p>
                <span className="font-mono-dy text-[10px] tracking-[0.12em] text-[#6f6f6a]">NEURAL CLONE · PENDING</span>
                <br />
                Rebuilding your exact timbre needs a heavy neural model that does not run in this
                environment. When a free provider connects, the same profile upgrades in place. Until
                then it is labeled exactly like this, never faked as done.
              </p>
              <p>
                <span className="font-mono-dy text-[10px] tracking-[0.12em] text-[#6f6f6a]">CONSENT · ALWAYS</span>
                <br />
                Every profile stores who consented and when. Deleting a profile removes it from every
                employee immediately. Cloning a voice you do not own or have rights to is not
                permitted here.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

/* ---------------- Live Calls ---------------- */

export function LiveCallsView() {
  const { navigate } = useDyRouter();
  const { user } = useSession();
  const locked = !!user && user.accountRole !== "admin" && user.plan === "starter";
  const [employees, setEmployees] = useState<AiEmployeeDTO[] | null>(null);
  const [pastCalls, setPastCalls] = useState<CallSessionDTO[] | null>(null);
  const [callsVersion, setCallsVersion] = useState(0);

  const load = useCallback(() => {
    fetch("/api/employees", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees ?? []))
      .catch(() => setEmployees([]));
    fetch("/api/calls", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPastCalls(d.calls ?? []))
      .catch(() => setPastCalls([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, callsVersion]);

  return (
    <div>
      <AppPageHead
        title="Live Calls"
        intro="A real voice call in your browser: streaming recognition, emotion cues, and true barge-in: speak mid-sentence and it stops. Every turn is saved with measured latency."
      />
      {locked ? (
        <VoicePlanGate />
      ) : employees === null ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
        </div>
      ) : (
        <CallConsole employees={employees} onCallEnded={() => setCallsVersion((v) => v + 1)} />
      )}

      {/* Past calls: real records only */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Recent calls</h2>
          <button
            onClick={() => setCallsVersion((v) => v + 1)}
            className="font-mono-dy text-[10.5px] tracking-[0.14em] text-[#A1A1A1] transition-colors hover:text-white"
          >
            REFRESH
          </button>
        </div>
        {pastCalls === null ? (
          <div className="mt-3 flex h-20 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[#4A90E2]" />
          </div>
        ) : pastCalls.length === 0 ? (
          <p className="mt-3 rounded-[4px] border border-dashed border-[#1C3050] bg-[#0A1322] px-5 py-6 text-center text-[13px] text-[#A1A1A1]">
            No calls yet. The list fills with real sessions: durations, turns, barge-ins, and cue
            counts come from the turns that actually happened.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[4px] border border-[#1C3050]">
            {pastCalls.map((c, i) => {
              const cueCount = Object.values(c.cuesSummary ?? {}).reduce((a, b) => a + b, 0);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(ROUTES.appInbox)}
                  className={cn(
                    "grid w-full grid-cols-1 gap-2 bg-[#0A1424] px-5 py-4 text-left transition-colors ease-mechanical hover:bg-[#0B1628]",
                    i > 0 && "border-t border-[#1C3050]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill state={c.status} />
                    <span className="text-[13.5px] font-semibold text-white">
                      {c.employeeName ?? "AI employee"}
                    </span>
                    <span className="font-mono-dy text-[11px] tabular-nums tracking-[0.06em] text-[#6f6f6a]">
                      {c.status === "live" ? "0" : `${Math.floor(c.durationSec / 60)}m ${c.durationSec % 60}s`} ·{" "}
                      {c.turnsCount} TURNS · {c.interruptions} BARGE-IN{c.interruptions === 1 ? "" : "S"} ·{" "}
                      {cueCount} VOICE SHIFTS
                    </span>
                  </div>
                  <span className="font-mono-dy text-[10px] tracking-[0.1em] text-[#6f6f6a]">
                    {new Date(c.startedAt).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Automations ---------------- */

/* ---------------- Automations: real rules + run log ---------------- */

type RuleDTO = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runCount: number;
  createdAt: string;
};

type RunDTO = {
  id: string;
  ruleId: string;
  trigger: string;
  status: string;
  detail: string;
  createdAt: string;
};

const TRIGGER_OPTIONS = [
  { value: "call_ended", label: "Call ends" },
  { value: "conversation_closed", label: "Conversation closes" },
  { value: "lead_created", label: "New contact inquiry" },
];

const ACTION_OPTIONS = [
  { value: "draft_followup", label: "Draft a follow-up message (AI)" },
  { value: "notify_admin", label: "Notify the owner instantly" },
];

export function AutomationsView() {
  const { toast } = useToast();
  const [rules, setRules] = useState<RuleDTO[] | null>(null);
  const [runs, setRuns] = useState<RunDTO[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", trigger: "call_ended", action: "draft_followup" });
  const [pending, setPending] = useState(false);

  const load = useCallback(() => {
    fetch("/api/automations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setRules(d.rules ?? []);
        setRuns(d.runs ?? []);
      })
      .catch(() => setRules([]));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  async function createRule() {
    if (!draft.name.trim()) {
      toast({ title: "Give the rule a name first." });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateOpen(false);
        setDraft({ name: "", trigger: "call_ended", action: "draft_followup" });
        load();
        toast({
          title: "Automation is live.",
          description: "It fires the moment its trigger happens for real. Every run lands in the log below.",
        });
      } else {
        toast({ title: data.error ?? "Could not create the rule." });
      }
    } finally {
      setPending(false);
    }
  }

  async function toggle(rule: RuleDTO) {
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    });
    load();
  }

  async function remove(rule: RuleDTO) {
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, remove: true }),
    });
    load();
    toast({ title: "Automation removed." });
  }

  const rulesByName = new Map((rules ?? []).map((r) => [r.id, r.name]));

  return (
    <div>
      <AppPageHead
        title="Automations"
        intro="Rules that fire on real platform events. Trigger, action, and a complete run log: the follow-up draft is written by the AI from the actual transcript, and every run is recorded, failures included."
        actions={
          <Button
            className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New automation
          </Button>
        }
      />

      {rules === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[#4A90E2]" />
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          body="Create a rule: when a call ends, when a conversation closes, or when a new inquiry arrives, the platform acts on it automatically and logs the run."
          action={
            <Button
              className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
              onClick={() => setCreateOpen(true)}
            >
              Create the first automation
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {(rules ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-[4px] border border-[#1C3050] bg-[#0A1424] p-4 transition-all duration-300 ease-mechanical hover:border-[#2E7CDE]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-white">{r.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono-dy text-[10px] tracking-[0.1em]">
                      <span className="rounded-[2px] border border-[#24344F] bg-[#0B1628] px-2 py-1 text-[#9FC6E8]">
                        WHEN · {TRIGGER_OPTIONS.find((t) => t.value === r.trigger)?.label ?? r.trigger}
                      </span>
                      <ArrowRight className="h-3 w-3 text-[#4A90E2]" />
                      <span className="rounded-[2px] border border-[#24344F] bg-[#0B1628] px-2 py-1 text-[#9FC6E8]">
                        DO · {ACTION_OPTIONS.find((a) => a.value === r.action)?.label ?? r.action}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[11.5px] text-[#6f6f6a]">
                      {r.runCount} run{r.runCount === 1 ? "" : "s"} · created {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toggle(r)}
                      className={cn(
                        "relative h-6 w-11 rounded-full border transition-colors",
                        r.enabled ? "border-[#2E7CDE] bg-[#2E7CDE]/30" : "border-[#24344F] bg-[#0B1628]",
                      )}
                      role="switch"
                      aria-checked={r.enabled}
                      aria-label={r.enabled ? "Pause automation" : "Enable automation"}
                    >
                      <span
                        className={cn(
                          "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
                          r.enabled ? "left-[22px] bg-[#2FD4FF]" : "left-1 bg-neutral-500",
                        )}
                      />
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="p-1.5 text-[#6f6f6a] transition-colors hover:text-white"
                      aria-label="Delete automation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Run log */}
          <div className="flex flex-col overflow-hidden rounded-[4px] border border-[#1C3050] bg-[#0A1220]">
            <div className="flex items-center justify-between border-b border-[#1C3050] px-4 py-3">
              <p className="text-[13px] font-semibold text-white">Run log</p>
              <span className="font-mono-dy text-[10px] tracking-[0.14em] text-[#6f6f6a]">
                LAST 25 · LIVE
              </span>
            </div>
            <div className="dy-scroll max-h-[520px] flex-1 overflow-y-auto">
              {runs.length === 0 ? (
                <p className="px-4 py-10 text-center font-mono-dy text-[10.5px] leading-relaxed tracking-[0.1em] text-[#6f6f6a]">
                  NO RUNS YET · END A CALL, CLOSE A CHAT, OR RECEIVE AN INQUIRY AND THE RULE
                  FIRES FOR REAL, RIGHT HERE.
                </p>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="border-b border-[#0B1628] px-4 py-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-mono-dy text-[10.5px] font-semibold tracking-[0.08em] text-neutral-300">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            run.status === "ok" ? "bg-[#2FD4FF]" : "bg-[#d08700]",
                          )}
                        />
                        {rulesByName.get(run.ruleId) ?? run.ruleId.slice(0, 8)}
                      </span>
                      <span className="font-mono-dy text-[9.5px] tabular-nums text-[#6f6f6a]">
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {run.detail && (
                      <p
                        className={cn(
                          "mt-1.5 whitespace-pre-wrap rounded-[3px] border px-3 py-2 text-[12px] leading-relaxed",
                          run.status === "ok"
                            ? "border-[#24344F] bg-[#0B1628] text-neutral-300"
                            : "border-[#d08700]/30 bg-[#d08700]/[0.06] text-[#e8d9b8]",
                        )}
                      >
                        {run.detail}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0A1322] border-[#1C3050] text-[#F5F5F3]">
          <DialogHeader>
            <DialogTitle className="text-white">New automation</DialogTitle>
            <DialogDescription className="text-[#A1A1A1]">
              A real rule on real events. It runs the moment its trigger happens, and every
              execution lands in the run log.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]" htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                value={draft.name}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Follow up after every call"
                className="rounded-[2px] border-[#1C3050] bg-[#0A1424] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Trigger: when it fires</Label>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, trigger: t.value })}
                    className={cn(
                      "rounded-[2px] border px-3.5 py-2 font-mono-dy text-[11px] tracking-[0.08em] transition-colors",
                      draft.trigger === t.value
                        ? "border-[#2E7CDE] bg-[#2E7CDE]/10 text-[#9FC6E8]"
                        : "border-[#1C3050] text-neutral-500 hover:border-neutral-500",
                    )}
                  >
                    {t.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Action: what it does</Label>
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, action: a.value })}
                    className={cn(
                      "rounded-[2px] border px-3.5 py-2 font-mono-dy text-[11px] tracking-[0.08em] transition-colors",
                      draft.action === a.value
                        ? "border-[#2E7CDE] bg-[#2E7CDE]/10 text-[#9FC6E8]"
                        : "border-[#1C3050] text-neutral-500 hover:border-neutral-500",
                    )}
                  >
                    {a.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="rounded-[2px] border-[#1C3050] text-[#A1A1A1]"
            >
              Cancel
            </Button>
            <Button
              onClick={createRule}
              disabled={pending || !draft.name.trim()}
              className="rounded-[2px] bg-[#4A90E2] text-white hover:bg-[#2E7CDE]"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activate rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Integrations ---------------- */

type IntegrationDTO = { type: string; label: string; category: string; state: string; detail: string };

export function IntegrationsView() {
  const { toast } = useToast();
  const [items, setItems] = useState<IntegrationDTO[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/integrations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.integrations ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function requestSetup(item: IntegrationDTO) {
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, action: "request_setup" }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "Setup requested.", description: "The integration now shows needs attention until credentials are configured." });
      load();
    } else {
      toast({ title: data.error ?? "Request failed." });
    }
  }

  return (
    <div>
      <AppPageHead
        title="Integrations"
        intro="Every integration states what it does and the exact state it is in: Connected, Needs attention, or Not connected. Request setup and the owner provisions it."
      />
      {items === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((i) => (
            <div key={i.type} className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{i.label}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mt-0.5">{i.category}</p>
                </div>
                <StatusPill state={i.state} />
              </div>
              <p className="mt-3 text-xs text-[#A1A1A1] leading-relaxed">{i.detail}</p>
              {i.state === "not_connected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 border-[#1C3050] text-white hover:bg-[#0B1628] rounded-[2px] h-8"
                  onClick={() => requestSetup(i)}
                >
                  <Plug className="mr-1.5 h-3.5 w-3.5" /> Request setup
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Analytics ---------------- */

export function AnalyticsView() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d.overview ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
      </div>
    );
  }

  const empty = !data || (data.conversations === 0 && data.usageEvents <= 2);

  return (
    <div>
      <AppPageHead
        title="Analytics"
        intro="Metrics computed from real usage events only. If there is not enough data yet, that is what you will see."
      />
      {empty ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          body="Analytics populate as your AI employees handle real conversations. Deploy an employee, hold a conversation, and this page begins computing from stored events."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Conversations" value={data.conversations} detail="Total stored" />
            <StatCard label="AI messages" value={data.messages} detail="Real generated replies" />
            <StatCard label="Usage events" value={data.usageEvents} detail="Append-only ledger" />
            <StatCard
              label="Last activity"
              value={data.lastActivityAt ? new Date(data.lastActivityAt).toLocaleDateString() : "none"}
              detail="Most recent AI reply"
            />
          </div>
          <div className="mt-4 rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
            <p className="text-sm font-semibold text-white">Events per day, last 14 days</p>
            <div className="mt-6 flex items-end gap-1.5 h-24">
              {data.eventsByDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5" title={`${d.day}: ${d.count}`}>
                  <div
                    className="w-full bg-[#4A90E2] rounded-t-[2px] min-h-[2px]"
                    style={{ height: `${Math.max(2, (d.count / Math.max(1, Math.max(...data.eventsByDay.map((x) => x.count)))) * 96)}px` }}
                  />
                  <span className="text-[9px] text-[#6b6b6b]">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

export function SettingsView() {
  const { user } = useSession();
  return (
    <div>
      <AppPageHead
        title="Settings"
        intro="Organization, members, security, retention, and billing. Defaults favor privacy and explicit review." />
      <div className="space-y-4 max-w-2xl">
        <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">Organization</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-[#0c1526] pb-2">
              <span className="text-[#A1A1A1]">Name</span>
              <span className="text-white font-semibold">{user?.organizationName}</span>
            </div>
            <div className="flex justify-between border-b border-[#0c1526] pb-2">
              <span className="text-[#A1A1A1]">Type</span>
              <span className="text-white capitalize">{user?.organizationType}</span>
            </div>
            <div className="flex justify-between border-b border-[#0c1526] pb-2">
              <span className="text-[#A1A1A1]">Your role</span>
              <span className="text-white capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1A1]">Account</span>
              <span className="text-white">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">Members and roles</p>
          <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed">
            Roles: owner manages billing and the organization, admin manages members and deploys
            employees, operators take over conversations, viewers read only. Member invitations
            ship with team email delivery in Phase 1.
          </p>
        </div>

        <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">Data retention</p>
          <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed">
            Conversations and transcripts: retained while the organization is active. Recordings:
            none exist because voice sessions have not started. Deletion requests execute across
            records, and export gives you your data in documented formats. Retention policy
            controls arrive with billing in Phase 1.
          </p>
        </div>

        <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1A1]">Billing</p>
          <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed">
            This organization is on the free tier. Usage is metered transparently in the usage
            ledger: employee events, conversations, and AI messages. No card is on file and none
            is required.
          </p>
        </div>
      </div>
    </div>
  );
}
