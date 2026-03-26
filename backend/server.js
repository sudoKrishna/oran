import { WebSocketServer } from "ws";
import pty from "node-pty";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  // ── POST /run ─────────────────────────────────────────────────────────────
  // Writes code to a temp file on disk so the PTY terminal can execute it.
  // All file persistence now lives in Next.js API routes → Prisma → Neon.
  if (req.method === "POST" && req.url === "/run") {
    try {
      const { code, name, projectId } = await parseBody(req);

      if (!code || !projectId) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Missing code or projectId" }));
      }

      const tmpDir = path.join(__dirname, "tmp", projectId);
      fs.mkdirSync(tmpDir, { recursive: true });

      const tmpFile = path.join(tmpDir, name || "__run_tmp__.js");
      fs.writeFileSync(tmpFile, code, "utf8");

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, path: tmpFile }));
    } catch (err) {
      console.error("/run error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }

  else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(8081, () => console.log("HTTP running on http://localhost:8081"));

// ─── WebSocket / PTY terminal ─────────────────────────────────────────────────

const wss = new WebSocketServer({ port: 8080 });
console.log("WS running on ws://localhost:8080");

wss.on("connection", (ws) => {
  const shell = process.platform === "win32" ? "powershell.exe" : "bash";

  const term = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  term.onData((data) => ws.send(data));
  ws.on("message", (msg) => term.write(msg.toString()));
  ws.on("close", () => term.kill());
});