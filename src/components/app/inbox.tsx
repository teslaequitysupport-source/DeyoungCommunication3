"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { AppPageHead, EmptyState, StatusPill } from "./shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { AiEmployeeDTO, ConversationDTO, MessageDTO } from "@/lib/types";
import { Inbox, Loader2, Send, X, Hand, CircleStop } from "lucide-react";
import { cn } from "@/lib/utils";

export function InboxView() {
  const { navigate } = useDyRouter();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationDTO[] | null>(null);
  const [employees, setEmployees] = useState<AiEmployeeDTO[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/conversations", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/employees", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([convData, empData]) => {
        setConversations(convData.conversations ?? []);
        setEmployees(empData.employees ?? []);
      })
      .catch(() => {
        setConversations([]);
        setEmployees([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deployed = employees.filter((e) => e.status === "deployed");

  return (
    <div>
      <AppPageHead
        title="Inbox"
        intro="Every conversation across your channels, with full transcripts and handoff controls. Channel badges reflect real connection states."
        actions={
          <Button
            className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
            onClick={() => setStartOpen(true)}
            disabled={deployed.length === 0}
            title={deployed.length === 0 ? "Deploy an AI employee first" : undefined}
          >
            Start test conversation
          </Button>
        }
      />

      {conversations === null ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 text-[#4A90E2] animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          body={
            deployed.length === 0
              ? "No conversations, and no deployed AI employees to hold them. Deploy an employee, then start a test conversation to see the platform work."
              : "No conversations yet. Start a test conversation on web chat to watch your AI employee work in real conditions."
          }
          action={
            deployed.length > 0 ? (
              <Button
                className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
                onClick={() => setStartOpen(true)}
              >
                Start a conversation
              </Button>
            ) : (
              <Button
                className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]"
                onClick={() => navigate(ROUTES.appEmployees)}
              >
                Go to AI Employees
              </Button>
            )
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="rounded-[2px] border border-[#1C3050] bg-[#0A1424] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1C3050] flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Conversations</p>
              <span className="text-xs text-[#6b6b6b]">{conversations.length}</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto dy-scroll divide-y divide-[#1C3050]">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 transition-colors ease-mechanical",
                    selected === c.id ? "bg-[#0B1628]" : "hover:bg-[#0A1322]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {c.customerName ?? "Visitor"}
                    </p>
                    <StatusPill state={c.channel === "web_chat" ? "connected" : "not_connected"} />
                  </div>
                  <p className="mt-1 text-xs text-[#A1A1A1] truncate">
                    {c.employeeName ? `${c.employeeName} · ` : ""}
                    {c.lastPreview ?? "No messages yet"}
                  </p>
                  <p className="mt-1.5 text-[10px] text-[#6b6b6b]">
                    {new Date(c.lastMessageAt).toLocaleString()} · {c.messageCount ?? 0} messages · web chat
                  </p>
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <ConversationRoom
              conversationId={selected}
              onClosed={() => {
                setSelected(null);
                load();
              }}
            />
          ) : (
            <div className="rounded-[2px] border border-dashed border-[#1C3050] bg-[#0A1322] flex flex-col items-center justify-center py-20 px-6 text-center">
              <Inbox className="h-6 w-6 text-[#A1A1A1]" />
              <p className="mt-4 text-sm font-semibold text-white">Select a conversation</p>
              <p className="mt-1 text-xs text-[#A1A1A1] max-w-xs">
                The room shows the full transcript, AI actions, and handoff controls.
              </p>
            </div>
          )}
        </div>
      )}

      <StartConversationDialog
        open={startOpen}
        employees={deployed}
        onClose={() => setStartOpen(false)}
        onStarted={(id) => {
          setStartOpen(false);
          setSelected(id);
          load();
          toast({ title: "Conversation started.", description: "Say something as the customer to see the AI reply." });
        }}
      />
    </div>
  );
}

function StartConversationDialog({
  open,
  employees,
  onClose,
  onStarted,
}: {
  open: boolean;
  employees: AiEmployeeDTO[];
  onClose: () => void;
  onStarted: (id: string) => void;
}) {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("Website visitor");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (employees.length && !employees.some((e) => e.id === employeeId)) {
      setEmployeeId(employees[0].id);
    }
  }, [employees, employeeId]);

  async function start() {
    if (!employeeId) return;
    setPending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, customerName }),
      });
      const data = await res.json();
      if (res.ok) onStarted(data.id);
      else toast({ title: data.error ?? "Could not start." });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A1322] border-[#1C3050] text-[#F5F5F3]">
        <DialogHeader>
          <DialogTitle className="text-white">Start a test conversation</DialogTitle>
          <DialogDescription className="text-[#A1A1A1]">
            Web chat is the native channel, so this conversation is real: a stored transcript, a
            real model reply, and usage events.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[#A1A1A1]">AI employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="bg-[#0A1424] border-[#1C3050] text-white rounded-[2px]">
                <SelectValue placeholder="Choose a deployed employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1424] border-[#1C3050] text-white">
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cust-name" className="text-[#A1A1A1]">Customer name (for the profile)</Label>
            <Input
              id="cust-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-[#0A1424] border-[#1C3050] text-white rounded-[2px]"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="border-[#1C3050] text-[#A1A1A1] rounded-[2px]">
            Cancel
          </Button>
          <Button onClick={start} disabled={pending || !employeeId} className="bg-[#4A90E2] hover:bg-[#2E7CDE] text-white rounded-[2px]">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ---------------- Messenger-grade primitives ---------------- */

function TypingDots() {
  return (
    <span className="flex items-end gap-1 px-0.5 pb-0.5" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-[#6fcbff]"
          style={{ animation: `dy-dot 1.2s ${i * 0.18}s ease-in-out infinite` }}
        />
      ))}
    </span>
  );
}

function DeliveredTicks() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-label="delivered" className="ml-0.5">
      <path d="M1 5.5L4 8.5L9 1.5" stroke="#7FB9EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5.5L8.5 8.5L13.5 1.5" stroke="#7FB9EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ---------------- Room ---------------- */

function ConversationRoom({
  conversationId,
  onClosed,
}: {
  conversationId: string;
  onClosed: () => void;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageDTO[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [status, setStatus] = useState<string>("open");
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) {
          setMessages(d.messages ?? []);
          setStatus(d.conversation?.status ?? "open");
        }
      })
      .catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(role: "customer" | "human") {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    // optimistic customer message
    setMessages((m) =>
      m
        ? [
            ...m,
            {
              id: `local-${Date.now()}`,
              role,
              content,
              speakerName: role === "human" ? "You" : "Customer",
              createdAt: new Date().toISOString(),
            },
          ]
        : m,
    );
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Message failed." });
        return;
      }
      await load();
      if (data.systemMessage) {
        toast({ title: "AI service did not respond.", description: "Your message was saved. Retry or take over." });
      }
    } finally {
      setSending(false);
    }
  }

  async function closeConversation() {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (res.ok) {
      toast({ title: "Conversation closed." });
      onClosed();
    }
  }

  const employee = messages?.find((m) => m.role === "ai")?.speakerName;
  const roomName = messages?.[0]?.content?.includes("with AI employee")
    ? messages[0].content.split("with AI employee ")[1]?.replace(/\.$/, "")
    : employee ?? "AI employee";

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#1C3050] bg-[#0A1424] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      {/* Room header */}
      <div className="flex items-center gap-3 border-b border-[#1C3050] bg-[#0B1322]/80 px-4 py-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7CDE] to-[#1E5FB8] text-[12px] font-bold text-white shadow-[0_0_0_2px_rgba(74,144,226,0.25)]">
          {roomName.slice(0, 2).toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full border-2 border-[#0B1322] bg-[#2FD4FF]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2FD4FF] opacity-60 motion-reduce:hidden" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-white">{roomName}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-[#8FA6C0]">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${status === "open" ? "bg-[#2FD4FF]" : "bg-neutral-500"}`} />
            web chat · {status === "open" ? "online" : status}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`dy-status ${takingOver ? "dy-status-attention" : "dy-status-live"}`}>
            <span className="dy-status-dot" />
            {takingOver ? "HUMAN HANDLING" : "AI HANDLING"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-[#1C3050] text-white hover:bg-[#0B1628]"
            onClick={() => {
              setTakingOver(!takingOver);
              toast({
                title: takingOver ? "Returned to the AI." : "You have taken over.",
                description: takingOver
                  ? "The AI resumes with full context."
                  : "Messages you send now are attributed to you, not the AI.",
              });
            }}
          >
            <Hand className="mr-1.5 h-3.5 w-3.5" />
            {takingOver ? "Return to AI" : "Take over"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-[#1C3050] text-[#A1A1A1] hover:text-white hover:bg-[#0B1628]"
            onClick={closeConversation}
            aria-label="Close conversation"
          >
            <CircleStop className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Transcript: a real messenger surface */}
      <div
        ref={scrollRef}
        className="dy-scroll relative min-h-[340px] flex-1 space-y-1 overflow-y-auto px-4 py-4 max-h-[440px]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(46,124,222,0.08), transparent)",
        }}
      >
        <p className="pb-2 text-center font-mono-dy text-[9.5px] tracking-[0.14em] text-[#5d6b7d]">
          TODAY · WEB CHAT · EVERYTHING SAVED
        </p>
        {messages === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
          </div>
        ) : (
          messages.map((m, i) => {
            if (m.role === "system") {
              return (
                <p key={m.id} className="py-1.5 text-center text-[11px] text-[#6b6b6b]">
                  {m.content}
                </p>
              );
            }
            const isAi = m.role === "ai";
            const isHuman = m.role === "human";
            const next = messages[i + 1];
            const prev = messages[i - 1];
            const sameAsNext = !!(next && next.role === m.role);
            const sameAsPrev = !!(prev && prev.role === m.role);
            return (
              <div key={m.id} className={cn("flex items-end gap-2.5", isAi ? "justify-start" : "justify-end flex-row-reverse")}>
                {isAi && (
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7CDE] to-[#1E5FB8] text-[9px] font-bold text-white",
                      sameAsNext && "invisible",
                    )}
                  >
                    {roomName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div
                  className={cn(
                    "dy-msg-in max-w-[75%] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                    isAi
                      ? cn(
                          "rounded-[18px] rounded-bl-[6px] border border-[#2FD4FF]/15 bg-gradient-to-br from-[#1E5FB8]/45 to-[#2E7CDE]/25 text-[#F4FAFF] shadow-[0_10px_28px_-14px_rgba(10,91,196,0.65)]",
                          sameAsPrev && "mt-1",
                        )
                      : isHuman
                        ? cn(
                            "rounded-[18px] rounded-br-[6px] border border-[#d08700]/40 bg-[#1a1a10]/80 text-[#f2e9d8] shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)]",
                            sameAsPrev && "mt-1",
                          )
                        : cn(
                            "rounded-[18px] rounded-br-[6px] border border-[#24344F] bg-[#101B2E] text-neutral-200 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.8)]",
                            sameAsPrev && "mt-1",
                          ),
                  )}
                >
                  {isHuman && (
                    <p className="mb-0.5 font-mono-dy text-[8.5px] tracking-[0.16em] text-[#d08700]">
                      {(m.speakerName ?? "YOU").toUpperCase()} · HUMAN
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={cn("mt-1 flex items-center justify-end gap-1 font-mono-dy text-[8.5px] tracking-[0.08em]", isAi ? "text-[#9FC6E8]" : "text-[#5d6b7d]")}>
                    {msgTime(m.createdAt)}
                    {!isAi && <DeliveredTicks />}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {sending && (
          <div className="flex items-end gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7CDE] to-[#1E5FB8] text-[9px] font-bold text-white">
              {roomName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex items-center rounded-[18px] rounded-bl-[6px] border border-[#2FD4FF]/15 bg-gradient-to-br from-[#1E5FB8]/45 to-[#2E7CDE]/25 px-4 py-3.5">
              {takingOver ? (
                <span className="font-mono-dy text-[9.5px] tracking-[0.14em] text-[#9FC6E8]">SENDING…</span>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-[#1C3050] bg-[#0B1322]/80 p-3">
        <div className="flex h-10 flex-1 items-center rounded-full border border-[#24344F] bg-[#0E1B2E] pl-4 pr-1 transition-colors focus-within:border-[#4A90E2]/50">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(takingOver ? "human" : "customer");
              }
            }}
            placeholder={
              takingOver
                ? "Reply as the human agent…"
                : "Type as the customer to test the AI employee…"
            }
            disabled={status !== "open"}
            className="h-full w-full bg-transparent text-[13.5px] text-white placeholder:text-[#5d6b7d] focus:outline-none disabled:opacity-50"
            aria-label="Message"
          />
          <Button
            onClick={() => send(takingOver ? "human" : "customer")}
            disabled={sending || !input.trim() || status !== "open"}
            className="ml-2 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2E7CDE] p-0 text-white shadow-[0_6px_18px_-6px_rgba(10,91,196,0.8)] transition-all hover:shadow-[0_8px_22px_-6px_rgba(10,91,196,0.9)] disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
