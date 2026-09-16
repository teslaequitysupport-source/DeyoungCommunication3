"use client";

import { useDyRouter, ROUTES } from "@/lib/router";
import { useSite } from "@/hooks/use-site";
import { useSession } from "@/lib/session";
import { SiteLockup, Monogram } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SiteBanner } from "@/components/marketing/banner";
import { MarketingNav } from "@/components/marketing/nav";

/* ---------------- Social bar: real platform links ---------------- */

const SOCIALS = [
  {
    label: "X",
    href: "https://x.com/deyoungcommunication",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/deyoungcommunication",
    path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.028 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/deyoungcommunication",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.878a6.122 6.122 0 100 12.244 6.122 6.122 0 000-12.244zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/deyoungcommunication",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@deyoungcommunication",
    path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
];

function SocialBar({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="Social media">
      <h3 className="eyebrow-dy text-neutral-500">Follow the signal</h3>
      <div className="mt-4 flex items-center gap-2.5">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} (opens in a new tab)`}
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-neutral-400 transition-all ease-mechanical hover:-translate-y-0.5 hover:border-[#4A90E2]/50 hover:bg-[#4A90E2]/10 hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(10,91,196,0.6)]"
          >
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  const { navigate } = useDyRouter();
  return (
    <div>
      <h3 className="eyebrow-dy text-neutral-400">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <button
              onClick={() => navigate(l.href)}
              className="text-[13.5px] text-neutral-400 transition-colors ease-mechanical hover:text-brand"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  const { settings } = useSite();
  const { navigate } = useDyRouter();

  return (
    <footer className="mt-auto bg-ink text-white">
      {/* CTA band */}
      <div className="hairline-b border-b border-white/8">
        <div className="container-dy flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center md:py-20">
          <div>
            <p className="eyebrow-dy text-neutral-500">Ready when you are</p>
            <h2 className="font-display-strong mt-4 max-w-xl text-3xl leading-[1.04] text-balance-dy md:text-[2.6rem]">
              Your first AI employee is <span className="text-flare">minutes</span> from picking up.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate(ROUTES.signup)}
              className="btn-flare h-11 px-7 text-[14px]"
            >
              Start building free
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.contact)}
              className="btn-glass h-11 px-6 text-[14px]"
            >
              Talk to a human
            </Button>
          </div>
        </div>
      </div>

      {/* Link grid */}
      <div className="container-dy grid grid-cols-2 gap-10 py-14 md:grid-cols-6">
        <FooterColumn
          title="Product"
          links={[
            { href: ROUTES.productEmployees, label: "AI Employees" },
            { href: ROUTES.productVoice, label: "Voice Engine" },
            { href: ROUTES.productKnowledge, label: "Knowledge" },
            { href: ROUTES.productChannels, label: "Channels" },
            { href: ROUTES.productIntegrations, label: "Integrations" },
          ]}
        />
        <FooterColumn
          title="Solutions"
          links={[
            { href: ROUTES.solutionsIndividuals, label: "Individuals" },
            { href: ROUTES.solutionsBusiness, label: "Businesses" },
            { href: ROUTES.solutionsAgencies, label: "Agencies" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: ROUTES.about, label: "About" },
            { href: ROUTES.security, label: "Security" },
            { href: settings.flagShowPricing ? ROUTES.pricing : ROUTES.about, label: "Pricing" },
            { href: ROUTES.contact, label: "Contact" },
          ]}
        />
        <FooterColumn
          title="Resources"
          links={[
            { href: ROUTES.resourcesDocs, label: "Documentation" },
            { href: ROUTES.resourcesGuides, label: "Guides" },
            { href: ROUTES.resourcesChangelog, label: "Changelog" },
            { href: ROUTES.developers, label: "Developers" },
          ]}
        />
        <div>
          <h3 className="eyebrow-dy text-neutral-500">Status</h3>
          <div className="mt-4 space-y-2.5">
            <span className="dy-status dy-status-connected text-neutral-300">
              <span className="dy-status-dot" />
              WEB CHAT: LIVE
            </span>
            <span className="dy-status dy-status-neutral text-neutral-400">
              <span className="dy-status-dot" />
              PHONE: SETUP REQUIRED
            </span>
            <a
              href="https://wa.me/?text=Hello%20DEYOUNG%20COMMUNICATION%2C%20I%20want%20to%20talk%20about%20AI%20employees."
              target="_blank"
              rel="noopener noreferrer"
              className="dy-status dy-status-live block w-fit text-neutral-300 transition-opacity hover:opacity-80"
              aria-label="Open WhatsApp click-to-chat (opens in a new tab)"
            >
              <span className="dy-status-dot" />
              WHATSAPP: CLICK TO CHAT
            </a>
          </div>
        </div>
        <SocialBar />
      </div>

      {/* Giant wordmark */}
      <div className="hairline-t overflow-hidden border-t border-white/8">
        <div className="container-dy py-10">
          <p
            className="font-display-strong select-none leading-[0.9] tracking-[-0.05em] text-white/[0.07]"
            style={{ fontSize: "clamp(2.6rem, 9.2vw, 8.6rem)" }}
            aria-hidden="true"
          >
            {settings.siteName}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="hairline-t border-t border-white/8">
        <div className="container-dy flex flex-col items-start justify-between gap-3 py-5 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <Monogram size={18} className="text-white" redBar />
            <span className="font-mono-dy text-[11px] tracking-[0.14em] text-neutral-500">
              {settings.tagline.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-5 font-mono-dy text-[11px] tracking-[0.08em] text-neutral-500">
            <button onClick={() => navigate("/legal/privacy")} className="transition-colors hover:text-neutral-300">
              PRIVACY
            </button>
            <button onClick={() => navigate("/legal/terms")} className="transition-colors hover:text-neutral-300">
              TERMS
            </button>
            <span>© {new Date().getFullYear()} {settings.siteName}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Standard marketing page: banner + nav + content + footer, sticky-footer safe. */
export function MarketingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <SiteBanner />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export { SiteBanner };

export function CtaBand() {
  const { navigate } = useDyRouter();
  const { user } = useSession();
  return (
    <section className="border-t border-white/10 bg-ink-2">
      <div className="container-dy flex flex-col items-center py-16 text-center">
        <p className="eyebrow-dy text-neutral-500">No credit card, no lock-in</p>
        <h2 className="font-display-strong mt-4 max-w-2xl text-3xl leading-[1.05] text-balance-dy md:text-4xl">
          Put your first AI employee on the line.
        </h2>
        <Button
          onClick={() => navigate(user ? ROUTES.app : ROUTES.signup)}
          className="btn-flare mt-8 h-11 px-7 text-[14px]"
        >
          {user ? "Open dashboard" : "Start building free"}
        </Button>
      </div>
    </section>
  );
}
