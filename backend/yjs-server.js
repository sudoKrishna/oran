// yjs-server.js
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
  console.log('🔗 New client connected to Y.js');
});

console.log('🚀 Y.js WebSocket server running on ws://localhost:1234');