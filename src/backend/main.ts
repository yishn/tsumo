import { WebSocketServer } from "ws";
import { GameState } from "../core/game-state.ts";

const port = 8080;

const gameState: GameState = GameState.newGame();

const wss = new WebSocketServer({
  port,
});

wss.on("error", console.error);

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);
});
