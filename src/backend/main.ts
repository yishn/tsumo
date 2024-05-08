import { WebSocketServer } from "ws";
import type { ClientMessage } from "../shared/message.ts";
import { messageHandler } from "./global-state.ts";
import "./game-session.ts";

const port = 8080;

const wss = new WebSocketServer({ port });

wss.on("error", console.error);

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("close", () => {
    messageHandler.handleClose(ws);
  });

  ws.on("message", (data) => {
    const msg: ClientMessage = JSON.parse(data.toString());

    messageHandler.handleMessage(ws, msg);
  });
});
