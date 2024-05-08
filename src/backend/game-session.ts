import crypto from "node:crypto";
import { SignalSetter, useBatch } from "sinho";
import { WebSocket } from "ws";
import { ClientPropagation } from "../sinho-server/main.ts";
import { ClientMessage, ServerMessage } from "../shared/message.ts";
import { allGameSessions, messageHandler } from "./global-state.ts";

messageHandler.onMessage(
  (msg) => msg.lobby?.join,
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

    if (session.peers.size >= 4) {
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
      lobby: {
        joined: {
          id,
          secret,
        },
      },
    });
  }
);

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

  getPlayerIdByWs(ws: WebSocket): string | undefined {
    for (const peer of this.peers.values()) {
      if (peer.ws === ws) return peer.id;
    }
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
        const playerId = this.getPlayerIdByWs(evt.target);
        if (playerId == null) return;

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

    const [players, setPlayers] = ctx.useClientSignal<
      {
        id: string;
        name?: string;
        avatar: number;
        dice?: number;
      }[]
    >([], (players) => ({ lobby: { players } }));

    this.useHeartbeat();

    ctx.useClientEvent(
      (msg) => msg.lobby?.playerInfo,
      (evt) => {
        setPlayers((players) => {
          const id = this.peers.get(evt.data.secret)?.id;
          const index = players.findIndex((player) => player.id === id);
          if (id == null) return players;

          const player = {
            id,
            name: evt.data.name,
            avatar: evt.data.avatar,
            alive: true,
          };

          if (index < 0) {
            return [...players, player];
          }

          return [
            ...players.slice(0, index),
            { ...players[index], ...player },
            ...players.slice(index + 1),
          ];
        });
      }
    );

    messageHandler.onClose((req) =>
      useBatch(() => {
        if (req.session !== this) return;

        this.clients.set((clients) => clients.filter((ws) => ws !== req.ws));

        for (const [secret, peer] of this.peers) {
          if (peer.ws === req.ws) {
            this.peers.delete(secret);

            setPlayers((players) =>
              players.filter((player) => player.id !== peer.id)
            );
            break;
          }
        }
      })
    );
  }
}
