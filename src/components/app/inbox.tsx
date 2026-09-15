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
import { Inbox, Loader2, Send, X, UserRound, Hand, CircleStop } from "lucide-react";
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
            className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
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
          <Loader2 className="h-6 w-6 text-[#E10600] animate-spin" />
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
                className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
                onClick={() => setStartOpen(true)}
              >
                Start a conversation
              </Button>
            ) : (
              <Button
                className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]"
                onClick={() => navigate(ROUTES.appEmployees)}
              >
                Go to AI Employees
              </Button>
            )
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="rounded-[2px] border border-[#262626] bg-[#111111] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Conversations</p>
              <span className="text-xs text-[#6b6b6b]">{conversations.length}</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto dy-scroll divide-y divide-[#262626]">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 transition-colors ease-mechanical",
                    selected === c.id ? "bg-[#161616]" : "hover:bg-[#0D0D0D]",
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
            <div className="rounded-[2px] border border-dashed border-[#262626] bg-[#0D0D0D] flex flex-col items-center justify-center py-20 px-6 text-center">
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
      <DialogContent className="bg-[#0D0D0D] border-[#262626] text-[#F5F5F3]">
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
              <SelectTrigger className="bg-[#111111] border-[#262626] text-white rounded-[2px]">
                <SelectValue placeholder="Choose a deployed employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#262626] text-white">
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
              className="bg-[#111111] border-[#262626] text-white rounded-[2px]"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="border-[#262626] text-[#A1A1A1] rounded-[2px]">
            Cancel
          </Button>
          <Button onClick={start} disabled={pending || !employeeId} className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px]">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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

  return (
    <div className="rounded-[2px] border border-[#262626] bg-[#111111] flex flex-col overflow-hidden">
      {/* Room header */}
      <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center shrink-0">
          <UserRound className="h-4 w-4 text-[#A1A1A1]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {messages?.[0]?.content?.includes("with AI employee")
              ? messages[0].content.split("with AI employee ")[1]?.replace(/\.$/, "")
              : employee ?? "AI employee"}
          </p>
          <p className="text-[11px] text-[#A1A1A1]">web chat · {status}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`dy-status ${takingOver ? "dy-status-attention" : "dy-status-live"}`}>
            <span className="dy-status-dot" />
            {takingOver ? "HUMAN HANDLING" : "AI HANDLING"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-[#262626] text-white hover:bg-[#161616] rounded-[2px]"
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
            className="h-8 border-[#262626] text-[#A1A1A1] hover:text-white hover:bg-[#161616] rounded-[2px]"
            onClick={closeConversation}
            aria-label="Close conversation"
          >
            <CircleStop className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto dy-scroll px-4 py-4 space-y-3 max-h-[400px] min-h-[300px]">
        {messages === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 text-[#E10600] animate-spin" />
          </div>
        ) : (
          messages.map((m) => {
            if (m.role === "system") {
              return (
                <p key={m.id} className="text-center text-[11px] text-[#6b6b6b] py-1 font-mono">
                  {m.content}
                </p>
              );
            }
            const isAi = m.role === "ai";
            const isHuman = m.role === "human";
            return (
              <div key={m.id} className={cn("flex", isAi ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-[2px] px-3.5 py-2.5 border",
                    isAi
                      ? "border-l-2 border-l-[#E10600] border-[#262626] bg-[#0D0D0D]"
                      : isHuman
                        ? "border-[#d08700]/50 bg-[#1a1408] border-l-2 border-l-[#d08700]"
                        : "border-[#262626] bg-[#161616]",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A1A1A1]">
                    {m.speakerName ?? (isAi ? "AI" : "Customer")}
                  </p>
                  <p className="mt-1 text-sm text-white/95 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <p className="mt-1.5 text-[10px] text-[#6b6b6b]">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-[2px] border border-l-2 border-l-[#E10600] border-[#262626] bg-[#0D0D0D] px-3.5 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#E10600]">
                {takingOver ? "Sending" : "AI is replying"}
              </p>
              <p className="mt-1 text-sm text-[#A1A1A1]">
                {takingOver ? "Sending your message..." : "The model is generating a real reply..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-[#262626] flex gap-2">
        <Input
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
              ? "Reply as the human agent..."
              : "Type as the customer to test the AI employee..."
          }
          disabled={status !== "open"}
          className="bg-[#0D0D0D] border-[#262626] text-white placeholder:text-[#6b6b6b] rounded-[2px] h-10"
          aria-label="Message"
        />
        <Button
          onClick={() => send(takingOver ? "human" : "customer")}
          disabled={sending || !input.trim() || status !== "open"}
          className="bg-[#E10600] hover:bg-[#B80500] text-white rounded-[2px] h-10 px-4"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
