import { WebSocketServer } from "ws";
import pty from "node-pty";
import http from "http";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

// ─── Container Management ────────────────────────────────────────────────────

const PROJECT_IMAGE = process.env.SANDBOX_IMAGE || "node:20-alpine";
const CONTAINER_PREFIX = "sandbox_";
const CONTAINER_TTL_MS = 30 * 60 * 1000; // 30 minutes idle timeout

// Track active containers: projectId → { name, lastActive, activeTerminals }
const containers = new Map();

async function ensureContainer(projectId) {
  const containerName = `${CONTAINER_PREFIX}${projectId}`;

  // Check if already tracked and running
  if (containers.has(projectId)) {
    const entry = containers.get(projectId);
    entry.lastActive = Date.now();

    // Verify it's actually still running
    try {
      await execAsync(`docker inspect -f "{{.State.Running}}" ${containerName}`);
      return containerName;
    } catch {
      // Container died — fall through to recreate
      containers.delete(projectId);
    }
  }

  // Check if container exists but isn't tracked (e.g. server restart)
  try {
    const { stdout } = await execAsync(
      `docker inspect -f "{{.State.Running}}" ${containerName}`
    );
    if (stdout.trim() === "true") {
      containers.set(projectId, {
        name: containerName,
        lastActive: Date.now(),
        activeTerminals: 0,
      });
      return containerName;
    }
    // Exists but stopped — remove it
    await execAsync(`docker rm -f ${containerName}`).catch(() => { });
  } catch {
    // Doesn't exist yet — that's fine
  }

  // Spin up a fresh container
  console.log(`[docker] Starting container for project: ${projectId}`);
  await execAsync(
    `docker run -d --name ${containerName} \
      --memory="256m" --cpus="0.5" \
      --network none \
      --restart=no \
      ${PROJECT_IMAGE} \
      tail -f /dev/null`
  );

  containers.set(projectId, {
    name: containerName,
    lastActive: Date.now(),
    activeTerminals: 0,
  });

  return containerName;
}

async function destroyContainer(projectId) {
  const containerName = `${CONTAINER_PREFIX}${projectId}`;
  console.log(`[docker] Destroying container for project: ${projectId}`);
  await execAsync(`docker rm -f ${containerName}`).catch(() => { });
  containers.delete(projectId);
}

// Reap idle containers every 5 minutes
setInterval(async () => {
  const now = Date.now();
  for (const [projectId, entry] of containers.entries()) {
    if (entry.activeTerminals === 0 && now - entry.lastActive > CONTAINER_TTL_MS) {
      await destroyContainer(projectId);
    }
  }
}, 5 * 60 * 1000);

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  // Write a file directly into the container via stdin — no host tmp files
  if (req.method === "POST" && req.url === "/run") {
    try {
      const { code, name, projectId } = await parseBody(req);

      if (!code || !projectId) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Missing code or projectId" }));
      }

      const containerName = await ensureContainer(projectId);
      const fileName = name || "__run_tmp__.js";
      const containerPath = `/workspace/${fileName}`;

      // Ensure /workspace exists inside the container
      await execAsync(`docker exec ${containerName} mkdir -p /workspace`);

      // Pipe code directly into the container via `docker exec ... tee`
      // No host filesystem involved at all
      await new Promise((resolve, reject) => {
        const proc = spawn("docker", [
          "exec", "-i", containerName,
          "sh", "-c", `tee "${containerPath}" > /dev/null`,
        ]);
        proc.stdin.write(code, "utf8");
        proc.stdin.end();
        proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`tee exited ${code}`)));
        proc.on("error", reject);
      });

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, path: containerPath, container: containerName }));
    } catch (err) {
      console.error("/run error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message || "Server error" }));
    }
    return;
  }

  // Destroy a project's container
  if (req.method === "DELETE" && req.url?.startsWith("/container/")) {
    const projectId = req.url.split("/container/")[1];
    if (!projectId) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "Missing projectId" }));
    }
    await destroyContainer(projectId);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.listen(8081, () => console.log("HTTP running on http://localhost:8081"));

// ─── WebSocket Terminal ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: 8080 });
console.log("WS running on ws://localhost:8080");

wss.on("connection", (ws, req) => {
  // Expect: ws://localhost:8080?projectId=abc123
  const url = new URL(req.url, "http://localhost");
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    ws.send("\r\n\x1b[31m[error] No projectId provided\x1b[0m\r\n");
    ws.close();
    return;
  }

  let term = null;

  ensureContainer(projectId)
    .then((containerName) => {
      const entry = containers.get(projectId);
      if (entry) entry.activeTerminals++;

      console.log(`[ws] Terminal attached → ${containerName}`);

      // ← THE KEY CHANGE: spawn into the container instead of bare bash
      term = pty.spawn("docker", ["exec", "-it", containerName, "/bin/sh"], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
      });

      term.onData((data) => {
        if (ws.readyState === ws.OPEN) ws.send(data);
      });

      ws.on("message", (msg) => {
        // Handle resize messages: { type: "resize", cols, rows }
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === "resize" && parsed.cols && parsed.rows) {
            term.resize(parsed.cols, parsed.rows);
            return;
          }
        } catch {
          // Not JSON — treat as terminal input
        }
        term.write(msg.toString());
      });

      ws.on("close", () => {
        term?.kill();
        const entry = containers.get(projectId);
        if (entry) {
          entry.activeTerminals = Math.max(0, entry.activeTerminals - 1);
          entry.lastActive = Date.now();
        }
        console.log(`[ws] Terminal detached ← ${containerName}`);
      });

      ws.on("error", () => term?.kill());
    })
    .catch((err) => {
      console.error("[ws] Container error:", err);
      ws.send(`\r\n\x1b[31m[error] Failed to start container: ${err.message}\x1b[0m\r\n`);
      ws.close();
    });
});