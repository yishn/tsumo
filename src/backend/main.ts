import { WebSocketServer } from "ws";
import { setAllClients } from "./global-state.ts";
import "./game-session.ts";

const port = 8080;

const wss = new WebSocketServer({ port });

wss.on("error", (err) => console.error("[Server]", err));

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

wss.on("connection", (ws) => {
  setAllClients((clients) => {
    const result = new Set(clients);
    result.add(ws);
    return result;
  });

  ws.on("error", (err) => {
    console.error("[WebSocket]", err);
    ws.terminate();
  });

  ws.on("close", () => {
    setAllClients((clients) => {
      const result = new Set(clients);
      result.delete(ws);
      return result;
    });
  });
});
