"use client";

import { useDyRouter, ROUTES } from "@/lib/router";
import { IconOrb } from "@/components/brand/icon-orb";
import { MarketingPageShell, CtaBand } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import {
  MarketingSection,
  SectionHead,
  FeatureGrid,
  ChannelsHonest,
  HowItWorks,
  ArchitectureStrip,
  PricingTable,
  Faq,
  VoicePrinciples,
  MemoryAndKnowledge,
  IntegrationsPreview,
  StatRail,
  Reveal,
  IndustriesShowcase,
  AgentGallery,
  ProvidedPanel,
  PhotoBand,
} from "@/components/marketing/sections";
import { Showreel, AppSection, VoiceCloneSection } from "@/components/marketing/showreel";
import { useSite } from "@/hooks/use-site";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Brain, MessageSquare, BookOpen, Hand, Workflow, Timer, Mic, Waves, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Shared page scaffolding ---------------- */

export function PageHero({
  kicker,
  title,
  intro,
  stat,
}: {
  kicker: string;
  title: string;
  intro: string;
  stat?: { label: string; value: string };
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-white grain-dy">
      <div className="absolute inset-0 dy-grid-bg opacity-50" aria-hidden="true" />
      <div className="absolute inset-0 dy-radial-fade" aria-hidden="true" />
      <div className="container-dy relative grid grid-cols-1 gap-8 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3">
            <span className="dy-status dy-status-live">
              <span className="dy-status-dot" />
            </span>
            <span className="eyebrow-dy text-neutral-400">{kicker.toUpperCase()}</span>
          </div>
          <h1 className="font-display-strong mt-6 max-w-3xl text-[clamp(2.1rem,4.6vw,3.7rem)] leading-[1.02] tracking-[-0.04em] text-balance-dy">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-neutral-400 text-pretty-dy md:text-[16.5px]">
            {intro}
          </p>
        </div>
        {stat && (
          <div className="flex items-end lg:col-span-4 lg:justify-end">
            <div className="hairline-b border-b border-white/10 pb-4">
              <p className="font-display-strong text-[34px] leading-none text-white">{stat.value}</p>
              <p className="eyebrow-dy mt-2 text-neutral-500">{stat.label}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ProseBlock({
  icon: Icon,
  title,
  body,
  points,
}: {
  icon?: typeof Phone;
  title: string;
  body: string;
  points?: string[];
}) {
  return (
    <div className="group h-full rounded-[4px] border border-white/10 bg-ink-3 p-6 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)] md:p-7">
      {Icon && <IconOrb icon={Icon} size={44} className="group-hover:-translate-y-0.5" />}
      <h3 className="font-display mt-5 text-[18px] font-bold tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-400">{body}</p>
      {points && (
        <ul className="mt-4 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-neutral-300">
              <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-brand" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Home ---------------- */

export function HomePage() {
  return (
    <MarketingPageShell>
      <Hero />

      <MarketingSection
        num="01"
        eyebrow="The showreel"
        title="Watch a call happen."
        lead="Simulated, honestly labeled. Real cues, real interruptions, real grounding on display."
      >
        <Showreel />
      </MarketingSection>

      <MarketingSection
        num="02"
        eyebrow="Who it serves"
        title="Built for teams that live on the phone."
        lead="Front desks, intake lines, order queues: the places where waiting costs money."
      >
        <IndustriesShowcase />
      </MarketingSection>

      <MarketingSection
        num="03"
        eyebrow="What they do"
        title="Employees, not chatbots."
        lead="Each one has a job, a personality, and rules it will not break."
      >
        <FeatureGrid />
      </MarketingSection>

      <MarketingSection
        num="04"
        eyebrow="The hires"
        title="Meet the workforce."
        lead="Ready-made roles, trainable in minutes."
      >
        <AgentGallery />
      </MarketingSection>

      <MarketingSection
        id="architecture"
        num="05"
        eyebrow="The pipeline"
        title="Built for interruption, not monologue."
        lead="Human conversation is overlap and half-finished sentences. Every stage yields the moment you speak."
        dark
      >
        <ArchitectureStrip />
        <div className="mt-16">
          <VoicePrinciples />
        </div>
      </MarketingSection>

      <MarketingSection
        num="06"
        eyebrow="Getting started"
        title="From idea to answering in one sitting."
        lead="Describe the job, feed it the truth, take a test call."
      >
        <HowItWorks />
      </MarketingSection>

      <MarketingSection
        num="07"
        eyebrow="Knowledge"
        title="It only says what you approved."
        lead="Grounded retrieval on every turn. Ungrounded turns go to a human, visibly."
      >
        <MemoryAndKnowledge />
      </MarketingSection>

      <MarketingSection
        num="08"
        eyebrow="Voice cloning"
        title="Your voice, their shift."
        lead="Upload a sample, capture consent, and your employee answers in a voice your customers already trust."
      >
        <VoiceCloneSection />
      </MarketingSection>

      <MarketingSection
        num="09"
        eyebrow="The deal"
        title="You bring nothing. We provide everything."
        lead="Your clients pay you to solve communication. You pay us to make it work end to end."
      >
        <ProvidedPanel />
      </MarketingSection>

      <MarketingSection num="10" eyebrow="Channels" title="Honest about every channel." lead="What works today, and what we provision on request. No mystery states.">
        <ChannelsHonest />
      </MarketingSection>

      <MarketingSection num="11" eyebrow="The app" title="Take the front desk with you." lead="Live calls, transcripts, handoffs. In your pocket, the moment the stores approve." >
        <AppSection />
      </MarketingSection>

      <MarketingSection num="12" eyebrow="Pricing" title="Priced to start, built to scale." lead="Start free in text. Upgrade for the major functions: voice, emotion, telephony.">
        <PricingTable />
      </MarketingSection>

      <MarketingSection num="13" eyebrow="Questions" title="Asked honestly, answered honestly." tight>
        <Faq />
      </MarketingSection>

      <PhotoBand
        img="/img/abstract-signal.jpg"
        eyebrow="The signal is ready"
        title="Every call your business misses tonight is gone by morning."
        note="Put an AI employee on the line and find out what answering everything feels like."
        ctaLabel="Start building free"
      />

      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Product pages ---------------- */

export function ProductIndexPage() {
  const { navigate } = useDyRouter();
  const cards = [
    { img: "/img/agent-reception.jpg", icon: Phone, title: "AI Employees", body: "Hire a receptionist, sales assistant, support agent, or scheduler in minutes.", href: ROUTES.productEmployees },
    { img: "/img/blog-emotion.jpg", icon: Mic, title: "Voice Engine", body: "The streaming pipeline that listens, thinks, speaks: and lets you interrupt.", href: ROUTES.productVoice },
    { img: "/img/blog-handoff.jpg", icon: BookOpen, title: "Knowledge", body: "Answers grounded in your approved documents, never invented.", href: ROUTES.productKnowledge },
    { img: "/img/network-map.jpg", icon: MessageSquare, title: "Channels", body: "Web chat, phone, and SMS. We provision the numbers.", href: ROUTES.productChannels },
  ];
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product"
        title="One platform. Every conversation your business has to hold."
        intro="One system to build, deploy, and supervise AI employees: voice engine underneath, audit trail behind."
        stat={{ label: "SECTIONS BELOW", value: "04" }}
      />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07}>
              <button
                onClick={() => navigate(c.href)}
                className={cn("tilt-3d group block w-full text-left", i % 2 === 1 && "tilt-3d-alt")}
                aria-label={`Open ${c.title}`}
              >
                <div className="photo-frame aspect-[16/10]">
                  <Image src={c.img} alt={c.title} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                  <div className="photo-scrim" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-ink/70">
                        <c.icon className="h-3.5 w-3.5 text-flare" strokeWidth={2} />
                      </span>
                      <span className="font-display text-[18px] font-bold tracking-[-0.02em] text-white">{c.title}</span>
                    </div>
                    <p className="mt-1.5 max-w-md text-[13px] leading-snug text-neutral-300">{c.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-mono-dy text-[10.5px] font-medium tracking-[0.14em] text-neutral-400 transition-colors group-hover:text-flare">
                      OPEN
                      <ArrowRight className="h-3 w-3 transition-transform ease-mechanical group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductEmployeesPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: AI Employees"
        title="Give the job to someone who never sleeps, never misses, never guesses."
        intro="Nine role templates, plain-language instructions, versioned deploys."
        stat={{ label: "ROLE TEMPLATES", value: "09" }}
      />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy">
          <SectionHead num="01" eyebrow="The roles" title="Three archetypes, nine templates." lead="Every role ships hireable today. Each one trains in minutes and escalates when it should." />
          <div className="mt-10">
            <AgentGallery />
          </div>
        </div>
      </div>
      <MarketingSection num="02" eyebrow="Lifecycle" title="Draft, test, deploy, supervise." lead="Nothing goes live unheard. Every employee passes a test call first; every deployed change is versioned.">
        <HowItWorks />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductVoicePage() {
  const { content } = useSite();
  const title =
    content["product.voice.title"]?.visible && content["product.voice.title"]?.value
      ? content["product.voice.title"].value
      : "A voice pipeline built for interruption.";
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Voice Engine"
        title={title}
        intro="Streaming recognition feeds a reasoning engine whose replies are spoken with real emotional texture. Talk over it and it stops, listens, follows."
        stat={{ label: "CUE TYPES", value: "14" }}
      />
      <MarketingSection
        id="architecture"
        num="01"
        eyebrow="Signal path"
        title="Four stages, one conversation."
        lead="The pipeline is a relay where speech yields to listening at every handoff."
        dark
      >
        <ArchitectureStrip />
        <div className="mt-16">
          <VoicePrinciples />
        </div>
      </MarketingSection>
      <MarketingSection num="02" eyebrow="Emotion" title="Not a monotone with adjectives." lead="Cues are generated situationally, modulate rate, pitch, and silence, and appear as chips in the transcript.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={Waves} title="Audible texture" body="Breaths, sighs, warm laughter, hesitation: real prosody changes, not decoration." />
          <ProseBlock icon={Timer} title="Sparing by rule" body="Empathy near frustration, never laughter at it." />
          <ProseBlock icon={Hand} title="Correction, not cover-up" body="It can hesitate and self-correct mid-sentence. The correction stays in the transcript." />
        </div>
      </MarketingSection>
      <PhotoBand
        img="/img/blog-emotion.jpg"
        eyebrow="Hear it yourself"
        title="A voice that breathes."
        note="Take a test call in Voice Studio and interrupt it. That is the demo."
        ctaLabel="Start building free"
      />
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductConversationsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Conversations"
        title="Every channel, one memory."
        intro="The same employee, knowledge, and escalation rules carry across web chat and voice: with a unified inbox, takeover, and transcript trail for every conversation."
      />
      <MarketingSection num="01" eyebrow="Supervision" title="Watch, step in, hand back." lead="Live transcripts, human takeover with a single click, and system messages that keep the record honest about who said what.">
        <HowItWorks />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductChannelsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Channels"
        title="Say what is live, what needs setup, and what is not built yet."
        intro="The channel table is generated from the same states the dashboard shows. There is no marketing state and product state: just one truth."
      />
      <MarketingSection num="01" eyebrow="Channel states" title="The honest table." lead="No asterisks, no fine print.">
        <ChannelsHonest />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductKnowledgePage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Knowledge"
        title="Grounded answers, or honest silence."
        intro="Employees speak from approved sources. When the answer is not there, they say so and escalate: the transcript shows which replies were grounded and which were not."
      />
      <MarketingSection num="01" eyebrow="Grounding" title="Answers with receipts." lead="Retrieval runs on every turn. Every reply either traces to your knowledge or declares that it cannot.">
        <MemoryAndKnowledge />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductAutomationsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Automations"
        title="Rules that fire while you sleep."
        intro="Real event-driven automation: a trigger from the live platform, an action with real output, and a complete run log. Every execution is recorded, failures included."
      />
      <MarketingSection num="01" eyebrow="Today" title="What runs now, for real." lead="These automations are live in the current build.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={Hand} title="Escalation routing" body="Low confidence, legal, medical, or payment disputes route to a human with the full transcript attached." />
          <ProseBlock icon={Workflow} title="Handoff rules" body="Per-employee escalation policies: who gets pulled in, and when the employee must stop guessing." />
          <ProseBlock icon={BookOpen} title="Knowledge updates" body="New sources are indexed and immediately available to every deployed employee." />
        </div>
      </MarketingSection>
      <MarketingSection num="02" eyebrow="Automation rules" title="Trigger, action, run log." lead="You build the rule. The platform fires it on real events and shows you every run.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={Timer} title="Post-call follow-up drafts" body="When a call ends, the AI drafts a warm follow-up message from the actual transcript and files it in the run log, ready to send." />
          <ProseBlock icon={Workflow} title="Instant owner alerts" body="New inquiries, closed conversations, and finished calls notify the owner the moment they happen, with the full context attached." />
          <ProseBlock icon={Megaphone} title="Complete run log" body="Every execution is recorded with its output and outcome. Failed runs say why they failed, in plain words." />
        </div>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ProductIntegrationsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Product: Integrations"
        title="Fully managed. Nothing for you to bring."
        intro="You pay us to handle communication end to end. We provision numbers, run the voice engine, and keep the stack current. No accounts to wire, no keys to paste."
      />
      <MarketingSection num="01" eyebrow="Platform layer" title="Every state, visible." lead="Connection states are real: read from the same database the dashboard reads.">
        <IntegrationsPreview />
        <div className="mt-12">
          <ChannelsHonest />
        </div>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Solutions pages ---------------- */

function SolutionShell({
  kicker,
  title,
  intro,
  audience,
}: {
  kicker: string;
  title: string;
  intro: string;
  audience: { title: string; body: string; icon: typeof Phone }[];
}) {
  return (
    <MarketingPageShell>
      <PageHero kicker={kicker} title={title} intro={intro} />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy grid grid-cols-1 gap-4 md:grid-cols-3">
          {audience.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.07}>
              <ProseBlock icon={a.icon} title={a.title} body={a.body} />
            </Reveal>
          ))}
        </div>
      </div>
      <MarketingSection num="01" eyebrow="Proof" title="Numbers that update themselves." lead="Live platform telemetry: zero until real work happens here, and proud of it.">
        <StatRail dark={false} />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function SolutionsIndexPage() {
  const { navigate } = useDyRouter();
  const cards = [
    { img: "/img/avatar-2.jpg", label: "Individuals", desc: "One assistant, your voice, your rules.", href: ROUTES.solutionsIndividuals },
    { img: "/img/avatar-1.jpg", label: "Businesses", desc: "A front desk that scales with the phones.", href: ROUTES.solutionsBusiness },
    { img: "/img/team-studio.jpg", label: "Agencies", desc: "Run communication as a service.", href: ROUTES.solutionsAgencies },
  ];
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Solutions"
        title="Built for whoever answers for a living."
        intro="Solo professionals, overloaded front desks, and agencies running communication for many clients."
      />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy grid grid-cols-1 gap-5 sm:grid-cols-3">
          {cards.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <button
                onClick={() => navigate(s.href)}
                className={cn("tilt-3d group block w-full text-left", i % 2 === 1 && "tilt-3d-alt")}
                aria-label={`Explore ${s.label}`}
              >
                <div className="photo-frame aspect-[4/5]">
                  <Image src={s.img} alt={s.label} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />
                  <div className="photo-scrim" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="font-mono-dy text-[11px] font-semibold tracking-[0.22em] text-flare">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display mt-2 text-[20px] font-bold tracking-[-0.02em] text-white">{s.label}</h3>
                    <p className="mt-1 text-[13px] leading-snug text-neutral-300">{s.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-mono-dy text-[10.5px] font-medium tracking-[0.14em] text-neutral-400 transition-colors group-hover:text-flare">
                      READ
                      <ArrowRight className="h-3 w-3 transition-transform ease-mechanical group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      <MarketingSection num="01" eyebrow="Industries" title="Where the phones never stop." lead="Front desks, intake lines, order queues: the places where waiting costs money.">
        <IndustriesShowcase />
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function SolutionsIndividualsPage() {
  return (
    <SolutionShell
      kicker="Solutions: Individuals"
      title="You are one person. Your phone should not know that."
      intro="A personal AI assistant that answers as you would, books what you actually accept, and interrupts itself the moment you call for it."
      audience={[
        { icon: Phone, title: "Every call answered", body: "Inquiries, scheduling, directions: handled while you work. You keep the summary." },
        { icon: BookOpen, title: "Your rules, spoken", body: "Availability, pricing, boundaries: written once, applied to every conversation." },
        { icon: Hand, title: "You, on demand", body: "It escalates to you with full context when the call deserves a human." },
      ]}
    />
  );
}

export function SolutionsBusinessPage() {
  return (
    <SolutionShell
      kicker="Solutions: Businesses"
      title="A front desk that scales with the phones."
      intro="AI employees absorb the repetitive volume: reception, FAQs, booking: and hand your team the conversations that actually need them, with the transcript already attached."
      audience={[
        { icon: Phone, title: "Nothing rings out", body: "Parallel AI coverage means no hold queue, no voicemail black hole." },
        { icon: Brain, title: "One source of truth", body: "Approved policies and pricing only. The employee that never misquotes." },
        { icon: Workflow, title: "Supervised autonomy", body: "Escalation rules, live dashboards, and a full audit trail per conversation." },
      ]}
    />
  );
}

export function SolutionsAgenciesPage() {
  return (
    <SolutionShell
      kicker="Solutions: Agencies"
      title="Run communication as a service."
      intro="Manage AI employees across client organizations from one console: per-client workspaces, separate knowledge, shared provider economics."
      audience={[
        { icon: MessageSquare, title: "Multi-tenant by design", body: "Each client's employees, knowledge, and transcripts stay strictly in their workspace." },
        { icon: BookOpen, title: "Client onboarding, fast", body: "Templates and role presets get a client from kickoff to first call quickly." },
        { icon: Timer, title: "Usage you can bill", body: "Real per-organization usage events, exportable, honest." },
      ]}
    />
  );
}

export { PricingTable };
