const WebSocket = require("ws");
const pty = require("node-pty");

const wss = new WebSocket.Server({ port: 8080 });

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