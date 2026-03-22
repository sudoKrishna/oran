import { WebSocketServer } from "ws";
import pty from "node-pty";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import fsExtra from "fs-extra";

const projects = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST ,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  if (req.method === "POST" && req.url === "/create-project") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", async () => {
      try {
        const { name, template } = JSON.parse(body);


        if (!name || !template) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Missing fields" }));
        }

        const allowedTemplates = ["node"];
        if (!allowedTemplates.includes(template)) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Invalid template" }));
        }


        const projectId = uuidv4();


        const projectPath = path.join(__dirname, "projects", projectId);
        const templatePath = path.join(__dirname, "templates", template);


        if (!fs.existsSync(templatePath)) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Template not found" }));
        }


        await fsExtra.mkdir(projectPath, { recursive: true });
        await fsExtra.copy(templatePath, projectPath);


        projects.set(projectId, {
  id: projectId,
  name,
  template,
  path: projectPath,
});
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ projectId }));


      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error:  "error" }));
      }
    });
  } else if (req.method === "POST" && req.url === "/run") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { code, name } = JSON.parse(body);
      const tmpFile = path.join(__dirname, name || "__run_tmp__.js");
      fs.writeFileSync(tmpFile, code);
      res.end(JSON.stringify({ ok: true, path: tmpFile }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
})
httpServer.listen(8081, () => console.log("HTTP running on http://localhost:8081"));

const wss = new WebSocketServer({ port: 8080 });

console.log("WS running on ws://localhost:8080");

wss.on("connection", (ws) => {
  const shell = process.platform === "win32"
    ? "powershell.exe"
    : "bash";

  const term = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Terminal → frontend
  term.onData((data) => {
    ws.send(data);
  });

  // Frontend → terminal
  ws.on("message", (msg) => {
    term.write(msg);
  });

  ws.on("close", () => {
    term.kill();
  });
});