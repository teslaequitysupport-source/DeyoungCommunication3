"use client";

import { useEffect, useState, useCallback } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSession } from "@/lib/session";
import { AppPageHead, EmptyState, StatusPill } from "./shell";
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
import { ROLE_TEMPLATES, CHANNELS, type AiEmployeeDTO, type VoiceCloneDTO, type ScriptRuleDTO } from "@/lib/types";
import { UserRound, Plus, Loader2, Trash2, Rocket, MessageSquare, AudioLines, ScrollText, PlayCircle, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSegments } from "@/lib/emotion";
import { speakSegments, resolveProfileVoice } from "@/lib/voice-engine";

function newRuleId() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const emptyRule = (): ScriptRuleDTO => ({
  id: newRuleId(),
  match: "",
  matchType: "contains",
  response: "",
  priority: 0,
  enabled: true,
});

export function EmployeesView() {
  const { navigate } = useDyRouter();
  const { user } = useSession();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<AiEmployeeDTO[] | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<AiEmployeeDTO | null>(null);

  const load = useCallback(() => {
    fetch("/api/employees", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees ?? []))
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deploy(e: AiEmployeeDTO) {
    const res = await fetch(`/api/employees/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.status === "deployed" ? "paused" : "deployed" }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({
        title: data.status === "deployed" ? `${e.name} is deployed.` : `${e.name} is paused.`,
        description:
          data.status === "deployed"
            ? "It can now hold conversations on its connected channels."
            : "Live conversations will not route to it.",
      });
      load();
    } else {
      toast({ title: data.error ?? "Update failed." });
    }
  }

  async function remove(e: AiEmployeeDTO) {
    const res = await fetch(`/api/employees/${e.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `${e.name} was deleted.` });
      load();
    } else {
      toast({ title: data.error ?? "Delete failed." });
    }
  }

  const canManage = user?.role === "owner" || user?.role === "admin";

  return (
    <div>
      <AppPageHead
        title="AI Employees"
        intro="Configure staff, not chatbots. Every employee carries a role, instructions, escalation rules, and channel scopes. Drafts never touch live conversations."
        actions={
          <Button
            className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
            onClick={() => {
              setEditing(null);
              setBuilderOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New AI employee
          </Button>
        }
      />

      {employees === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 text-[#E10600] animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No AI employees yet"
          body="Create your first AI employee from a role template. You will configure its instructions, personality, and escalation rules, then deploy it to start conversations."
          action={
            <Button
              className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
              onClick={() => setBuilderOpen(true)}
            >
              Create your first AI employee
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {employees.map((e) => {
            const template = ROLE_TEMPLATES.find((t) => t.key === e.role);
            return (
              <div key={e.id} className="rounded-[2px] border border-[#262626] bg-[#111111] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white text-lg">{e.name}</p>
                    <p className="text-xs text-[#A1A1A1] mt-0.5">
                      {template?.label ?? e.role} · v{e.configVersion}
                    </p>
                  </div>
                  <StatusPill state={e.status} />
                </div>
                <p className="mt-3 text-sm text-[#A1A1A1] leading-relaxed line-clamp-2">
                  {e.purpose || "No purpose set yet."}
                </p>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {e.channels.map((c) => {
                    const ch = CHANNELS.find((x) => x.key === c);
                    return (
                      <span
                        key={c}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#262626] rounded-[2px] text-[#A1A1A1]"
                      >
                        {ch?.label ?? c}
                      </span>
                    );
                  })}
                  {(e.scriptRules ?? []).filter((r) => r.enabled).length > 0 && (
                    <span className="chip-gold">
                      {e.scriptRules.filter((r) => r.enabled).length} SCRIPT RULE{e.scriptRules.filter((r) => r.enabled).length === 1 ? "" : "S"}
                    </span>
                  )}
                  {e.voiceProfile?.name ? (
                    <span className="chip-gold">
                      <AudioLines className="mr-1 h-3 w-3" />
                      {e.voiceProfile.name} VOICE
                    </span>
                  ) : null}
                  <span className="text-[10px] text-[#6b6b6b] ml-auto">
                    {e.conversationCount ?? 0} conversation{(e.conversationCount ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-5 flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#262626] text-white hover:bg-[#161616] rounded-[2px] h-8"
                    onClick={() => {
                      setEditing(e);
                      setBuilderOpen(true);
                    }}
                  >
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-[2px] h-8",
                      e.status === "deployed"
                        ? "bg-[#161616] hover:bg-[#222] text-white border border-[#262626]"
                        : "bg-[#E10600] hover:bg-[#B80500] text-white",
                    )}
                    onClick={() => deploy(e)}
                  >
                    <Rocket className="mr-1.5 h-3.5 w-3.5" />
                    {e.status === "deployed" ? "Pause" : e.status === "paused" ? "Redeploy" : "Deploy"}
                  </Button>
                  {e.status === "deployed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#262626] text-white hover:bg-[#161616] rounded-[2px] h-8"
                      onClick={() => navigate(ROUTES.appInbox)}
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Test conversation
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#A1A1A1] hover:text-[#E10600] hover:bg-transparent h-8 ml-auto"
                      onClick={() => remove(e)}
                      aria-label={`Delete ${e.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmployeeBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaved={() => {
          setBuilderOpen(false);
          load();
        }}
        editing={editing}
      />
    </div>
  );
}

function EmployeeBuilder({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: AiEmployeeDTO | null;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    role: "ai_receptionist",
    purpose: "",
    personality: "professional",
    tone: "warm-professional",
    instructions: "",
    escalationRule: "request_human_on_low_confidence",
    channels: ["web_chat"] as string[],
    language: "en",
  });
  const [rules, setRules] = useState<ScriptRuleDTO[]>([]);
  const [voiceProfile, setVoiceProfile] = useState<{ cloneId: string; name: string; voiceUri: string; pitch: number; rate: number } | null>(null);
  const [clones, setClones] = useState<VoiceCloneDTO[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/voice-clones", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setClones(d.clones ?? []))
        .catch(() => setClones([]));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          role: editing.role,
          purpose: editing.purpose,
          personality: editing.personality,
          tone: editing.tone,
          instructions: editing.instructions,
          escalationRule: editing.escalationRule,
          channels: editing.channels.length ? editing.channels : ["web_chat"],
          language: editing.language,
        });
        setRules(
          (editing.scriptRules ?? []).map((r) => ({ ...r, id: r.id || newRuleId() })),
        );
        const vp = editing.voiceProfile ?? {};
        setVoiceProfile(
          vp && (vp as { cloneId?: string }).cloneId
            ? {
                cloneId: String((vp as { cloneId?: string }).cloneId),
                name: String(vp.name ?? ""),
                voiceUri: String(vp.voiceUri ?? ""),
                pitch: Number(vp.pitch ?? 1),
                rate: Number(vp.rate ?? 1),
              }
            : null,
        );
      } else {
        setForm({
          name: "",
          role: "ai_receptionist",
          purpose: "",
          personality: "professional",
          tone: "warm-professional",
          instructions: "",
          escalationRule: "request_human_on_low_confidence",
          channels: ["web_chat"],
          language: "en",
        });
        setRules([]);
        setVoiceProfile(null);
      }
    }
  }, [open, editing]);

  const template = ROLE_TEMPLATES.find((t) => t.key === form.role);

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Give your AI employee a name." });
      return;
    }
    const cleanRules = rules
      .filter((r) => r.match.trim() && r.response.trim())
      .map((r, i) => ({ ...r, priority: i }));
    setPending(true);
    try {
      const payload = {
        ...form,
        scriptRules: cleanRules,
        voiceProfile: voiceProfile ?? { cloneId: "", name: "", voiceUri: "", pitch: 1, rate: 1 },
      };
      const res = await fetch(
        editing ? `/api/employees/${editing.id}` : "/api/employees",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (res.ok) {
        const ruleCount = cleanRules.filter((r) => r.enabled).length;
        toast({
          title: editing ? "Configuration saved." : `${form.name} was created.`,
          description: editing
            ? `Version ${data.configVersion} saved${ruleCount ? ` with ${ruleCount} script rule${ruleCount === 1 ? "" : "s"}` : ""}${voiceProfile ? ` and the ${voiceProfile.name} voice` : ""}.`
            : "Deploy it when the configuration is ready.",
        });
        onSaved();
      } else {
        toast({ title: data.error ?? "Save failed." });
      }
    } finally {
      setPending(false);
    }
  }

  const selectedClone = clones.find((c) => c.id === voiceProfile?.cloneId) ?? null;

  function assignClone(id: string | null) {
    if (!id) {
      setVoiceProfile(null);
      return;
    }
    const clone = clones.find((c) => c.id === id);
    if (!clone) return;
    setVoiceProfile({
      cloneId: clone.id,
      name: clone.name,
      voiceUri: clone.profile?.matchedVoiceUri ?? "",
      pitch: clone.profile?.pitchMultiplier ?? 1,
      rate: clone.profile?.rateMultiplier ?? 1,
    });
  }

  function previewVoice() {
    if (!voiceProfile) return;
    const segments = parseSegments(
      "Hello, this is " + form.name + " [warm] speaking. I answer exactly the way my operator tells me to.",
    );
    speakSegments(segments, {
      voice: resolveProfileVoice(voiceProfile),
      pitchBias: voiceProfile.pitch,
      rateBias: voiceProfile.rate,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D0D0D] border-[#262626] text-[#F5F5F3] max-w-2xl max-h-[85vh] overflow-y-auto dy-scroll">
        <DialogHeader>
          <DialogTitle className="text-white font-display text-xl">
            {editing ? `Configure ${editing.name}` : "Hire a new AI employee"}
          </DialogTitle>
          <DialogDescription className="text-[#A1A1A1]">
            {editing
              ? "Changes save as a new configuration version. Deployed employees keep the running version until redeployed."
              : "Start from a role template, then brief it like a new team member."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e-name" className="text-[#A1A1A1]">Name</Label>
              <Input
                id="e-name"
                placeholder="Ada"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#111111] border-[#262626] text-white placeholder:text-[#6b6b6b] rounded-[2px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Role template</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    role: v,
                    purpose: template?.purpose === form.purpose || !form.purpose ? ROLE_TEMPLATES.find((t) => t.key === v)!.purpose : form.purpose,
                    instructions:
                      !form.instructions || ROLE_TEMPLATES.some((t) => t.instructions === form.instructions)
                        ? ROLE_TEMPLATES.find((t) => t.key === v)!.instructions
                        : form.instructions,
                  })
                }
              >
                <SelectTrigger className="bg-[#111111] border-[#262626] text-white rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626] text-white max-h-64">
                  {ROLE_TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#6b6b6b]">{template?.blurb}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-purpose" className="text-[#A1A1A1]">Purpose</Label>
            <Textarea
              id="e-purpose"
              rows={2}
              placeholder="What this employee is hired to do."
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="bg-[#111111] border-[#262626] text-white placeholder:text-[#6b6b6b] rounded-[2px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Personality</Label>
              <Select value={form.personality} onValueChange={(v) => setForm({ ...form, personality: v })}>
                <SelectTrigger className="bg-[#111111] border-[#262626] text-white rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626] text-white">
                  {["professional", "warm", "direct", "calm", "energetic"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#A1A1A1]">Tone</Label>
              <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                <SelectTrigger className="bg-[#111111] border-[#262626] text-white rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626] text-white">
                  {["warm-professional", "plain-spoken", "formal", "friendly-casual"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-instructions" className="text-[#A1A1A1]">Business instructions (it must obey)</Label>
            <Textarea
              id="e-instructions"
              rows={5}
              placeholder="How to greet, what to never say, how to handle pricing questions, when to escalate."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="bg-[#111111] border-[#262626] text-white placeholder:text-[#6b6b6b] rounded-[2px]"
            />
            <p className="text-[11px] text-[#6b6b6b]">
              These are orders, not suggestions. The employee obeys them exactly, above its default
              behavior. It stays honest only about one thing: saying it is an AI when directly asked.
            </p>
          </div>

          {/* Operator script rules: verbatim obedience */}
          <div className="space-y-2 rounded-[3px] border border-[#3a2f14] bg-[#151109] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-[#E9B44C]" />
                <p className="text-sm font-semibold text-white">Script rules</p>
                <span className="chip-gold">VERBATIM OBEDIENCE</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setRules((rs) => [...rs, emptyRule()])}
                className="h-8 rounded-[2px] bg-[#E9B44C] px-3 text-[12px] font-bold text-[#151109] hover:bg-[#f5cd6e]"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add rule
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-[#a89b74]">
              When the caller&apos;s words match the WHEN side, the employee replies with the SAY side,
              word for word, before any AI thinking. Rules are checked top to bottom.
            </p>
            {rules.length > 0 && (
              <div className="space-y-2">
                {rules.map((r, i) => (
                  <div key={r.id} className="rounded-[2px] border border-[#2a2312] bg-[#0D0B06] p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-dy text-[9.5px] tracking-[0.14em] text-[#6f6f6a]">
                        RULE {String(i + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))
                        }
                        className={cn(
                          "rounded-[2px] border px-2 py-0.5 font-mono-dy text-[9.5px] tracking-[0.12em] transition-colors",
                          r.enabled
                            ? "border-[#E9B44C]/50 bg-[#E9B44C]/10 text-[#E9B44C]"
                            : "border-[#262626] text-[#6f6f6a]",
                        )}
                        aria-pressed={r.enabled}
                      >
                        {r.enabled ? "ON" : "OFF"}
                      </button>
                      <span className="ml-auto font-mono-dy text-[9px] tracking-[0.1em] text-[#6f6f6a]">
                        {r.matchType === "exact" ? "EXACT PHRASE" : "CONTAINS"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRules((rs) =>
                            rs.map((x) =>
                              x.id === r.id ? { ...x, matchType: x.matchType === "contains" ? "exact" : "contains" } : x,
                            ),
                          )
                        }
                        className="font-mono-dy text-[9px] tracking-[0.1em] text-[#E9B44C] underline-offset-2 hover:underline"
                      >
                        SWITCH
                      </button>
                      <button
                        type="button"
                        onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))}
                        aria-label="Delete rule"
                        className="text-[#6f6f6a] transition-colors hover:text-[#E10600]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="font-mono-dy text-[9px] tracking-[0.16em] text-[#a89b74]">
                          WHEN THE CALLER {r.matchType === "exact" ? "SAYS EXACTLY" : "MENTIONS"}
                        </p>
                        <Input
                          value={r.match}
                          onChange={(e) =>
                            setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, match: e.target.value } : x)))
                          }
                          maxLength={300}
                          placeholder="your price"
                          className="h-9 rounded-[2px] border-[#2a2312] bg-[#111111] text-[13px] text-white placeholder:text-[#6b6b6b]"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono-dy text-[9px] tracking-[0.16em] text-[#a89b74]">IT SAYS, VERBATIM</p>
                        <Input
                          value={r.response}
                          onChange={(e) =>
                            setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, response: e.target.value } : x)))
                          }
                          maxLength={2000}
                          placeholder="Our standard session is 80 dollars, no deposit."
                          className="h-9 rounded-[2px] border-[#2a2312] bg-[#111111] text-[13px] text-white placeholder:text-[#6b6b6b]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice: assign a cloned voice */}
          <div className="space-y-2 rounded-[3px] border border-[#262626] bg-[#111111] p-4">
            <div className="flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-[#A1A1A1]" />
              <p className="text-sm font-semibold text-white">Voice</p>
              {selectedClone && (
                <span className="chip-gold">{selectedClone.name} · MEASURED {Math.round(selectedClone.profile?.medianPitchHz ?? 0)}HZ</span>
              )}
            </div>
            {clones.length === 0 ? (
              <p className="text-[11px] leading-relaxed text-[#6b6b6b]">
                No cloned voices yet. Record one in Voice Studio (Clone Lab): your samples are measured
                in your browser and never uploaded. Until then, this employee uses the engine default
                voice.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => assignClone(null)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[2px] border px-4 py-2.5 text-left transition-colors ease-mechanical",
                      !voiceProfile
                        ? "border-[#E10600]/60 bg-[#E10600]/[0.07]"
                        : "border-[#262626] bg-[#0D0D0D] hover:border-[#333]",
                    )}
                  >
                    <span className="text-[13px] font-medium text-white">Engine default voice</span>
                    {!voiceProfile && <BadgeCheck className="h-4 w-4 text-[#E10600]" />}
                  </button>
                  {clones.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => assignClone(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[2px] border px-4 py-2.5 text-left transition-colors ease-mechanical",
                        voiceProfile?.cloneId === c.id
                          ? "border-[#E9B44C]/60 bg-[#E9B44C]/[0.07]"
                          : "border-[#262626] bg-[#0D0D0D] hover:border-[#333]",
                      )}
                    >
                      <span>
                        <span className="block text-[13px] font-medium text-white">{c.name}</span>
                        <span className="block font-mono-dy text-[9.5px] tracking-[0.1em] text-[#6f6f6a]">
                          {c.sampleCount} SAMPLE{(c.sampleCount ?? 0) === 1 ? "" : "S"} · {Math.round((c.totalMs ?? 0) / 1000)}S ·{" "}
                          {c.profile?.register?.toUpperCase() ?? ""} REGISTER · CONSENT {c.consentName}
                        </span>
                      </span>
                      {voiceProfile?.cloneId === c.id && (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              previewVoice();
                            }}
                            className="flex items-center gap-1 font-mono-dy text-[9.5px] tracking-[0.1em] text-[#E9B44C] hover:text-[#f5cd6e]"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> PREVIEW
                          </button>
                          <BadgeCheck className="h-4 w-4 text-[#E9B44C]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {voiceProfile && (
                  <p className="text-[11px] leading-relaxed text-[#6b6b6b]">
                    Timbre Match engine: the measured pitch and pace of {selectedClone?.name ?? "the cloned voice"}
                    drive this employee&apos;s speech in live calls. Hear it before saving with PREVIEW.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#A1A1A1]">Escalation rule</Label>
            <Select value={form.escalationRule} onValueChange={(v) => setForm({ ...form, escalationRule: v })}>
              <SelectTrigger className="bg-[#111111] border-[#262626] text-white rounded-[2px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#262626] text-white">
                <SelectItem value="request_human_on_low_confidence">Request a human when unsure</SelectItem>
                <SelectItem value="escalate_on_negative_sentiment">Escalate on negative sentiment</SelectItem>
                <SelectItem value="escalate_on_keywords">Escalate on specific topics (set in instructions)</SelectItem>
                <SelectItem value="never_escalate">Handle everything, never escalate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#A1A1A1]">Channels</Label>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((c) => {
                const selected = form.channels.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        channels: selected
                          ? form.channels.filter((k) => k !== c.key)
                          : [...form.channels, c.key],
                      })
                    }
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium border rounded-[2px] transition-colors ease-mechanical",
                      selected
                        ? "border-[#E10600] bg-[#E10600]/10 text-white"
                        : "border-[#262626] text-[#A1A1A1] hover:text-white",
                    )}
                    aria-pressed={selected}
                  >
                    {c.label}
                    {c.state === "coming_soon" && <span className="ml-1.5 text-[9px] text-[#6b6b6b]">SOON</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#6b6b6b]">
              Only web chat carries conversations today. Other channels activate after their real
              configuration in Integrations.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#262626] text-[#A1A1A1] hover:text-white rounded-[2px]"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={pending}
            className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save new version" : "Create employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
