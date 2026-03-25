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

function readDirRecursive(dir, baseDir = dir) {
  return fs.readdirSync(dir).map((name) => {
    const fullPath = path.join(dir, name);
    const isDir = fs.statSync(fullPath).isDirectory();
    const relativePath = path.relative(baseDir, fullPath);
    if (isDir) {
      return { name, path: relativePath, type: "folder", children: readDirRecursive(fullPath, baseDir) };
    }
    return {
      name,
      path: relativePath,
      type: "file",
      content: fs.readFileSync(fullPath, "utf8"),
    };
  });
}

function getContentType(req) {
  return req.headers["content-type"] || "";
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });
  });
}


const ALLOWED_TEMPLATES = ["node", "typescript", "react", "nextjs"];

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

 if (req.method === "POST" && req.url === "/create-project") {
    try {
      const { name, template } = await parseBody(req);

      if (!name || !template) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Missing fields" }));
      }

      if (!ALLOWED_TEMPLATES.includes(template)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: `Invalid template. Allowed: ${ALLOWED_TEMPLATES.join(", ")}` }));
      }

      const templatePath = path.join(__dirname, "templates", template);
      if (!fs.existsSync(templatePath)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: `Template folder not found: templates/${template}` }));
      }

      const projectId = uuidv4();
      const projectPath = path.join(__dirname, "projects", projectId);

      await fsExtra.mkdir(projectPath, { recursive: true });
      await fsExtra.copy(templatePath, projectPath);

      projects.set(projectId, { id: projectId, name, template, path: projectPath });

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ projectId }));

    } catch (err) {
      console.error("/create-project error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }

  
  else if (req.method === "GET" && req.url?.startsWith("/files/")) {
    try {
      const projectId = req.url.split("/")[2];

      if (!projectId) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Missing projectId" }));
      }

      const projectPath = path.join(__dirname, "projects", projectId);

      if (!fs.existsSync(projectPath)) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: "Project not found" }));
      }

      const files = readDirRecursive(projectPath);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ files }));

    } catch (err) {
      console.error("/files GET error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }

  
  else if (req.method === "PUT" && req.url?.startsWith("/files/")) {
    try {
      const parts = req.url.split("/"); 
      const projectId = parts[2];
      const filename = parts.slice(3).join("/"); 

      if (!projectId || !filename) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Missing projectId or filename" }));
      }

      const projectPath = path.join(__dirname, "projects", projectId);

      if (!fs.existsSync(projectPath)) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: "Project not found" }));
      }

      const { content } = await parseBody(req);

      if (typeof content !== "string") {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "content must be a string" }));
      }

      const filePath = path.join(projectPath, filename);


      if (!filePath.startsWith(projectPath)) {
        res.writeHead(403);
        return res.end(JSON.stringify({ error: "Forbidden" }));
      }

      await fsExtra.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, content, "utf8");

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));

    } catch (err) {
      console.error("/files PUT error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }


  else if (req.method === "POST" && req.url === "/run") {
    try {
      const { code, name, projectId } = await parseBody(req);
      const projectPath = path.join(__dirname , "projects" , projectId)

      const tmpFile = path.join( projectPath, name || "__run_tmp__.js");
      
      fs.writeFileSync(tmpFile, code);
      res.end(JSON.stringify({ ok: true, path: tmpFile }));
    } catch (err) {
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