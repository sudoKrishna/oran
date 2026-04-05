const { WebSocketServer } = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const http = require("http");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;


const rooms = new Map();

function getUserFromRequest(req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      id: payload.id,
      name: payload.name || null,
      email: payload.email || null,
    };
  } catch {
    return null;
  }
}

function broadcastPresence(projectId) {
  const room = rooms.get(projectId);
  if (!room) return;

  const users = [...room].map(({ name, email, userId }) => ({
    userId,
    name,
    email,
  }));

  const message = JSON.stringify({ type: "presence", users });

  for (const { ws } of room) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}


const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = new URL(req.url, "http://localhost");

  
  if (req.method === "GET" && url.pathname.startsWith("/presence/")) {
    const projectId = url.pathname.split("/presence/")[1];
    const room = rooms.get(projectId);
    const users = room
      ? [...room].map(({ name, email, userId }) => ({ userId, name, email }))
      : [];
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ projectId, users }));
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.PORT || 1234;


httpServer.listen(PORT, () =>
  console.log(`Presence HTTP running on http://localhost:${PORT}`)
);


const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    ws.close();
    return;
  }


  const user = getUserFromRequest(req);
  const userId = user?.id || `anon_${Math.random().toString(36).slice(2, 8)}`;
  const name = user?.name || null;
  const email = user?.email || null;

  if (!rooms.has(projectId)) rooms.set(projectId, new Set());
  const entry = { ws, userId, name, email };
  rooms.get(projectId).add(entry);

  console.log(`[presence] ${email || userId} joined project ${projectId}`);
  broadcastPresence(projectId);

 
  setupWSConnection(ws, req);

  ws.on("close", () => {
    const room = rooms.get(projectId);
    if (room) {
      room.delete(entry);
      if (room.size === 0) rooms.delete(projectId);
      else broadcastPresence(projectId);
    }
    console.log(`[presence] ${email || userId} left project ${projectId}`);
  });
});

console.log("Y.js WebSocket server running on ws://localhost:1234");