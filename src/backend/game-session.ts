import crypto from "node:crypto";
import { useBatch, useEffect, useRef, useSubscope } from "sinho";
import { WebSocket } from "ws";
import { useClientPropagation } from "../sinho-server/main.ts";
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
    if (
      session.mode() !== "lobby" &&
      (secret == null || !session.peers().has(secret))
    ) {
      req.send({
        error: {
          message: "Invalid secret",
        },
      });
      req.ws.close();
      return;
    }

    if (session.peers().size >= 4) {
      req.send({
        error: {
          message: "Session is full",
        },
      });
      req.ws.close();
      return;
    }

    req.assignSession(session);

    const id = crypto.randomUUID();
    if (secret == null) {
      secret = crypto.randomUUID();
    }

    session.peers.set((peers) => {
      const result = new Map(peers);
      result.set(secret, { id, ws: req.ws });
      return result;
    });

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
    session.peers.set((peers) => {
      const result = new Map(peers);

      for (const [secret, peer] of result) {
        if (peer.ws === req.ws) {
          result.delete(secret);
          break;
        }
      }

      return result;
    });
  });

  if (session.peers().size === 0) {
    allGameSessions.delete(session.id);
  }

  session.destroy?.();
});

export class GameSession {
  mode = useRef<"lobby" | "game">("lobby");
  peers = useRef<
    Map<
      string,
      {
        id: string;
        ws: WebSocket;
      }
    >
  >(new Map());
  clients = () => [...this.peers().values()].map((peer) => peer.ws);
  destroy?: () => void;

  constructor(public id: string) {
    [, this.destroy] = useSubscope(() => this.scope());
  }

  useHeartbeat() {
    const { useClientEvent } = useClientPropagation<
      ClientMessage,
      ServerMessage
    >(this.clients);

    const aliveInfo = new WeakMap<
      WebSocket,
      {
        alive: boolean;
        timeoutId?: NodeJS.Timeout;
      }
    >();

    useClientEvent(
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
    const { useClientSignal, useClientEvent } = useClientPropagation<
      ClientMessage,
      ServerMessage
    >(this.clients);

    const [mode, setMode] = useClientSignal((msg) => msg.mode, this.mode());
    useEffect(() => setMode(this.mode()));

    const [players, setPlayers] = useClientSignal((msg) => msg.players, []);

    useEffect(() => {
      setPlayers((players) => {
        const peers = [...this.peers().values()];

        return players.filter((player) =>
          peers.some((peer) => peer.id === player.id)
        );
      });
    });

    this.useHeartbeat();

    useClientEvent(
      (msg) => msg.lobby?.playerInfo,
      (evt) => {
        setPlayers((players) => {
          const id = this.peers().get(evt.data.secret)?.id;
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
