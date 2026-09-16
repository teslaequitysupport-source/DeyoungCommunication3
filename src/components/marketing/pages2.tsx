"use client";

import { useState } from "react";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSession } from "@/lib/session";
import { MarketingPageShell, CtaBand } from "@/components/marketing/footer";
import { PageHero, ProseBlock } from "@/components/marketing/pages";
import { MarketingSection, PricingTable, Reveal, StatRail, PhotoBand } from "@/components/marketing/sections";
import { useSite } from "@/hooks/use-site";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiteLockup } from "@/components/brand/logo";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Eye,
  FileCheck,
  ShieldCheck,
  Server,
  Database,
  KeyRound,
  ScrollText,
  Code2,
  Terminal,
  BookOpen,
  Compass,
  History,
  Mail,
  MapPin,
  Hand,
  Timer,
  Fingerprint,
  AudioLines,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Voice studio (marketing) ---------------- */

export function VoiceStudioPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Voice Studio"
        title="Tune the voice before it takes the job."
        intro="Clone a voice, set the pace, place the pauses. The studio is where tone stops being an adjective and starts being a setting."
      />
      <MarketingSection num="01" eyebrow="Voice cloning" title="Clone a voice. It obeys you exactly." lead="Your own voice, or one you have the rights to. Three short readings are measured in your browser, the profile is saved, and your AI employees speak with it on every call.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={Fingerprint} title="Clone Lab" body="Record three sentences or upload a sample. Pitch, pace and energy are measured locally: the audio never leaves your tab." />
          <ProseBlock icon={AudioLines} title="Assign to any employee" body="Every AI employee has a Voice setting. Pick a cloned profile, hear a preview, deploy. Swap it as often as you like." />
          <ProseBlock icon={ShieldCheck} title="Consent on record" body="Each profile stores who consented and when. Delete it and every employee stops using it immediately." />
        </div>
        <Reveal delay={0.1}>
          <div className="mt-6 overflow-hidden rounded-[4px] border border-white/10">
            {[
              { m: "TIMBRE MATCH", s: "LIVE NOW", d: "Your measured pitch, pace and energy drive the synthesis voice, register matching and multipliers, in real calls, today." },
              { m: "NEURAL CLONE", s: "PENDING", d: "Rebuilding your exact timbre needs a heavy model that does not run here yet. When a free provider connects, the same profile upgrades in place. Labeled honestly, never faked." },
            ].map((r, i) => (
              <div key={r.m} className={cn("grid grid-cols-1 gap-2 border-white/10 px-6 py-4 md:grid-cols-[160px_110px_1.6fr] md:items-center md:gap-4", i > 0 && "border-t")}>
                <span className={cn("font-mono-dy text-[11px] font-semibold tracking-[0.12em]", i === 0 ? "text-goldflare" : "text-neutral-400")}>{r.m}</span>
                <span className={cn("font-mono-dy text-[10px] tracking-[0.14em]", i === 0 ? "text-goldflare" : "text-neutral-500")}>{r.s}</span>
                <span className="text-[13px] leading-snug text-neutral-400">{r.d}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </MarketingSection>
      <MarketingSection num="02" eyebrow="Script control" title="Tell it what to say. Word for word." lead="Your instructions are orders, not suggestions. Script rules answer verbatim before any AI thinking, and you can steer any call live.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={ScrollText} title="Script rules" body="When the caller mentions X, the employee says Y. Exactly Y. Every time, before the model gets a word in." />
          <ProseBlock icon={Megaphone} title="Per-call directives" body="Starting a call? Tell it what to say and how to answer on this exact call. It must obey, start to finish." />
          <ProseBlock icon={Hand} title="Coach mid-call" body="Type a correction during a live call and the employee breaks in to say it, or obeys on its next reply. It never argues." />
        </div>
      </MarketingSection>
      <MarketingSection num="03" eyebrow="Practice" title="Test calls before customers." lead="Call your employee from the browser, interrupt it, correct it, and hear the difference: before a single customer does.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={Terminal} title="Live practice console" body="Speak, listen, barge in. Every practice call is a real pipeline run with a real transcript." />
          <ProseBlock icon={Eye} title="Cue review" body="See exactly which emotion cues fired, and when: so tone is auditable, not vibes." />
          <ProseBlock icon={History} title="Version compare" body="Every config change is versioned. A/B the tone by deploying and calling both." />
        </div>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Developers ---------------- */

export function DevelopersPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Developers"
        title="A pipeline you can reason about."
        intro="REST endpoints, event streams, and honest error states. The same APIs the dashboard uses: nothing hidden, nothing magic."
      />
      <MarketingSection num="01" eyebrow="Surface" title="The API, as it exists today." lead="Real routes from this build: each documented with what it does and what it will honestly not do yet.">
        <div className="overflow-hidden rounded-[4px] border border-white/10">
          {[
            { m: "POST", path: "/api/calls/:id/turn", d: "Send a human turn, receive the AI's spoken reply with cue array + measured latency." },
            { m: "POST", path: "/api/calls", d: "Start a live call session for a deployed employee." },
            { m: "GET", path: "/api/calls", d: "List your organization's call sessions with real durations and interruption counts." },
            { m: "POST", path: "/api/conversations/:id/messages", d: "Web chat turn with knowledge-grounded replies." },
            { m: "GET", path: "/api/overview", d: "Usage summary powering the dashboard." },
          ].map((r, i) => (
            <div key={`${r.m}-${r.path}`} className={cn("grid grid-cols-1 gap-2 border-white/10 px-6 py-4 md:grid-cols-[80px_1fr_1.4fr] md:items-center md:gap-4", i > 0 && "border-t")}>
              <span className="font-mono-dy text-[11px] font-semibold tracking-[0.1em] text-brand">{r.m}</span>
              <span className="font-mono-dy text-[13px] text-white">{r.path}</span>
              <span className="text-[13px] leading-snug text-neutral-400">{r.d}</span>
            </div>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mt-5 font-mono-dy text-[11px] leading-relaxed tracking-[0.04em] text-neutral-500">
            WEBSOCKET EVENT STREAM · ADMIN CONSOLE USES IT TODAY (USER, CALL, CONTENT EVENTS). PUBLIC
            EVENT SUBSCRIPTIONS ARE PHASE 2, LABELED HONESTLY UNTIL THEN.
          </p>
        </Reveal>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Resources ---------------- */

function ResourceCard({ img, icon: Icon, title, body, empty }: { img: string; icon: typeof BookOpen; title: string; body: string; empty?: string }) {
  return (
    <div className="group h-full overflow-hidden rounded-[10px] border border-white/10 bg-ink-3 transition-all duration-300 ease-mechanical hover:-translate-y-0.5 hover:border-brand/40">
      <div className="photo-frame aspect-[16/9] rounded-none border-0">
        <Image src={img} alt={title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
        <div className="photo-scrim" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-ink/70">
            <Icon className="h-3.5 w-3.5 text-flare" strokeWidth={2} />
          </span>
          <h3 className="font-display text-[16px] font-bold tracking-[-0.02em] text-white">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-[13.5px] leading-relaxed text-neutral-400">{body}</p>
        {empty && (
          <p className="mt-3 font-mono-dy text-[10px] leading-relaxed tracking-[0.08em] text-neutral-500">
            {empty.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
}

export function ResourcesIndexPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Resources"
        title="Documents we wrote, not documents we wish we had."
        intro="Guides, docs, and changelog: each honest about what exists versus what is planned. Empty sections say they are empty."
      />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy grid grid-cols-1 gap-5 md:grid-cols-3">
          <ResourceCard img="/img/blog-handoff.png" icon={Compass} title="Guides" body="Practical walkthroughs for building your first employee." empty="First guide ships with the public launch" />
          <ResourceCard img="/img/network-map.png" icon={Code2} title="Documentation" body="The API surface with honest scope markers." empty="Skeleton live: deep pages in progress" />
          <ResourceCard img="/img/blog-emotion.png" icon={History} title="Changelog" body="Every change to the platform, dated and reasoned." empty="First entry: the build you are looking at" />
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function GuidesPage() {
  return (
    <MarketingPageShell>
      <PageHero kicker="Resources: Guides" title="Guides" intro="Walkthroughs written from real usage of this exact build." />
      <div className="border-t border-white/10 bg-ink-3 py-20">
        <div className="container-dy">
          <div className="rounded-[4px] border border-dashed border-white/15 bg-ink-2 p-10 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-neutral-400" strokeWidth={1.8} />
            <p className="font-display mt-4 text-[17px] font-bold text-white">No guides published yet</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-neutral-400">
              We will not pad this page with filler. The first guide: &ldquo;From template to first answered call&rdquo;: ships with public launch.
            </p>
          </div>
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function DocsPage() {
  return (
    <MarketingPageShell>
      <PageHero kicker="Resources: Documentation" title="Documentation" intro="The honest scope of today's platform." />
      <MarketingSection num="01" eyebrow="Current surface" title="What is documented now." lead="Core flows that exist and work in this build.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProseBlock icon={Terminal} title="Employees API" body="Create, version, deploy, pause: the full lifecycle over REST." />
          <ProseBlock icon={Server} title="Conversations & calls" body="Chat threads and live voice sessions, both with transcripts." />
          <ProseBlock icon={Database} title="Knowledge" body="Text source indexing with honest processing states for other formats." />
          <ProseBlock icon={KeyRound} title="Auth & sessions" body="Scrypt password hashing, httpOnly sessions, instant revocation." />
        </div>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

export function ChangelogPage() {
  return (
    <MarketingPageShell>
      <PageHero kicker="Resources: Changelog" title="Changelog" intro="What changed, when, and why. Starting from this build." />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy max-w-3xl">
          <div className="relative pl-8">
            <span className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-white/10" aria-hidden="true" />
            {[
              {
                v: "v2.0: This build",
                d: "Live now",
                items: [
                  "Real-time voice calls in the browser: streaming recognition, emotion cues, barge-in",
                  "Admin control center: site CMS, media uploads, user approval queue, live call monitoring",
                  "Account lifecycle: pending → approved, with honest blocked/rejected reasons",
                  "Premium redesign: 3D signal field hero, Sora/JetBrains type system, film grain",
                ],
              },
              {
                v: "v1.0: Foundation",
                d: "Earlier",
                items: [
                  "Auth, organizations, AI employee CRUD with 9 role templates",
                  "Knowledge-grounded web chat with human takeover",
                  "Honest channel states and usage events",
                ],
              },
            ].map((e) => (
              <Reveal key={e.v}>
                <div className="relative pb-12">
                  <span className="absolute -left-8 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-white" aria-hidden="true" />
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-[17px] font-bold text-white">{e.v}</h3>
                    <span className="font-mono-dy text-[10.5px] tracking-[0.14em] text-neutral-500">{e.d.toUpperCase()}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {e.items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-neutral-400">
                        <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-brand" aria-hidden="true" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Pricing ---------------- */

export function PricingPage() {
  const { settings } = useSite();
  const { user } = useSession();
  const isOwner = user?.accountRole === "admin";
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Pricing"
        title="Free to build. Fair to scale."
        intro="Start free in text. Upgrade for the major functions: voice, emotion, and real phone channels. Solo use is fully supported: one person, one assistant, same platform."
      />
      {isOwner && (
        <div className="border-t border-white/10">
          <div className="container-dy pt-6">
            <div className="dy-radial-gold flex flex-col items-start gap-3 rounded-[10px] border border-gold/30 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="chip-gold">OWNER ACCESS</span>
                <p className="text-[13.5px] text-neutral-300">
                  You are the owner. Every feature is unlocked for testing at no cost, forever.
                </p>
              </div>
              <span className="font-mono-dy text-[10px] tracking-[0.16em] text-neutral-500">GATES LIFTED · $0</span>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy">
          {settings.flagShowPricing ? (
            <PricingTable />
          ) : (
            <div className="rounded-[4px] border border-dashed border-white/15 bg-ink-2 p-10 text-center">
              <p className="font-display text-[17px] font-bold text-white">Pricing is temporarily hidden</p>
              <p className="mt-2 text-[14px] text-neutral-400">An administrator turned this section off. Ask us directly: the answer will be honest.</p>
            </div>
          )}
        </div>
      </div>
      <MarketingSection num="01" eyebrow="Questions" title="The fine print, in plain print." tight>
        <div className="mx-auto max-w-3xl rounded-[4px] border border-white/10">
          {[
            ["Is this only for businesses?", "No. Individuals get the same platform: a solo receptionist or personal assistant runs identically. One employee on Starter is free forever, voice on Business."],
            ["What does 'forever free' mean?", "The Starter tier: one employee and web chat: stays free. Voice needs Business. We do not pretend otherwise."],
            ["What is 'usage' on Business?", "Carrier-billed minutes on real phone numbers, passed through at cost, plus per-message SMS fees. Never marked up."],
            ["Can I leave?", "Yes. Export your transcripts and knowledge from Settings, then cancel. No hostage data, no exit fees."],
          ].map(([q, a], i) => (
            <div key={q} className={cn("px-6 py-5", i > 0 && "border-t border-white/10")}>
              <p className="font-display text-[15px] font-bold text-white">{q}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">{a}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Security ---------------- */

export function SecurityPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Security"
        title="Specific, not soothing."
        intro="No policy fog. This is exactly what we store, where it lives, and who can touch it: the same list the code enforces."
      />
      <MarketingSection num="01" eyebrow="Data" title="What is stored, itemized." lead="Every table, in plain language.">
        <div className="overflow-hidden rounded-[4px] border border-white/10">
          {[
            ["Accounts", "Email, name, scrypt-hashed password, role, status, timestamps", "Never sold, never exported, deletable on request"],
            ["Organizations", "Name, type, settings JSON", "Scoped isolation on every query"],
            ["Conversations & calls", "Full transcripts, timestamps, latency, cues", "Readable only by your workspace and admins"],
            ["Knowledge", "Source text and chunks you connect", "Used only to answer your customers"],
            ["Audit log", "Actor, action, target, reason, time", "Admin-only, append-only"],
            ["Media", "Photos you upload, with uploader attribution", "Served from workspace storage"],
          ].map(([k, v, n], i) => (
            <div key={k} className={cn("grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-[1fr_1.6fr_1.4fr] md:items-center md:gap-4", i > 0 && "border-t border-white/10")}>
              <span className="text-[13.5px] font-semibold text-white">{k}</span>
              <span className="text-[13px] text-neutral-400">{v}</span>
              <span className="font-mono-dy text-[10.5px] leading-relaxed tracking-[0.06em] text-neutral-400">{n.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection num="02" eyebrow="Controls" title="How it is protected." dark>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProseBlock icon={Lock} title="Transport" body="TLS everywhere. Sessions are httpOnly cookies with hashed tokens." />
          <ProseBlock icon={KeyRound} title="Passwords" body="Scrypt with per-user salt. Nobody: including us: can read them." />
          <ProseBlock icon={Eye} title="Revocation" body="Blocking an account destroys its sessions on the next request, immediately." />
          <ProseBlock icon={ScrollText} title="Audit" body="Every admin action is append-only logged with actor and reason." />
        </div>
      </MarketingSection>
      <MarketingSection num="03" eyebrow="Boundaries" title="What we will never do.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ProseBlock icon={ShieldCheck} title="No training" body="Your conversations and knowledge never train models. This is enforced by provider configuration, not promises." />
          <ProseBlock icon={FileCheck} title="No resale" body="Your data is not a product. It exists to answer your customers, full stop." />
          <ProseBlock icon={Server} title="No silent access" body="Admin access is role-checked server-side on every request and every use is audit-logged." />
        </div>
      </MarketingSection>
      <PhotoBand
        img="/img/security-core.png"
        eyebrow="Under the shell"
        title="Security you can inspect, not just feel."
        note="Every claim on this page maps to a control in the code. Ask us to point at it."
        ctaLabel="Start building free"
      />
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- About ---------------- */

export function AboutPage() {
  const { settings, content } = useSite();
  const intro =
    content["about.intro"]?.visible && content["about.intro"]?.value
      ? content["about.intro"].value
      : "We are a communications engineering company. We build AI employees that speak, listen, remember, and act: for businesses that refuse to keep people waiting on hold.";
  return (
    <MarketingPageShell>
      <PageHero kicker="About" title={settings.siteName} intro={intro} />
      <MarketingSection num="01" eyebrow="Principles" title="The four rules we build by." lead="Short enough to memorize, strict enough to matter.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProseBlock icon={Eye} title="Honesty over polish" body="No fake numbers, no fake testimonials, no pretend features. If it is not built, it says so." />
          <ProseBlock icon={Hand} title="Humans stay in the loop" body="AI absorbs repetition; people get the conversations that need judgment, with full context." />
          <ProseBlock icon={ShieldCheck} title="Your data is yours" body="Isolated, auditable, exportable, deletable. Never a training set." />
          <ProseBlock icon={Timer} title="Latency is respect" body="Every reply shows its measured round-trip. We display the number that actually happened." />
        </div>
      </MarketingSection>
      <MarketingSection num="02" eyebrow="The honest page" title="Where we actually stand." lead="Live telemetry: the platform's real state, right now.">
        <StatRail dark={false} />
      </MarketingSection>
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy">
          <div className="tilt-3d">
            <div className="photo-frame aspect-[21/9]">
              <Image
                src="/img/team-studio.png"
                alt="The studio where DEYOUNG COMMUNICATION is built"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="photo-scrim" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <span className="eyebrow-dy text-gold">THE STUDIO</span>
                <h3 className="font-display mt-2 max-w-lg text-[clamp(1.3rem,2.4vw,1.8rem)] font-bold text-white">
                  Small, senior, allergic to hold music.
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Legal ---------------- */

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { settings } = useSite();
  const privacy = kind === "privacy";
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Legal"
        title={privacy ? "Privacy Policy" : "Terms of Service"}
        intro={
          privacy
            ? `What ${settings.siteName} collects, why, and the controls you have. Written to be read, not skimmed past.`
            : `The agreement between you and ${settings.siteName}: plain terms, plain obligations, no traps in the definitions.`
        }
      />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy max-w-3xl space-y-10">
          {(privacy
            ? [
                { t: "What we collect", b: "Account details (email, name, hashed password), organization settings, conversation transcripts, call metadata, knowledge you connect, and media you upload. That is the complete list." },
                { t: "Why we collect it", b: "To operate your workspace: authenticate you, answer your customers, show you what happened, and keep an audit trail. No secondary use exists." },
                { t: "Model training", b: "Your conversations and knowledge are never used to train models. Provider configuration enforces this." },
                { t: "Your controls", b: "Export transcripts and knowledge from Settings. Deletion requests remove your organization's data. Sessions are revocable instantly." },
                { t: "Retention", b: "Data lives while your account is active. Closed accounts are purged on request or within 90 days of deletion." },
              ]
            : [
                { t: "The service", b: `${settings.siteName} provides tooling to build and operate AI employees. The browser voice engine is included; telephony requires provider accounts you own.` },
                { t: "Your responsibilities", b: "You are responsible for the instructions and knowledge you give employees, for disclosure of AI use to your customers where law requires, and for your provider accounts." },
                { t: "Our responsibilities", b: "Operate the platform honestly, keep the audit trail intact, and never train on your data. Downtime is reported, not spun." },
                { t: "Fees", b: "Starter is free. Paid tiers bill monthly; provider usage passes through at cost. Cancel anytime: export first, we keep nothing hostage." },
                { t: "Liability", b: "The platform is provided as built. We are liable for gross negligence and nothing imagined beyond it. AI output is assistive; humans handle judgment calls." },
              ]
          ).map((s, i) => (
            <Reveal key={s.t} delay={i * 0.04}>
              <div className="hairline-b border-b border-white/10 pb-8">
                <div className="flex items-center gap-3">
                  <span className="font-mono-dy text-[11px] font-semibold tracking-[0.22em] text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[18px] font-bold tracking-[-0.01em] text-white">{s.t}</h3>
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-400">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Contact ---------------- */

export function ContactPage() {
  const { settings, content } = useSite();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", topic: "general" });
  const promise =
    content["contact.promise"]?.visible && content["contact.promise"]?.value
      ? content["contact.promise"].value
      : "A human replies within one business day. That is a promise we keep manually.";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Message received", description: "It is in the inbox of a real human." });
        setForm({ name: "", email: "", company: "", message: "", topic: "general" });
      } else {
        toast({ title: "Could not send", description: data.error ?? "Check the fields and try again.", variant: "destructive" });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <MarketingPageShell>
      <PageHero kicker="Contact" title="Talk to a human. Really." intro={promise} />
      <div className="border-t border-white/10 bg-ink-3 py-16 md:py-24">
        <div className="container-dy grid grid-cols-1 gap-12 lg:grid-cols-12">
          <form onSubmit={submit} className="space-y-5 lg:col-span-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-name" className="eyebrow-dy text-neutral-500">Name</Label>
                <Input id="c-name" required minLength={1} maxLength={80} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email" className="eyebrow-dy text-neutral-500">Email</Label>
                <Input id="c-email" type="email" required maxLength={200} value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="you@company.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-company" className="eyebrow-dy text-neutral-500">Company (optional)</Label>
              <Input id="c-company" maxLength={120} value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow-dy text-neutral-500">Topic</Label>
              <div className="flex flex-wrap gap-2">
                {["general", "sales", "support", "security"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, topic: t })}
                    className={cn(
                      "rounded-[2px] border px-4 py-2 font-mono-dy text-[11px] tracking-[0.1em] transition-colors ease-mechanical",
                      form.topic === t
                        ? "border-brand bg-brand/[0.05] text-brand"
                        : "border-white/15 text-neutral-500 hover:border-neutral-400",
                    )}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-msg" className="eyebrow-dy text-neutral-500">Message</Label>
              <Textarea id="c-msg" required minLength={10} maxLength={4000} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5}
                className="rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="What are you trying to build or solve?" />
            </div>
            <Button type="submit" disabled={pending}
              className="h-12 rounded-[2px] bg-brand px-7 text-[14px] font-semibold text-white transition-all ease-mechanical hover:bg-brand-dark hover:shadow-[0_12px_36px_-8px_rgba(10,91,196,0.5)]">
              {pending ? "Sending…" : "Send message"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-[4px] border border-white/10 bg-ink-2 p-6">
              <Mail className="h-5 w-5 text-brand" strokeWidth={1.8} />
              <p className="font-display mt-4 text-[15px] font-bold text-white">Direct email</p>
              <p className="mt-1.5 text-[13.5px] text-neutral-400">{settings.supportEmail}</p>
            </div>
            <div className="rounded-[4px] border border-white/10 bg-ink-2 p-6">
              <MapPin className="h-5 w-5 text-brand" strokeWidth={1.8} />
              <p className="font-display mt-4 text-[15px] font-bold text-white">Where we work</p>
              <p className="mt-1.5 text-[13.5px] text-neutral-400">Remote-first. The console is the office.</p>
            </div>
            <div className="rounded-[4px] border border-dashed border-white/15 p-6">
              <p className="font-mono-dy text-[10.5px] leading-relaxed tracking-[0.08em] text-neutral-400">
                NO CHATBOTS IN THE CONTACT FUNNEL · THIS FORM GOES TO A HUMAN INBOX, AND THE
                RESPONSE TIME PROMISE IS KEPT MANUALLY.
              </p>
            </div>
          </div>
        </div>
      </div>
      <CtaBand />
    </MarketingPageShell>
  );
}

/* ---------------- Auth pages (split layout) ---------------- */

function AuthShell({
  title,
  sub,
  children,
  foot,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  const { settings } = useSite();
  const reduced = useReducedMotion();
  return (
    <div className="flex min-h-screen bg-ink">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink text-white grain-dy lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 dy-grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 dy-radial-fade" aria-hidden="true" />
        <div className="relative">
          <SiteLockup siteName={settings.siteName} variant="light" size={26} />
        </div>
        <motion.div
          className="relative max-w-md"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-3">
            <span className="dy-status dy-status-live">
              <span className="dy-status-dot" />
            </span>
            <span className="eyebrow-dy text-neutral-500">THE VOICE STANDARD</span>
          </div>
          <p className="font-display-strong mt-6 text-[clamp(1.7rem,2.4vw,2.3rem)] leading-[1.05] tracking-[-0.03em] text-balance-dy">
            Your AI employee is <span className="text-brand">minutes</span> from picking up the line.
          </p>
          <p className="mt-5 text-[14px] leading-relaxed text-neutral-400">
            Build it, feed it your knowledge, take a test call in your browser: with real
            interruption, real emotion cues, and a real audit trail behind every turn.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono-dy text-[10.5px] tracking-[0.16em] text-neutral-400">
            <span>NO FAKE NUMBERS</span>
            <span className="text-brand">/</span>
            <span>BARGE-IN NATIVE</span>
            <span className="text-brand">/</span>
            <span>CANCEL ANYTIME</span>
          </div>
        </motion.div>
        <div className="relative font-mono-dy text-[10.5px] tracking-[0.18em] text-neutral-400">
          © {new Date().getFullYear()} {settings.siteName.toUpperCase()}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between lg:hidden">
          <SiteLockup siteName={settings.siteName} size={24} />
        </div>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-md">
            <h1 className="font-display-strong text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.04] tracking-[-0.03em] text-white">
              {title}
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-400">{sub}</p>
            <div className="mt-8">{children}</div>
            {foot && <div className="mt-6">{foot}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { navigate } = useDyRouter();
  const { login } = useSession();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await login(form.email, form.password);
      if (res.ok) {
        toast({ title: "Welcome back", description: "Your workspace is ready." });
        navigate(ROUTES.app);
      } else {
        setError(res.error ?? "Sign in failed");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      sub="Your employees kept working while you were away. Pick up where you left off."
      foot={
        <p className="text-[13.5px] text-neutral-400">
          New here?{" "}
          <button onClick={() => navigate(ROUTES.signup)} className="font-semibold text-brand transition-colors hover:text-brand-dark">
            Create an account
          </button>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-[3px] border border-brand/30 bg-brand/[0.05] px-4 py-3 text-[13px] leading-relaxed text-brand-dark">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="l-email" className="eyebrow-dy text-neutral-500">Email</Label>
          <Input id="l-email" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="l-pass" className="eyebrow-dy text-neutral-500">Password</Label>
          <Input id="l-pass" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="Your password" />
        </div>
        <Button type="submit" disabled={pending}
          className="h-12 w-full rounded-[2px] bg-brand text-[14px] font-semibold text-white transition-all ease-mechanical hover:bg-brand-dark hover:shadow-[0_12px_36px_-8px_rgba(10,91,196,0.5)]">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const { navigate } = useDyRouter();
  const { signup } = useSession();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationType: "business",
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await signup(form);
      if (res.ok) {
        toast({
          title: "Workspace created",
          description: "An administrator activates new accounts: you will see live status until then.",
        });
        navigate(ROUTES.app);
      } else {
        setError(res.error ?? "Sign up failed");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      sub="One minute to your first AI employee. An administrator activates new accounts: the status screen is honest about where you stand."
      foot={
        <p className="text-[13.5px] text-neutral-400">
          Already have an account?{" "}
          <button onClick={() => navigate(ROUTES.login)} className="font-semibold text-brand transition-colors hover:text-brand-dark">
            Sign in
          </button>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-[3px] border border-brand/30 bg-brand/[0.05] px-4 py-3 text-[13px] leading-relaxed text-brand-dark">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-name" className="eyebrow-dy text-neutral-500">Your name</Label>
            <Input id="s-name" required maxLength={80} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="First and last" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-org" className="eyebrow-dy text-neutral-500">Workspace name</Label>
            <Input id="s-org" required minLength={1} maxLength={120} value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="Your business" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-email" className="eyebrow-dy text-neutral-500">Work email</Label>
          <Input id="s-email" type="email" required maxLength={200} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-pass" className="eyebrow-dy text-neutral-500">Password: at least 8 characters</Label>
          <Input id="s-pass" type="password" required minLength={8} maxLength={200} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-11 rounded-[2px] border-white/15 focus-visible:ring-brand" placeholder="Create a password" />
        </div>
        <div className="space-y-2">
          <Label className="eyebrow-dy text-neutral-500">Workspace type</Label>
          <div className="flex flex-wrap gap-2">
            {["individual", "business", "agency"].map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, organizationType: t })}
                className={cn(
                  "rounded-[2px] border px-4 py-2.5 font-mono-dy text-[11px] tracking-[0.1em] transition-colors ease-mechanical",
                  form.organizationType === t
                    ? "border-brand bg-brand/[0.05] text-brand"
                    : "border-white/15 text-neutral-500 hover:border-neutral-400",
                )}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={pending}
          className="h-12 w-full rounded-[2px] bg-brand text-[14px] font-semibold text-white transition-all ease-mechanical hover:bg-brand-dark hover:shadow-[0_12px_36px_-8px_rgba(10,91,196,0.5)]">
          {pending ? "Creating…" : "Create workspace"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="font-mono-dy text-[10px] leading-relaxed tracking-[0.06em] text-neutral-400">
          BY CREATING AN ACCOUNT YOU AGREE TO THE TERMS AND PRIVACY POLICY · BOTH WRITTEN IN PLAIN
          LANGUAGE, BOTH LINKED IN THE FOOTER.
        </p>
      </form>
    </AuthShell>
  );
}
