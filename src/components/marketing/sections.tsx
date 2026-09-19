"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useDyRouter, ROUTES } from "@/lib/router";
import { IconOrb } from "@/components/brand/icon-orb";
import { useSite, usePublicStats } from "@/hooks/use-site";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  MessageSquare,
  Brain,
  BookOpen,
  Hand,
  Timer,
  ShieldCheck,
  Lock,
  FileCheck,
  Eye,
  ArrowRight,
  Mic,
  Waves,
  Workflow,
  Plug,
  Server,
  LayoutDashboard,
  RefreshCw,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Motion primitives ---------------- */

export function Reveal({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.7, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Section scaffolding ---------------- */

export function SectionHead({
  num,
  eyebrow,
  title,
  lead,
  dark = false,
  align = "left",
}: {
  num?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  dark?: boolean;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={cn(align === "center" && "text-center")}>
      <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
        {num && (
          <span className="font-mono-dy text-[11px] font-semibold tracking-[0.22em] text-brand">
            {num}
          </span>
        )}
        <span className={cn("eyebrow-dy", dark ? "text-neutral-500" : "text-neutral-500")}>
          {eyebrow}
        </span>
        <span className={cn("h-px w-10", dark ? "bg-white/15" : "bg-white/25")} aria-hidden="true" />
      </div>
      <h2
        className={cn(
          "font-display-strong mt-5 max-w-3xl text-[clamp(1.75rem,3.4vw,2.6rem)] leading-[1.06] text-balance-dy",
          align === "center" && "mx-auto",
          dark ? "text-white" : "text-white",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-4 max-w-2xl text-[15.5px] leading-relaxed text-pretty-dy",
            align === "center" && "mx-auto",
            dark ? "text-neutral-400" : "text-neutral-400",
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}

export function MarketingSection({
  id,
  num,
  eyebrow,
  title,
  lead,
  dark = false,
  className,
  children,
  tight = false,
}: {
  id?: string;
  num?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative",
        dark ? "bg-ink text-white grain-dy" : "border-t border-white/10 bg-ink-3",
        tight ? "py-14 md:py-20" : "py-20 md:py-28",
        className,
      )}
    >
      {dark && <div className="absolute inset-0 dy-grid-bg opacity-40" aria-hidden="true" />}
      <div className="container-dy relative">
        <SectionHead num={num} eyebrow={eyebrow} title={title} lead={lead} dark={dark} />
        <div className="mt-12 md:mt-16">{children}</div>
      </div>
    </section>
  );
}

/* ---------------- Industries showcase (photo led) ---------------- */

const INDUSTRIES = [
  { img: "/img/industry-clinic.jpg", title: "Clinics & practices", line: "Bookings, reminders, insurance questions: answered while the front desk works." },
  { img: "/img/industry-law.jpg", title: "Law firms", line: "Intake calls captured after hours. Nothing missed, nothing invented." },
  { img: "/img/industry-realestate.jpg", title: "Real estate", line: "Lead qualification and viewing bookings, around the clock." },
  { img: "/img/industry-ecommerce.jpg", title: "E-commerce", line: "Order status, returns, and sizing questions handled in seconds." },
];

export function IndustriesShowcase() {
  const { navigate } = useDyRouter();
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {INDUSTRIES.map((ind, i) => (
        <Reveal key={ind.title} delay={i * 0.07}>
          <button
            onClick={() => navigate(ROUTES.solutions)}
            className={cn("tilt-3d group block w-full text-left", i % 2 === 1 && "tilt-3d-alt")}
            aria-label={`Explore ${ind.title}`}
          >
            <div className="photo-frame aspect-[4/3]">
              <Image
                src={ind.img}
                alt={ind.title}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                className="object-cover"
              />
              <div className="photo-scrim" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-[16.5px] font-bold text-white">{ind.title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-neutral-300">{ind.line}</p>
              </div>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- Agent gallery (photo led) ---------------- */

const AGENTS = [
  {
    img: "/img/agent-reception.jpg",
    role: "Receptionist",
    line: "Greets, routes, books. Never a busy line.",
    chips: ["BOOKING", "ROUTING", "FAQ"],
  },
  {
    img: "/img/agent-sales.jpg",
    role: "Sales assistant",
    line: "Qualifies leads and captures intent, live.",
    chips: ["QUALIFYING", "NOTES", "FOLLOW-UP"],
  },
  {
    img: "/img/agent-support.jpg",
    role: "Support agent",
    line: "Order status and returns without the queue.",
    chips: ["TICKETS", "LOOKUP", "ESCALATION"],
  },
];

export function AgentGallery() {
  const { navigate } = useDyRouter();
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {AGENTS.map((a, i) => (
        <Reveal key={a.role} delay={i * 0.08}>
          <button
            onClick={() => navigate(ROUTES.productEmployees)}
            className={cn("tilt-3d group block w-full text-left", i % 2 === 1 && "tilt-3d-alt")}
            aria-label={`Explore the ${a.role} role`}
          >
            <div className="photo-frame aspect-[3/4]">
              <Image
                src={a.img}
                alt={`${a.role} AI employee`}
                fill
                sizes="(max-width:640px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="photo-scrim" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-center gap-2">
                  <span className="dy-status dy-status-live text-[10px]">
                    <span className="dy-status-dot" />
                    HIREABLE
                  </span>
                </div>
                <h3 className="font-display mt-2 text-[18px] font-bold text-white">{a.role}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-neutral-300">{a.line}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 font-mono-dy text-[9.5px] font-medium tracking-[0.14em] text-neutral-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- Provided panel: you bring nothing, we provide everything ---------------- */

const PROVIDED = [
  { icon: Brain, title: "The AI brain", body: "Reasoning, voice, and the emotion engine." },
  { icon: Phone, title: "Phone numbers", body: "Provisioned and connected for you." },
  { icon: Server, title: "Infrastructure", body: "Hosting, uptime, and scaling handled." },
  { icon: LayoutDashboard, title: "Dashboard & analytics", body: "Every call, transcript, and metric." },
  { icon: RefreshCw, title: "Updates", body: "New capabilities arrive automatically." },
  { icon: LifeBuoy, title: "Human support", body: "Real people when you need help." },
];

export function ProvidedPanel() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Reveal className="lg:col-span-4">
        <div className="dy-radial-gold relative flex h-full flex-col overflow-hidden rounded-[10px] border border-gold/25 p-7">
          <span className="eyebrow-dy text-gold">YOU BRING</span>
          <h3 className="font-display mt-4 text-[26px] font-bold tracking-[-0.02em] text-white">One thing.</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-300">
            Your business knowledge: prices, policies, FAQs. That is the entire list.
          </p>
          <div className="mt-auto pt-8">
            <div className="rounded-[8px] border border-white/10 bg-ink-2 p-4 font-mono-dy text-[10.5px] leading-relaxed tracking-[0.1em] text-neutral-500">
              THEY PAY YOU. YOU PROVIDE EVERYTHING. THAT IS THE DEAL.
            </div>
          </div>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-5 lg:col-span-8 md:grid-cols-3">
        {PROVIDED.map((p, i) => (
          <Reveal key={p.title} delay={0.06 + i * 0.05}>
            <div className="h-full rounded-[10px] border border-white/10 bg-ink-2 p-5 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-brand/40">
              <IconOrb icon={p.icon} size={38} />
              <h3 className="font-display mt-3.5 text-[14.5px] font-bold text-white">{p.title}</h3>
              <p className="mt-1.5 text-[12px] leading-snug text-neutral-400">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Photo band: full-bleed image with headline + CTA ---------------- */

export function PhotoBand({
  img = "/img/abstract-signal.jpg",
  eyebrow,
  title,
  note,
  ctaLabel,
  onCta,
}: {
  img?: string;
  eyebrow: string;
  title: string;
  note?: string;
  ctaLabel: string;
  onCta?: () => void;
}) {
  const { navigate } = useDyRouter();
  return (
    <section className="relative overflow-hidden border-y border-white/10">
      <Image
        src={img}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-50"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" aria-hidden="true" />
      <div className="container-dy relative py-20 md:py-28">
        <Reveal>
          <span className="eyebrow-dy text-gold">{eyebrow}</span>
          <h2 className="font-display-strong mt-5 max-w-2xl text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.05] text-balance-dy text-white">
            {title}
          </h2>
          {note && <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-neutral-300">{note}</p>}
          <div className="mt-7">
            <Button className="btn-flare h-12 px-8 text-[14.5px]" onClick={onCta ?? (() => navigate(ROUTES.signup))}>
              {ctaLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Bento feature grid ---------------- */

const FEATURES = [
  {
    icon: Phone,
    title: "Answers on the first ring",
    body: "Recognition, reasoning, and speech in one pipeline. Hold music is not in its vocabulary.",
    span: "lg:col-span-7",
    accent: true,
  },
  {
    icon: Hand,
    title: "Interrupts gracefully",
    body: "Speak mid-sentence and it stops, listens, and follows your new direction.",
    span: "lg:col-span-5",
  },
  {
    icon: Brain,
    title: "Uses your knowledge",
    body: "Prices and policies come from what you approved: never invention.",
    span: "lg:col-span-5",
  },
  {
    icon: MessageSquare,
    title: "One employee, every channel",
    body: "The same brain answers web chat, phone, SMS, and WhatsApp.",
    span: "lg:col-span-7",
    accent: true,
  },
];

export function FeatureGrid() {
  const { navigate } = useDyRouter();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {FEATURES.map((f, i) => (
        <Reveal key={f.title} delay={i * 0.07} className={cn("md:col-span-1", f.span)}>
          <button
            onClick={() => navigate(ROUTES.product)}
            className={cn(
              "group flex h-full w-full flex-col items-start rounded-[4px] border p-6 text-left transition-all duration-300 ease-mechanical md:p-8",
              f.accent
                ? "border-white/10 bg-ink-2 hover:border-brand/50 hover:shadow-[0_20px_48px_-16px_rgba(0,0,0,0.55)]"
                : "border-white/10 bg-ink-3 hover:border-brand/40 hover:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)]",
              "hover:-translate-y-0.5",
            )}
          >
            <IconOrb icon={f.icon} size={44} className="group-hover:-translate-y-0.5" />
            <span className="font-display mt-5 text-[19px] font-bold tracking-[-0.02em] text-white">
              {f.title}
            </span>
            <span className="mt-2.5 max-w-md text-[14px] leading-relaxed text-neutral-400">{f.body}</span>
            <span className="mt-5 inline-flex items-center gap-1.5 font-mono-dy text-[11px] font-medium tracking-[0.14em] text-neutral-400 transition-colors ease-mechanical group-hover:text-brand">
              EXPLORE
              <ArrowRight className="h-3 w-3 transition-transform ease-mechanical group-hover:translate-x-1" />
            </span>
          </button>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- Honest channel status ---------------- */

const CHANNEL_ROWS = [
  { name: "Web chat", state: "connected", detail: "Live in every workspace today" },
  { name: "Live voice (browser)", state: "connected", detail: "Real-time STT → LLM → TTS with barge-in" },
  { name: "WhatsApp click-to-chat", state: "connected", detail: "Working now: visitors reach you in one tap from the site" },
  { name: "Phone (PSTN)", state: "attention", detail: "Requires telephony provider activation: honestly not included in the free tier" },
  { name: "SMS", state: "attention", detail: "Production stack ready, provider activation required" },
  { name: "WhatsApp Business API", state: "attention", detail: "Connect your Business API credentials and we light it up" },
];

export function ChannelsHonest() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-white/10">
      <div className="hidden grid-cols-[1.1fr_0.7fr_2fr] border-b border-white/10 bg-ink-2 px-6 py-3 md:grid">
        <span className="eyebrow-dy text-neutral-500">Channel</span>
        <span className="eyebrow-dy text-neutral-500">Status</span>
        <span className="eyebrow-dy text-neutral-500">Where it really stands</span>
      </div>
      {CHANNEL_ROWS.map((c, i) => (
        <Reveal key={c.name} delay={i * 0.05}>
          <div className="grid grid-cols-1 gap-2 border-b border-white/10 px-6 py-4 transition-colors ease-mechanical last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[1.1fr_0.7fr_2fr] md:items-center md:gap-4">
            <span className="text-[14px] font-semibold text-white">{c.name}</span>
            <span
              className={cn(
                "dy-status",
                c.state === "connected" && "dy-status-connected text-[#2e7d4f]",
                c.state === "attention" && "dy-status-attention text-[#d08700]",
                c.state === "neutral" && "dy-status-neutral text-neutral-500",
              )}
            >
              <span className="dy-status-dot" />
              {c.state === "connected" ? "LIVE" : "SETUP REQUIRED"}
            </span>
            <span className="text-[13.5px] leading-snug text-neutral-400">{c.detail}</span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  { n: "01", title: "Describe the job", body: "Pick a role template and write its instructions in plain language." },
  { n: "02", title: "Feed it the truth", body: "Paste FAQs, policies, pricing. It answers only from what you approved." },
  { n: "03", title: "Take a test call", body: "Call it from your browser. Interrupt it, correct it, deploy." },
  { n: "04", title: "Put it on the line", body: "Web chat goes live instantly. We provision numbers when you are ready." },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <Reveal key={s.n} delay={i * 0.08} className="bg-ink-3">
          <div className="group h-full p-6 transition-colors ease-mechanical hover:bg-white/[0.04] md:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono-dy text-[26px] font-semibold tracking-tight text-neutral-200 transition-colors ease-mechanical group-hover:text-brand/60">
                {s.n}
              </span>
              <span className="h-px w-8 bg-white/10 transition-colors ease-mechanical group-hover:bg-brand/40" />
            </div>
            <h3 className="font-display mt-4 text-[17px] font-bold tracking-[-0.01em] text-white">{s.title}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-neutral-400">{s.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- Architecture strip (isometric CSS pipeline) ---------------- */

function FlowSlab({ icon: Icon, label, sub, latency, active }: { icon: typeof Mic; label: string; sub: string; latency: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col rounded-[4px] border border-white/10 bg-ink-3 p-5 transition-transform duration-500 ease-mechanical",
        "hover:-translate-y-1",
      )}
      style={{ transform: "perspective(900px) rotateX(6deg)" }}
    >
      <div className="flex items-center justify-between">
        <IconOrb icon={Icon} size={36} />
        <span className="font-mono-dy text-[10.5px] tracking-[0.14em] text-neutral-500">{latency}</span>
      </div>
      <span className="font-display mt-4 text-[15px] font-bold text-white">{label}</span>
      <span className="mt-1 text-[12.5px] leading-snug text-neutral-400">{sub}</span>
      {active && (
        <span className="absolute -top-px left-5 right-5 h-px bg-gradient-to-r from-transparent via-brand to-transparent" aria-hidden="true" />
      )}
    </div>
  );
}

export function ArchitectureStrip() {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FlowSlab icon={Mic} label="Recognition" sub="Streaming speech-to-text" latency="~0ms STREAM" active />
        <FlowSlab icon={Brain} label="Reasoning" sub="LLM with your knowledge + rules" latency="TURN-BASED" active />
        <FlowSlab icon={Waves} label="Speech" sub="Voice synthesis with emotion cues" latency="SEGMENTED" active />
        <FlowSlab icon={Workflow} label="Action" sub="Booking, routing, human handoff" latency="ON ESCALATION" />
      </div>
      {/* animated flow wire */}
      <div className="relative mt-5 h-px w-full overflow-hidden bg-white/10" aria-hidden="true">
        <motion.div
          className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-brand to-transparent"
          animate={{ x: ["-96px", "100%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="mt-4 font-mono-dy text-[11px] tracking-[0.16em] text-neutral-400">
        SIGNAL PATH · RECOGNITION → REASONING → SPEECH → ACTION. BARGE-IN CUTS SPEECH THE MOMENT YOU TALK.
      </p>
    </div>
  );
}

/* ---------------- Live stat rail (real telemetry) ---------------- */

export function StatRail({ dark = true, note }: { dark?: boolean; note?: string }) {
  const stats = usePublicStats();
  const { content } = useSite();
  const honestNote =
    note ??
    (content["home.stats.honest_note"]?.value || "These counters are live. They read from the database: zero until real work happens here.");
  const items = [
    { label: "ACTIVE USERS", value: stats ? String(stats.users) : "0" },
    { label: "AI EMPLOYEES", value: stats ? String(stats.employees) : "0" },
    { label: "CALLS HANDLED", value: stats ? String(stats.calls) : "0" },
    { label: "MESSAGES", value: stats ? String(stats.messages) : "0" },
  ];
  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border",
          dark ? "border-white/10 bg-white/10" : "border-white/10 bg-white/10",
        )}
      >
        {items.map((s) => (
          <div key={s.label} className={cn("p-5", dark ? "bg-ink" : "bg-ink-3")}>
            <p className={cn("font-display-strong text-[28px] leading-none", dark ? "text-white" : "text-white")}>
              {s.value}
            </p>
            <p className={cn("eyebrow-dy mt-2.5", dark ? "text-neutral-500" : "text-neutral-500")}>{s.label}</p>
          </div>
        ))}
      </div>
      <p className={cn("mt-3 font-mono-dy text-[10.5px] leading-relaxed tracking-[0.04em]", dark ? "text-neutral-400" : "text-neutral-400")}>
        {honestNote.toUpperCase()}
      </p>
    </div>
  );
}

/* ---------------- Pricing ---------------- */

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    tagline: "Build and test in text. The major functions are paid, on purpose.",
    features: [
      "1 AI employee (web chat)",
      "Text conversations with real LLM replies",
      "Knowledge base (text sources)",
      "Community support",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Business",
    price: "$49",
    period: "per month + usage",
    tagline: "The major functions: real-time voice with emotion, live.",
    features: [
      "Everything in Starter",
      "Real-time voice calls with the emotion engine",
      "True barge-in + human handoff workflows",
      "10 AI employees",
      "Phone numbers, provisioned for you",
      "SMS channel",
      "Priority email support",
    ],
    cta: "Start building",
    highlight: true,
  },
  {
    name: "Agency",
    price: "Custom",
    period: "volume pricing",
    tagline: "Run communication for many businesses.",
    features: [
      "Unlimited employees & workspaces",
      "Everything in Business",
      "White-label options",
      "SLA-backed support",
      "Dedicated onboarding",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export function PricingTable({ enterpriseNote = true }: { enterpriseNote?: boolean }) {
  const { navigate } = useDyRouter();
  const { settings } = useSite();
  if (!settings.flagShowPricing) return null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-[4px] border p-7 transition-all duration-300 ease-mechanical hover:-translate-y-0.5",
                t.highlight
                  ? "border-brand/40 bg-ink-3 shadow-[0_24px_60px_-20px_rgba(10,91,196,0.35)]"
                  : t.name === "Agency"
                    ? "border-white/10 bg-[#0A1424] text-white hover:border-brand/40 hover:shadow-[0_20px_56px_-20px_rgba(9,9,9,0.5)]"
                    : "border-white/10 bg-ink-3 hover:border-neutral-300 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)]",
              )}
            >
              {t.highlight && (
                <span className="absolute -top-px left-0 right-0 h-[2px] bg-brand" aria-hidden="true" />
              )}
              <div className="flex items-baseline justify-between">
                <h3 className={cn("font-display text-[17px] font-bold", t.name === "Agency" ? "text-white" : "text-white")}>{t.name}</h3>
              {t.highlight && (
                <span className="chip-gold">MOST CHOSEN</span>
              )}
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className={cn("font-display-strong text-[40px] leading-none tracking-[-0.04em]", t.name === "Agency" ? "text-white" : "text-white")}>
                  {t.price}
                </span>
                <span className="font-mono-dy text-[10px] tracking-[0.06em] text-neutral-500">
                  {t.period.toUpperCase()}
                </span>
              </div>
              <p className={cn("mt-3 text-[13.5px] leading-relaxed", t.name === "Agency" ? "text-neutral-400" : "text-neutral-400")}>{t.tagline}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className={cn("flex items-start gap-2.5 text-[13.5px] leading-[1.6]", t.name === "Agency" ? "text-neutral-300" : "text-neutral-300")}>
                    <svg width="12" height="12" viewBox="0 0 12 12" className="mt-[5px] flex-none" aria-hidden="true">
                      <circle cx="6" cy="6" r="4" fill="#4A90E2" />
                      <circle cx="6" cy="6" r="1.6" fill="#ffffff" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(t.name === "Agency" ? ROUTES.contact : ROUTES.signup)}
                className={cn(
                  "mt-7 h-11 w-full text-[13.5px]",
                  t.highlight ? "btn-flare" : "btn-glass",
                )}
              >
                {t.cta}
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
      {enterpriseNote && (
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-3xl font-mono-dy text-[11px] leading-relaxed tracking-[0.04em] text-neutral-500">
            HONEST PRICING NOTES · REAL PHONE MINUTES CARRY REAL CARRIER COSTS: PASSED THROUGH AT COST,
            NEVER MARKED UP. NO SETUP FEES. CANCEL ANY TIME. WORKSPACE OWNERS TEST EVERY FEATURE FREE.
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------- FAQ ---------------- */

const FAQS = [
  {
    q: "Are the voice calls actually real?",
    a: "Yes, and they are a paid feature, stated plainly. On Business and Agency plans you speak into your microphone, your speech is transcribed by your browser, an LLM thinks with your employee's configuration, and the reply is spoken back with emotion, live. The free Starter plan covers text chat. What is honestly not included without provider activation: real phone numbers and PSTN minutes.",
  },
  {
    q: "Can it really be interrupted mid-sentence?",
    a: "Yes. Barge-in is a first-class behavior. The moment you start speaking while the employee is talking, speech is cancelled, the interrupted turn is marked, and the model is told you cut in: it then follows your new direction instead of finishing its sentence.",
  },
  {
    q: "Where does the business knowledge come from?",
    a: "From you. Employees answer strictly from knowledge sources you connect. If the answer is not in the approved knowledge, the employee says so and offers human follow-up. It never invents prices or policies.",
  },
  {
    q: "What happens when it does not know something?",
    a: "It says so, plainly, and escalates to a human according to the rule you set for that employee. The transcript of everything said so far travels with the handoff.",
  },
  {
    q: "Is my data used to train models?",
    a: "No. Your conversations and knowledge stay in your workspace. See the Security page for the full, specific list of what is stored and where.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl">
      <Accordion type="single" collapsible className="rounded-[4px] border border-white/10">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className={cn("border-white/10", i === 0 && "border-t-0")}>
            <AccordionTrigger className="px-6 py-5 text-left font-display text-[15.5px] font-bold tracking-[-0.01em] hover:no-underline hover:text-brand [&>svg]:text-neutral-400">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 text-[14px] leading-relaxed text-neutral-400">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/* ---------------- Voice principles (latency budget) ---------------- */

export function VoicePrinciples() {
  const rows = [
    ["Recognition", "Streaming, interim results", "Powers barge-in detection"],
    ["Turn latency", "Measured per turn", "Displayed on every AI reply: the number you see is the number that happened"],
    ["Speech", "Segmented synthesis", "Emotion cues modulate rate, pitch, and silence"],
    ["Silence", "Engineered, not accidental", "Breaths and pauses are placed by the model, not by chance"],
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {rows.map(([k, v, d], i) => (
        <Reveal key={k} delay={i * 0.06}>
          <div className="h-full rounded-[4px] border border-white/10 bg-ink-3 p-6 transition-transform duration-300 ease-mechanical hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5">
              <Timer className="h-4 w-4 text-brand" strokeWidth={1.8} />
              <span className="font-mono-dy text-[10.5px] font-semibold tracking-[0.2em] text-neutral-500">
                {k.toUpperCase()}
              </span>
            </div>
            <p className="font-display mt-3 text-[16px] font-bold text-white">{v}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">{d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------------- Security strip ---------------- */

const SECURITY_ITEMS = [
  { icon: Lock, title: "Encrypted transport", body: "Everything moves over TLS. Sessions are httpOnly, hashed, and revocable instantly." },
  { icon: Eye, title: "You see what we store", body: "A specific, itemized list: not a vague policy cloud. Inspect it on the Security page." },
  { icon: FileCheck, title: "Full audit trail", body: "Every admin action, approval, block, and content change is logged with actor and time." },
  { icon: ShieldCheck, title: "No training on your data", body: "Your conversations and knowledge are never used to train models. Full stop." },
];

export function SecurityStrip() {
  const { navigate } = useDyRouter();
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECURITY_ITEMS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.07}>
            <div className="group h-full rounded-[4px] border border-white/10 bg-ink-3 p-6 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-brand/30">
              <IconOrb icon={s.icon} size={40} />
              <h3 className="font-display mt-4 text-[15px] font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2}>
        <button
          onClick={() => navigate(ROUTES.security)}
          className="mt-8 inline-flex items-center gap-2 font-mono-dy text-[11.5px] font-semibold tracking-[0.16em] text-neutral-400 transition-colors ease-mechanical hover:text-brand"
        >
          READ THE FULL SECURITY POSTURE
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </Reveal>
    </div>
  );
}

/* ---------------- Memory & knowledge ---------------- */

export function MemoryAndKnowledge() {
  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <Reveal>
        <div className="relative overflow-hidden rounded-[4px] border border-white/10 bg-ink-2 p-7">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand/5" aria-hidden="true" />
          <p className="eyebrow-dy text-neutral-500">Knowledge card: preview</p>
          <div className="mt-5 space-y-3">
            {[
              { q: "What is the deposit for a booking?", a: "No deposit for standard bookings; 20% holds event dates.", hit: true },
              { q: "Do you deliver outside the city?", a: "Within 15 km. Beyond that, quoted per trip.", hit: true },
              { q: "What is your refund policy?", a: "Not in approved knowledge: employee offers human follow-up.", hit: false },
            ].map((row) => (
              <div
                key={row.q}
                className={cn(
                  "rounded-[3px] border p-4",
                  row.hit ? "border-white/10 bg-ink-3" : "border-dashed border-brand/40 bg-brand/[0.03]",
                )}
              >
                <p className="text-[13px] font-semibold text-white">{row.q}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-neutral-400">{row.a}</p>
                <p
                  className={cn(
                    "mt-2 font-mono-dy text-[10px] tracking-[0.16em]",
                    row.hit ? "text-[#2e7d4f]" : "text-brand",
                  )}
                >
                  {row.hit ? "GROUNDED ANSWER" : "HONEST ESCALATION"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <div className="space-y-6">
        {[
          {
            icon: BookOpen,
            title: "Answers with receipts",
            body: "Retrieval runs on every turn. The employee speaks from the chunks that matched your question: and refuses to guess when nothing matches.",
          },
          {
            icon: Eye,
            title: "Escalation you can audit",
            body: "When the answer is not in the knowledge, that is displayed on the turn itself. You always know which replies were grounded and which led to a human.",
          },
        ].map((b, i) => (
          <Reveal key={b.title} delay={0.1 + i * 0.08}>
            <div className="flex gap-4">
              <IconOrb icon={b.icon} size={36} />
              <div>
                <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-white">{b.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">{b.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Integrations preview ---------------- */

const INTEGRATIONS = [
  { name: "Web chat", state: "connected", note: "Live now" },
  { name: "Browser voice", state: "connected", note: "Live now" },
  { name: "WhatsApp chat", state: "connected", note: "Live now" },
  { name: "Phone numbers", state: "attention", note: "We provision" },
  { name: "SMS", state: "attention", note: "We provision" },
  { name: "Calendar (ICS)", state: "connected", note: "Live now" },
];

export function IntegrationsPreview() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {INTEGRATIONS.map((ig, i) => (
        <Reveal key={ig.name} delay={i * 0.05}>
          <div className="flex h-full flex-col rounded-[4px] border border-white/10 bg-ink-3 p-5 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-brand/40">
            <IconOrb icon={Plug} size={34} />
            <p className="font-display mt-4 text-[14px] font-bold text-white">{ig.name}</p>
            <p
              className={cn(
                "dy-status mt-2.5",
                ig.state === "connected" && "dy-status-connected text-[#2e7d4f]",
                ig.state === "attention" && "dy-status-attention text-[#d08700]",
                ig.state === "neutral" && "dy-status-neutral text-neutral-500",
              )}
            >
              <span className="dy-status-dot" />
              {ig.note.toUpperCase()}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
