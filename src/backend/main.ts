import { WebSocketServer } from "ws";
import { Session } from "./session.ts";
import type { ClientMessage, ServerMessage } from "../shared/message.ts";

const port = 8080;
const sessions = new Map<string, Session>();

const wss = new WebSocketServer({
  port,
});

wss.on("error", console.error);

wss.on("listening", () => {
  console.log(`Listening on ${port}…`);
});

wss.on("connection", (ws) => {
  let session: Session | undefined;

  ws.on("error", console.error);

  ws.on("close", () => {
    if (session == null) return;

    for (const peer of session.peers.values()) {
      if (peer.ws === ws) continue;

      peer.ws.send(
        JSON.stringify({
          lobby: {
            leave: {
              id: peer.id,
            },
          },
        } as ServerMessage)
      );
    }
  });

  ws.on("message", (data) => {
    const msg: ClientMessage = JSON.parse(data.toString());

    if (msg.lobby?.join != null) {
      const sessionId = msg.lobby.join.session;
      session = sessions.get(sessionId);

      if (session == null) {
        session = new Session(sessionId);
        sessions.set(sessionId, session);
      }

      let secret = msg.lobby.join.secret;
      if (secret != null && !session.peers.has(secret)) {
        ws.send(
          JSON.stringify({
            error: { message: "Invalid secret" },
          } as ServerMessage)
        );
        ws.close();
        return;
      }

      if (secret == null) {
        secret = crypto.randomUUID();
      }

      const id = crypto.randomUUID();

      session.peers.set(secret, { id, ws, avatar: msg.lobby.join.avatar });

      ws.send(
        JSON.stringify({
          lobby: {
            joined: {
              id,
              secret,
            },
          },
        } as ServerMessage)
      );

      for (const peer of session.peers.values()) {
        if (peer.ws === ws) continue;

        ws.send(
          JSON.stringify({
            lobby: {
              playerInfo: {
                id: peer.id,
                name: peer.name,
                avatar: peer.avatar,
              },
            },
          } as ServerMessage)
        );

        peer.ws.send(
          JSON.stringify({
            lobby: {
              playerInfo: {
                id,
                avatar: msg.lobby.join.avatar,
              },
            },
          } as ServerMessage)
        );
      }
    }
  });
});
