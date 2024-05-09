import crypto from "node:crypto";
import { useBatch, useEffect } from "sinho";
import { WebSocket } from "ws";
import { ClientPropagation } from "../sinho-server/main.ts";
import { ClientMessage, ServerMessage } from "../shared/message.ts";
import { allGameSessions, messageHandler } from "./global-state.ts";

messageHandler.onMessage(
  (msg) => msg.join,
  function join(req) {
    const data = req.data;
    if (data == null) return;
    if (messageHandler.getSession(req.ws) != null) return;

    const sessionId = data.session;
    let session = allGameSessions.get(sessionId);

    if (session == null) {
      session = new GameSession(sessionId);
      allGameSessions.set(sessionId, session);
    }

    let secret = data.secret;
    if (secret != null && !session.peers.has(secret)) {
      req.send({
        error: {
          message: "Invalid secret",
        },
      });
      req.ws.close();
      return;
    }

    if (session.clients().length >= 4) {
      req.send({
        error: {
          message: "Session is full",
        },
      });
      req.ws.close();
      return;
    }

    req.assignSession(session);

    if (secret == null) {
      secret = crypto.randomUUID();
    }

    const id = crypto.randomUUID();

    session.clients.set((clients) => [...clients, req.ws]);
    session.peers.set(secret, { id, ws: req.ws });

    req.send({
      joined: {
        id,
        secret,
      },
    });
  }
);

messageHandler.onClose((req) => {
  const session = req.session;
  if (session == null) return;

  useBatch(() => {
    session.clients.set((clients) => clients.filter((ws) => ws !== req.ws));

    for (const [secret, peer] of session.peers) {
      if (peer.ws === req.ws) {
        session.peers.delete(secret);
        break;
      }
    }
  });

  if (session.clients().length === 0) {
    allGameSessions.delete(session.id);
  }
});

export class GameSession extends ClientPropagation<
  ClientMessage,
  ServerMessage
> {
  peers = new Map<
    string,
    {
      id: string;
      ws: WebSocket;
    }
  >();

  constructor(public id: string) {
    super();
  }

  useHeartbeat() {
    const aliveInfo = new WeakMap<
      WebSocket,
      {
        alive: boolean;
        timeoutId?: NodeJS.Timeout;
      }
    >();

    this.context.useClientEvent(
      (msg) => msg.heartbeat,
      (evt) => {
        if (!aliveInfo.has(evt.target)) {
          aliveInfo.set(evt.target, { alive: true });
        }

        const info = aliveInfo.get(evt.target)!;
        info.alive = true;

        clearTimeout(info.timeoutId);
        info.timeoutId = setTimeout(() => {
          info.alive = false;
          evt.target.terminate();
        }, 30000);

        messageHandler.send(evt.target, {
          heartbeat: {
            id: evt.data.id,
            now: Date.now(),
          },
        });
      }
    );
  }

  scope(): void {
    const ctx = this.context;

    const [mode, setMode] = ctx.useClientSignal((msg) => msg.mode, "lobby");

    const [players, setPlayers] = ctx.useClientSignal((msg) => msg.players, []);

    useEffect(() => {
      setPlayers((players) => {
        const peers = [...this.peers.values()];

        return players.filter((player) =>
          peers.some((peer) => peer.id === player.id)
        );
      });
    }, [this.clients]);

    this.useHeartbeat();

    ctx.useClientEvent(
      (msg) => msg.lobby?.playerInfo,
      (evt) => {
        setPlayers((players) => {
          const id = this.peers.get(evt.data.secret)?.id;
          const playerCurrent = players.find((player) => player.id === id);
          if (id == null) return players;

          const playerUpdate = {
            id,
            name: evt.data.name,
            avatar: evt.data.avatar,
          };

          if (playerCurrent == null) {
            return [...players, playerUpdate];
          }

          return players.map((player) =>
            player === playerCurrent ? { ...player, ...playerUpdate } : player
          );
        });
      }
    );
  }
}
