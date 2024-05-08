import { WebSocketServer } from "ws";
import type { ClientMessage } from "../shared/message.ts";
import { messageHandler } from "./global-state.ts";
import "./handlers/heartbeat.ts";
import "./handlers/lobby.ts";

const port = 8080;

const wss = new WebSocketServer({ port });

wss.on("error", console.error);

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("close", () => {
    const session = messageHandler.getSession(ws);
    if (session == null) return;

    for (const peer of session.peers.values()) {
      if (peer.ws === ws) continue;

      messageHandler.send(peer.ws, {
        lobby: {
          leave: {
            id: peer.id,
          },
        },
      });
    }
  });

  ws.on("message", (data) => {
    const msg: ClientMessage = JSON.parse(data.toString());

    messageHandler.handle(ws, msg);
  });
});
