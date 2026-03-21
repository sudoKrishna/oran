let ws : WebSocket |  null = null;

export function getSocket():  WebSocket | null {
    return ws;
}

export function setSocket(socket : WebSocket) {
    ws = socket
}