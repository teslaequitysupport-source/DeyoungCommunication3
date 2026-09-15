/**
 * DEYOUNG COMMUNICATION — realtime event service.
 * - Port 3003: socket.io engine at path "/" (frontend connects via gateway: io("/?XTransformPort=3003"))
 * - Port 3004: internal HTTP POST /emit — called by Next.js API routes on every mutation
 *   (localhost only; never exposed through the gateway)
 */
import { Server } from "socket.io";
import { createServer } from "http";

const SOCKET_PORT = 3003;
const EMIT_PORT = 3004;

// --- Socket engine (3003) ---
const socketServer = createServer();
const io = new Server(socketServer, {
  // Path must stay "/" — the sandbox gateway forwards by XTransformPort only.
  path: "/",
  cors: { origin: true, credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  socket.emit("hello", { service: "dy-realtime", at: new Date().toISOString() });
});

socketServer.listen(SOCKET_PORT, () => {
  console.log(`[dy-realtime] socket.io listening on :${SOCKET_PORT}`);
});

// --- Internal emit endpoint (3004, localhost) ---
const emitServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { event, payload } = JSON.parse(body);
        if (typeof event === "string") {
          io.emit(event, payload ?? null);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, event }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "missing event" }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "bad json" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

emitServer.listen(EMIT_PORT, "127.0.0.1", () => {
  console.log(`[dy-realtime] emit endpoint on 127.0.0.1:${EMIT_PORT}`);
});
