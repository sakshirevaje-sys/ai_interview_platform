import { WebSocketServer } from "ws";

const globalForWs = globalThis;

function createHub() {
  return {
    server: null,
    clients: new Set(),
  };
}

const hub = globalForWs.secureExamWsHub || createHub();
if (!globalForWs.secureExamWsHub) {
  globalForWs.secureExamWsHub = hub;
}

export function attachSecureExamWSServer(httpServer) {
  if (hub.server) {
    return hub.server;
  }

  const wss = new WebSocketServer({ noServer: true });
  hub.server = wss;

  httpServer.on("upgrade", (request, socket, head) => {
    if (!request.url?.startsWith("/ws/secure-exam")) {
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      hub.clients.add(client);
      client.on("close", () => hub.clients.delete(client));
      client.send(JSON.stringify({ type: "SECURE_EXAM_CONNECTED", at: new Date().toISOString() }));
      wss.emit("connection", client, request);
    });
  });

  return wss;
}

export function publishSecureExamEvent(payload) {
  const message = JSON.stringify(payload);

  for (const client of hub.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}
