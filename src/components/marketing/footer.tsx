"use client";

import { useDyRouter, ROUTES } from "@/lib/router";
import { useSite } from "@/hooks/use-site";
import { useSession } from "@/lib/session";
import { SiteLockup, Monogram } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SiteBanner } from "@/components/marketing/banner";
import { MarketingNav } from "@/components/marketing/nav";

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
      <div className="container-dy grid grid-cols-2 gap-10 py-14 md:grid-cols-5">
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
            <span className="dy-status dy-status-neutral text-neutral-400">
              <span className="dy-status-dot" />
              WHATSAPP: COMING SOON
            </span>
          </div>
        </div>
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
