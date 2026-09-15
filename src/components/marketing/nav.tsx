"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useDyRouter, ROUTES } from "@/lib/router";
import { useSite } from "@/hooks/use-site";
import { SiteLockup, Monogram } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown, ShieldCheck } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

const PRODUCT_LINKS = [
  { href: ROUTES.productEmployees, label: "AI Employees", desc: "Receptionist, sales, support, scheduling" },
  { href: ROUTES.productVoice, label: "Voice Engine", desc: "Streaming pipeline built for interruption" },
  { href: ROUTES.productKnowledge, label: "Knowledge", desc: "Answers grounded in your documents" },
  { href: ROUTES.productChannels, label: "Channels", desc: "Web chat today, phone + SMS in production" },
];

const SOLUTION_LINKS = [
  { href: ROUTES.solutionsIndividuals, label: "Individuals" },
  { href: ROUTES.solutionsBusiness, label: "Businesses" },
  { href: ROUTES.solutionsAgencies, label: "Agencies" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { navigate, is } = useDyRouter();
  return (
    <button
      onClick={() => navigate(href)}
      className={cn(
        "relative py-2 text-[13.5px] font-medium text-neutral-200 transition-colors ease-mechanical hover:text-brand",
        is(href) && "text-white",
      )}
    >
      {children}
      {is(href) && <span className="absolute inset-x-0 -bottom-px h-[1.5px] bg-brand" />}
    </button>
  );
}

function ProductMenu() {
  const [open, setOpen] = useState(false);
  const { navigate } = useDyRouter();
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => navigate(ROUTES.product)}
        className="flex items-center gap-1 py-2 text-[13.5px] font-medium text-neutral-200 transition-colors ease-mechanical hover:text-brand"
        aria-expanded={open}
      >
        Product
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform ease-mechanical", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-3">
          <div className="hairline-t rounded-[3px] border border-white/10 bg-ink-3 p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]">
            {PRODUCT_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => {
                  setOpen(false);
                  navigate(l.href);
                }}
                className="group flex w-full items-start gap-3 rounded-[3px] p-3 text-left transition-colors ease-mechanical hover:bg-white/5"
              >
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-white/25 transition-colors group-hover:bg-brand" />
                <span>
                  <span className="block text-[13.5px] font-semibold text-white">{l.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500">{l.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useSession();
  const { settings } = useSite();
  const { navigate } = useDyRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = user?.accountRole === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 ease-mechanical",
        scrolled
          ? "border-b border-white/10 bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-dy flex h-16 items-center justify-between gap-3 sm:gap-6">
        <button
          onClick={() => navigate(ROUTES.home)}
          className="flex min-w-0 items-center gap-3"
          aria-label={`${settings.siteName} home`}
        >
          <SiteLockup siteName={settings.siteName} />
        </button>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <ProductMenu />
          <NavLink href={ROUTES.solutions}>Solutions</NavLink>
          {settings.flagShowPricing && <NavLink href={ROUTES.pricing}>Pricing</NavLink>}
          <NavLink href={ROUTES.security}>Security</NavLink>
          <NavLink href={ROUTES.about}>About</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="hidden items-center gap-1.5 font-mono-dy text-[11px] font-medium tracking-[0.12em] text-neutral-400 transition-colors hover:text-brand md:flex"
              title="Admin console"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              ADMIN
            </button>
          )}
          {user ? (
            <Button
              size="sm"
              onClick={() => navigate(ROUTES.app)}
              className="btn-glass h-9 px-4 text-[13px]"
            >
              Open dashboard
            </Button>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.login)}
                className="hidden text-[13.5px] font-medium text-neutral-400 transition-colors ease-mechanical hover:text-white sm:block"
              >
                Sign in
              </button>
              <Button
                size="sm"
                onClick={() => navigate(ROUTES.signup)}
                className="btn-flare h-9 px-5 text-[13px]"
              >
                Start building
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-white/10 bg-ink-3 p-0">
              <SheetTitle>
                <VisuallyHidden>Navigation menu</VisuallyHidden>
              </SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
                  <Monogram size={22} />
                  <span className="font-display text-[13px] font-bold tracking-[0.08em]">
                    {settings.siteName}
                  </span>
                </div>
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Mobile">
                  {[...PRODUCT_LINKS.map((l) => ({ href: l.href, label: l.label })), ...SOLUTION_LINKS].map(
                    (l) => (
                      <button
                        key={l.href}
                        onClick={() => navigate(l.href)}
                        className="rounded-[3px] px-3 py-2.5 text-left text-[14px] font-medium text-neutral-300 hover:bg-white/5"
                      >
                        {l.label}
                      </button>
                    ),
                  )}
                  {settings.flagShowPricing && (
                    <button
                      onClick={() => navigate(ROUTES.pricing)}
                      className="rounded-[3px] px-3 py-2.5 text-left text-[14px] font-medium text-neutral-300 hover:bg-white/5"
                    >
                      Pricing
                    </button>
                  )}
                  {[
                    { href: ROUTES.security, label: "Security" },
                    { href: ROUTES.about, label: "About" },
                    { href: ROUTES.resources, label: "Resources" },
                  ].map((l) => (
                    <button
                      key={l.href}
                      onClick={() => navigate(l.href)}
                      className="rounded-[3px] px-3 py-2.5 text-left text-[14px] font-medium text-neutral-300 hover:bg-white/5"
                    >
                      {l.label}
                    </button>
                  ))}
                </nav>
                <div className="hairline-t space-y-2 border-t p-4">
                  {user ? (
                    <Button
                      onClick={() => navigate(ROUTES.app)}
                      className="w-full rounded-[2px] bg-ink text-[13px] font-semibold text-white hover:bg-brand"
                    >
                      Open dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => navigate(ROUTES.signup)}
                        className="w-full rounded-[2px] bg-brand text-[13px] font-semibold text-white hover:bg-brand-dark"
                      >
                        Start building
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(ROUTES.login)}
                        className="w-full rounded-[2px] border-white/15 text-[13px] font-semibold"
                      >
                        Sign in
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => navigate("/admin")}
                      className="w-full rounded-[2px] border-white/15 text-[12px] font-medium text-neutral-500"
                    >
                      Admin console
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
