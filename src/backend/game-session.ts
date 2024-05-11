import { MaybeSignal, flushBatch, useEffect, useRef, useSubscope } from "sinho";
import { WebSocket } from "ws";
import { useWebSockets as useWebSocketsTemplate } from "./websockets-hook.ts";
import { ClientMessage, ServerMessage } from "../shared/message.ts";
import {
  allClients,
  allGameSessions,
  clientSessionMap,
} from "./global-state.ts";
import { uuid } from "../shared/utils.ts";

const useWebSockets = useWebSocketsTemplate<
  ClientMessage,
  ServerMessage
>;

const { onClientMessage, sendMessage } = useWebSockets(allClients);

onClientMessage(
  (msg) => msg.join,
  (evt) => {
    const data = evt.data;
    if (data == null) return;
    if (clientSessionMap.get(evt.target) != null) return;

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
      console.log(
        `[GameSession] Peer tries to join session ${session.id} with invalid secret`
      );
      sendMessage(evt.target, {
        error: {
          message: "Invalid secret",
        },
      });
      evt.target.close();
      return;
    }

    if (session.peers().size >= 4) {
      console.log(
        `[GameSession] Peer tries to join already full session ${session.id}`
      );

      sendMessage(evt.target, {
        error: {
          message: "Session is full",
        },
      });
      evt.target.close();
      return;
    }

    clientSessionMap.set(evt.target, session);

    const id = uuid();
    if (secret == null) {
      secret = uuid();
    }

    console.log(`[GameSession] Peer ${id} joins session ${session.id}`);

    session.peers.set((peers) => {
      const result = new Map(peers);
      result.set(secret, { id, ws: evt.target });
      return result;
    });

    sendMessage(evt.target, {
      joined: {
        id,
        secret,
      },
    });
  }
);

function useHeartbeat(
  clients: MaybeSignal<Set<WebSocket>>,
  session: GameSession
) {
  const { onClientMessage, sendMessage } = useWebSockets(clients);

  const aliveInfo = new WeakMap<
    WebSocket,
    {
      intervalId?: ReturnType<typeof setInterval>;
      timeoutId?: ReturnType<typeof setTimeout>;
    }
  >();

  let id = 0;
  let prevClients: Set<WebSocket> = new Set();

  useEffect(() => {
    const nextClients = MaybeSignal.get(clients);

    [...prevClients]
      .filter((ws) => !nextClients.has(ws))
      .forEach((ws) => {
        const info = aliveInfo.get(ws);

        if (info != null) {
          clearInterval(info.intervalId!);
          clearTimeout(info.timeoutId!);
        }

        aliveInfo.delete(ws);
      });

    for (const ws of nextClients) {
      if (aliveInfo.has(ws)) continue;

      const info: typeof aliveInfo extends WeakMap<infer _, infer V>
        ? V
        : never = {
        intervalId: setInterval(() => {
          sendMessage(ws, {
            heartbeat: {
              id: id++,
              now: Date.now(),
            },
          });

          info.timeoutId = setTimeout(() => {
            const peerId = [...(session.peers().values() ?? [])].find(
              (peer) => peer.ws === ws
            )?.id;

            if (peerId != null) {
              console.warn(`[WebSocket] Peer ${peerId} is not responsive`);
            }

            ws.close();
          }, 10000);
        }, 20000),
      };

      aliveInfo.set(ws, info);
    }

    prevClients = nextClients;
  });

  onClientMessage(
    (msg) => msg,
    (evt) => {
      const info = aliveInfo.get(evt.target);
      if (info == null) return;

      clearTimeout(info.timeoutId);
    }
  );
}

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
  clients = () => new Set([...this.peers().values()].map((peer) => peer.ws));
  destroy?: () => void;

  constructor(public id: string) {
    console.log(`[GameSession] Create session ${id}`);
    [, this.destroy] = useSubscope(() => {
      this.scope();

      useEffect(() => () => {
        console.log(`[GameSession] Destroy session ${id}`);
      });
    });
  }

  scope(): void {
    const { useClientSignal, onClientMessage, onClientClose } =
      useWebSockets(this.clients);

    useHeartbeat(this.clients, this);

    const [mode, setMode] = useClientSignal((msg) => msg.mode, "lobby");
    useEffect(() => this.mode.set(mode()));

    const [players, setPlayers] = useClientSignal((msg) => msg.players, []);

    useEffect(() => {
      setPlayers((players) => {
        const peers = [...this.peers().values()];

        return players.filter((player) =>
          peers.some((peer) => peer.id === player.id)
        );
      });
    });

    onClientMessage(
      (msg) => msg.lobby?.playerInfo,
      (evt) => {
        setPlayers((players) => {
          const id = this.peers().get(evt.data.secret)?.id;
          const playerCurrent = players.find((player) => player.id === id);
          if (id == null) return players;

          const playerUpdate: (typeof players)[number] = {
            id,
            name: evt.data.name,
            avatar: evt.data.avatar,
          };

          if (evt.data.ready && playerCurrent?.dice == null) {
            const rollDice = () =>
              [...Array(2)].map(() => Math.floor(Math.random() * 6) + 1) as [
                number,
                number,
              ];
            const diceSum = (dice: number[]) =>
              dice.reduce((sum, n) => sum + n, 0);

            while (true) {
              const dice = rollDice();

              if (
                !players.some(
                  (player) =>
                    player.dice != null &&
                    diceSum(player.dice) === diceSum(dice)
                )
              ) {
                playerUpdate.dice = dice;
                break;
              }
            }
          }

          if (playerCurrent == null) {
            return [...players, playerUpdate];
          }

          return players.map((player) =>
            player === playerCurrent ? { ...player, ...playerUpdate } : player
          );
        });
      }
    );

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout> | undefined;

      if (
        players().length === 4 &&
        players().every((player) => player.dice != null)
      ) {
        timeout = setTimeout(() => {
          setMode("game");
        }, 3000);
      }

      return () => {
        clearTimeout(timeout);
      };
    });

    onClientClose((evt) => {
      this.peers.set((peers) => {
        const result = new Map(peers);

        for (const [secret, peer] of result) {
          if (peer.ws === evt.target) {
            console.log(
              `[GameSession] Peer ${peer.id} leaves session ${this.id}`
            );
            result.delete(secret);
            break;
          }
        }

        return result;
      });

      flushBatch();

      if (this.peers().size === 0) {
        allGameSessions.delete(this.id);
        this.destroy?.();
      }
    });
  }
}
