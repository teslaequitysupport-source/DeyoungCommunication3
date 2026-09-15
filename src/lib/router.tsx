"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type DyRoute = string[];

function parseHash(hash: string): DyRoute {
  const raw = hash.replace(/^#/, "");
  if (!raw || raw === "/") return [];
  const parts = raw.split("/").filter(Boolean);
  return parts;
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
  // The real hash route applies after hydration (effect), avoiding mismatches.
  const [path, setPath] = useState<DyRoute>([]);

  useEffect(() => {
    const onHash = () => setPath(parseHash(window.location.hash));
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((to: string) => {
    const target = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`;
    if (window.location.hash === target) return;
    window.location.hash = target;
    // hashchange fires only when hash actually changes
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
