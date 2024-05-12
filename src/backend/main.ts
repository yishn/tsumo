import { WebSocketServer } from "ws";
import { clientInfoMap, allClients } from "./global-state.ts";
import { useJoinSession } from "./game-session.ts";

const port = 8080;

const wss = new WebSocketServer({ port });

wss.on("error", (err) => console.error("[Server]", err));

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

useJoinSession(allClients);

wss.on("connection", (ws) => {
  allClients.set((clients) => {
    const result = new Set(clients);
    result.add(ws);
    return result;
  });
  clientInfoMap.set(ws, {});

  ws.on("error", (err) => {
    console.error("[WebSocket]", err);
    ws.terminate();
  });

  ws.on("close", () => {
    allClients.set((clients) => {
      const result = new Set(clients);
      result.delete(ws);
      return result;
    });
  });
});
