"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { SessionUser } from "./types";

type SessionCtx = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    organizationType: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error ?? "Sign in failed" };
  }, []);

  const signup = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      organizationName: string;
      organizationType: string;
    }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Sign up failed" };
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, refresh, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
