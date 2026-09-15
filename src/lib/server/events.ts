/**
 * Realtime event bus → socket.io mini-service (port 3003).
 * Fire-and-forget: if the service is down, mutations still succeed (honest degradation).
 */
const REALTIME_URL = "http://127.0.0.1:3004/emit";

export type RealtimeEvent =
  | "user:created"
  | "user:status"
  | "user:role"
  | "user:plan"
  | "call:started"
  | "call:turn"
  | "call:coached"
  | "call:ended"
  | "contact:new"
  | "content:updated"
  | "settings:updated"
  | "media:updated";

export async function emitRealtime(event: RealtimeEvent, payload: unknown) {
  try {
    await fetch(REALTIME_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // Socket service offline: polling fallback covers the admin console.
  }
}
