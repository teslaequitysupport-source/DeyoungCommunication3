"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type DyRoute = string[];

function parseHash(hash: string): DyRoute {
  const raw = hash.replace(/^#/, "");
  if (!raw || raw === "/") return [];
  const parts = raw.split("/").filter(Boolean);
  return parts;
}

function parsePathname(pathname: string): DyRoute {
  if (!pathname || pathname === "/") return [];
  return pathname.split("/").filter(Boolean);
}

type RouterCtx = {
  path: DyRoute;
  navigate: (to: string) => void;
  is: (prefix: string) => boolean;
};

const Ctx = createContext<RouterCtx>({
  path: [],
  navigate: () => {},
  is: () => false,
});

export function DyRouterProvider({ children }: { children: React.ReactNode }) {
  // Initial state is [] so SSR and the first client render match exactly.
  // The real route applies after hydration (effect), avoiding mismatches.
  const [path, setPath] = useState<DyRoute>([]);

  useEffect(() => {
    const readRoute = () => {
      // Prefer an explicit hash route (legacy #/ links keep working);
      // otherwise fall back to the clean URL pathname (direct loads,
      // shared links, crawlers).
      if (window.location.hash && window.location.hash !== "#") {
        setPath(parseHash(window.location.hash));
      } else {
        setPath(parsePathname(window.location.pathname));
      }
    };
    readRoute();

    const onHash = () => {
      setPath(parseHash(window.location.hash));
      // Keep the visible URL clean: /#/pricing -> /pricing
      if (window.location.hash && window.location.hash !== "#") {
        const clean = window.location.hash.replace(/^#/, "");
        if (clean.startsWith("/")) {
          window.history.replaceState(null, "", clean);
        }
      }
    };
    const onPop = () => readRoute();

    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    const clean = to.startsWith("#")
      ? to.slice(1)
      : to;
    const target = clean.startsWith("/") ? clean : `/${clean}`;
    if (window.location.pathname === target) return;
    // Push a clean URL; popstate listener updates the route state.
    window.history.pushState(null, "", target);
    setPath(parsePathname(target));
    window.scrollTo({ top: 0 });
  }, []);

  const is = useCallback(
    (prefix: string) => {
      const pp = prefix.split("/").filter(Boolean);
      if (pp.length === 0) return path.length === 0;
      return pp.every((seg, i) => path[i] === seg);
    },
    [path],
  );

  return <Ctx.Provider value={{ path, navigate, is }}>{children}</Ctx.Provider>;
}

export function useDyRouter() {
  return useContext(Ctx);
}

/** Full route table used by nav links and active states. */
export const ROUTES = {
  home: "/",
  product: "/product",
  productEmployees: "/product/ai-employees",
  productVoice: "/product/voice",
  productConversations: "/product/conversations",
  productChannels: "/product/channels",
  productKnowledge: "/product/knowledge",
  productAutomations: "/product/automations",
  productIntegrations: "/product/integrations",
  solutions: "/solutions",
  solutionsIndividuals: "/solutions/individuals",
  solutionsBusiness: "/solutions/business",
  solutionsAgencies: "/solutions/agencies",
  voiceStudio: "/voice-studio",
  developers: "/developers",
  resources: "/resources",
  resourcesGuides: "/resources/guides",
  resourcesDocs: "/resources/documentation",
  resourcesChangelog: "/resources/changelog",
  pricing: "/pricing",
  security: "/security",
  about: "/about",
  contact: "/contact",
  login: "/login",
  signup: "/signup",
  legalPrivacy: "/legal/privacy",
  legalTerms: "/legal/terms",
  admin: "/admin",
  app: "/app",
  appEmployees: "/app/employees",
  appLiveCalls: "/app/live-calls",
  appInbox: "/app/inbox",
  appCustomers: "/app/customers",
  appKnowledge: "/app/knowledge",
  appVoiceStudio: "/app/voice-studio",
  appAutomations: "/app/automations",
  appIntegrations: "/app/integrations",
  appAnalytics: "/app/analytics",
  appSettings: "/app/settings",
} as const;
