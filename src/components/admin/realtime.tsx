"use client";

/**
 * Admin realtime layer: socket.io through the sandbox gateway
 * (io("/?XTransformPort=3003")). Honest degradation: if the socket is down,
 * views fall back to SWR polling and the header chip says so.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type AdminEvent = {
  event: string;
  payload: Record<string, unknown> | null;
  at: string;
};

const WATCHED = [
  "user:created",
  "user:status",
  "user:role",
  "call:started",
  "call:turn",
  "call:coached",
  "call:ended",
  "contact:new",
  "content:updated",
  "settings:updated",
  "media:updated",
] as const;

type RealtimeCtx = {
  connected: boolean;
  events: AdminEvent[];
  lastEvent: AdminEvent | null;
};

const Ctx = createContext<RealtimeCtx>({
  connected: false,
  events: [],
  lastEvent: null,
});

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<AdminEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let socket: Socket;
    try {
      socket = io("/?XTransformPort=3003", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1200,
        reconnectionAttempts: 20,
        timeout: 8000,
      });
    } catch {
      return;
    }
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    for (const ev of WATCHED) {
      socket.on(ev, (payload: Record<string, unknown> | null) => {
        const at =
          payload && typeof payload.at === "string" ? payload.at : new Date().toISOString();
        const entry: AdminEvent = { event: ev, payload, at };
        setEvents((prev) => [entry, ...prev].slice(0, 80));
        setLastEvent(entry);
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <Ctx.Provider value={{ connected, events, lastEvent }}>{children}</Ctx.Provider>
  );
}

export function useAdminRealtime() {
  return useContext(Ctx);
}
