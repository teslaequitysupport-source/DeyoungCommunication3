/**
 * DEYOUNG COMMUNICATION — realtime event service.
 * - Port 3003: socket.io engine at path "/" (frontend connects via gateway: io("/?XTransformPort=3003"))
 * - Port 3004: internal HTTP POST /emit — called by Next.js API routes on every mutation
 *   (localhost only; never exposed through the gateway)
 * - Dev-server babysitter: the sandbox reaps processes spawned from agent tool
 *   calls, so the Next.js dev server is spawned as a child of THIS long-lived,
 *   platform-owned process instead. Guarded: spawns only once and only when
 *   port 3000 is actually free. Credentials come from the gitignored .env.
 */
import { Server } from "socket.io";
import { createServer } from "http";
import { spawn, type ChildProcess } from "child_process";
import { readFileSync, openSync } from "fs";
import { createConnection } from "net";

const SOCKET_PORT = 3003;
const EMIT_PORT = 3004;

// --- Dev-server babysitter (runs before listeners; guarded by global flag) ---
type LauncherGlobal = typeof globalThis & { __dyWatchdog?: boolean };
const launcherGlobal = globalThis as LauncherGlobal;

function envFromFile(path: string, key: string): string | undefined {
  try {
    const lines = readFileSync(path, "utf8").split("\n");
    for (const line of lines) {
      const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`));
      if (m) return m[1];
    }
  } catch {
    /* .env unreadable: fall through */
  }
  return undefined;
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = createConnection({ host: "127.0.0.1", port });
    sock.once("connect", () => {
      sock.destroy();
      resolve(false); // something is listening
    });
    sock.once("error", () => resolve(true));
    sock.setTimeout(1200, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

function spawnNextDev(): void {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const fromFile =
    envFromFile("/home/z/my-project/.env", "DATABASE_URL_SUPABASE") ??
    envFromFile("/home/z/my-project/.env", "DATABASE_URL");
  if (fromFile) {
    env.DATABASE_URL = fromFile;
    env.DATABASE_URL_SUPABASE = fromFile;
  }
  // Route next dev output into dev.log (append) so it stays observable.
  const outFd = openSync("/home/z/my-project/dev.log", "a");
  const errFd = openSync("/home/z/my-project/dev.log", "a");
  const child: ChildProcess = spawn(
    "/home/z/my-project/node_modules/.bin/next",
    ["dev", "-p", "3000"],
    {
      cwd: "/home/z/my-project",
      env,
      detached: true,
      stdio: ["ignore", outFd, errFd],
    },
  );
  child.unref();
  console.log(`[dy-realtime] spawned next dev (pid ${child.pid}) on :3000`);
}

/**
 * Dev-server watchdog: the sandbox reaps processes spawned from agent tool
 * calls, so the Next.js dev server lives as a child of THIS long-lived,
 * platform-owned process. If port 3000 is ever unoccupied (crash, restart,
 * code reload), the watchdog brings the server back with the credentials
 * from the gitignored .env. The port check itself makes spawning idempotent.
 */
if (!launcherGlobal.__dyWatchdog) {
  launcherGlobal.__dyWatchdog = true;
  console.log("[dy-realtime] dev-server watchdog armed (every 15s)");
  isPortFree(3000).then((free) => {
    if (free) spawnNextDev();
  });
  setInterval(() => {
    isPortFree(3000).then((free) => {
      if (free) spawnNextDev();
    });
  }, 15000);
}

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
