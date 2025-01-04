import {
  Cleanup,
  MaybeSignal,
  Signal,
  useEffect,
  useMemo,
  useRef,
  useSignal,
  useSubscope,
} from "sinho";
import { WebSocket } from "ws";
import { useWebSockets as useWebSocketsTemplate } from "./websockets-hook.ts";
import {
  AppMode,
  ClientMessage,
  GameEndInfo,
  GameInfo,
  GamePlayersInfo,
  GameSettings,
  PlayerInfo,
  ScoreInfo,
  ServerMessage,
} from "../shared/message.ts";
import {
  allClients,
  allGameSessions,
  clientInfoMap,
  maxSessions,
} from "./global-state.ts";
import {
  DealPhase,
  EndPhase,
  GameState,
  Phase,
  PhaseBase,
  ReactionPhase,
  ScorePhase,
} from "../core/game-state.ts";
import { diceSort, uuid } from "../shared/utils.ts";

type Peers = Map<
  string,
  {
    id: string;
    ws: WebSocket;
  }
>;

const useWebSockets = useWebSocketsTemplate<ClientMessage, ServerMessage>;

export function useJoinSession(clients: MaybeSignal<Set<WebSocket>>) {
  const { onClientMessage, sendMessage } = useWebSockets(clients);

  onClientMessage(
    (msg) => msg.join,
    (evt) => {
      const data = evt.data;
      const client = clientInfoMap.get(evt.target);
      if (client == null || client.session != null) return;

      const sessionId = data.session;
      let session = allGameSessions.get(sessionId);

      if (session == null) {
        if (allGameSessions.size >= maxSessions) {
          console.log(
            `[GameSession] Number of sessions exceeded maximum ${maxSessions}`
          );

          sendMessage(evt.target, {
            error: { message: "Maximum number of sessions exceeded" },
          });
          evt.target.close();
          return;
        }

        session = new GameSession(sessionId);
        allGameSessions.set(sessionId, session);
      }

      if (session.mode() === "lobby" && session.peers().size >= 4) {
        console.log(
          `[GameSession] Peer tries to join already full session ${session.id}`
        );

        sendMessage(evt.target, {
          error: { message: "Session is full" },
        });
        evt.target.close();
        return;
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
          error: { message: "Invalid secret" },
        });
        evt.target.close();
        return;
      }

      client.session = session;

      if (session.mode() === "lobby" || secret == null) {
        secret = uuid();
      }
      const id = session.peers().get(secret)?.id ?? uuid();

      console.log(`[GameSession] Peer ${id} joins session ${session.id}`);

      if (session.peers().get(secret)?.ws !== evt.target) {
        session.peers().get(secret)?.ws.close();
      }

      session.peers.set((peers) =>
        new Map(peers).set(secret, {
          id,
          ws: evt.target,
        })
      );

      sendMessage(evt.target, {
        joined: {
          id,
          secret,
        },
      });
    }
  );
}

function useHeartbeat(session: GameSession): void {
  const { useClientSignal, onClientMessage, sendMessage } = useWebSockets(
    session.clients
  );

  const deadPlayers = useMemo(
    () =>
      [...session.peers().values()]
        .filter((peer) => !allClients().has(peer.ws))
        .map((peer) => peer.id)
        .sort(),
    {
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  );

  useClientSignal((msg) => msg.deadPlayers, deadPlayers);

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
    const nextClients = session.clients();

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

function onAllReady(session: GameSession, cb: () => void): () => void {
  const [, destroy] = useSubscope(() => {
    const { onClientMessage } = useWebSockets(session.clients);
    const readyClients = new Set<WebSocket>();

    onClientMessage(
      (msg) => msg.ready,
      (evt) => {
        readyClients.add(evt.target);

        if (
          [...session.clients()].every((client) => readyClients.has(client))
        ) {
          destroy();
          cb();
        }
      }
    );
  });

  return destroy;
}

function useLobby(
  session: GameSession,
  gameSettings?: GameSettings
): () => void {
  const [, destroy] = useSubscope(() => {
    const { useClientSignal, onClientMessage, onClientClose } = useWebSockets(
      session.clients
    );

    useEffect(() => {
      session.players.set((players) => {
        const peers = [...session.peers().values()];

        return players.filter((player) =>
          peers.some((peer) => peer.id === player.id)
        );
      });
    });

    onClientMessage(
      (msg) => msg.lobby?.playerInfo,
      (evt) => {
        session.players.set((players) => {
          const id = session.peers().get(evt.data.secret)?.id;
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
      let players = session.players();

      if (
        players.length === 4 &&
        players.every((player) => player.dice != null)
      ) {
        timeout = setTimeout(() => {
          session.mode.set("game");
        }, 3000);
      }

      return () => {
        clearTimeout(timeout);
      };
    });

    if (gameSettings != null) {
      const [maxRotation, setMaxRotation] = useSignal(gameSettings.maxRotation);
      const [reactionTimeout, setReactionTimeout] = useSignal(
        gameSettings.reactionTimeout
      );

      useEffect(() => {
        gameSettings.maxRotation = maxRotation();
        gameSettings.reactionTimeout = reactionTimeout();
      });

      useClientSignal(
        (msg) => msg.gameSettings,
        () => ({
          maxRotation: maxRotation(),
          reactionTimeout: reactionTimeout(),
        })
      );

      onClientMessage(
        (msg) => msg.lobby?.gameSettings,
        (evt) => {
          setMaxRotation(evt.data.maxRotation);
          setReactionTimeout(evt.data.reactionTimeout);
        }
      );
    }

    onClientClose((evt) => {
      session.peers.set((peers) => {
        const result = new Map(peers);

        for (const [secret, peer] of result) {
          if (peer.ws === evt.target) {
            console.log(
              `[GameSession] Peer ${peer.id} leaves session ${session.id}`
            );
            result.delete(secret);
            break;
          }
        }

        return result;
      });
    });
  });

  return destroy;
}

function useGame(session: GameSession, settings?: GameSettings): () => void {
  const [, destroy] = useSubscope(() => {
    const { useClientSignal, onClientMessage, onClientClose } = useWebSockets(
      session.clients
    );

    const orderedPlayers = useMemo(() =>
      [...session.players()].sort((a, b) =>
        diceSort(a.dice ?? [0, 0], b.dice ?? [0, 0])
      )
    );

    const [gameState, setGameState] = useSignal<GameState>(
      GameState.createNewGame(),
      { force: true }
    );

    if (settings != null) {
      setGameState((state) => {
        state.maxRotation = settings.maxRotation;
        state.reactionTimeout = settings.reactionTimeout;

        return state;
      });
    }

    const updateGameState = <P extends PhaseBase>(
      phase: "*" | (new (...args: any) => P),
      fn: (state: GameState<P>) => void
    ) => {
      if (phase === "*" || gameState().phase instanceof phase) {
        setGameState((state) => {
          try {
            fn(state as GameState<P>);
          } catch (err) {
            console.error(err);
            // Ignore
          }

          return state;
        });
      }
    };

    // Propagate public information

    const gameInfo = useMemo<GameInfo>(() => ({
      phase: gameState().phase.name,
      currentPlayer: orderedPlayers()[gameState().currentPlayerIndex].id,
      dealer: orderedPlayers()[gameState().dealerIndex].id,
      jokers: [gameState().primaryJoker, gameState().secondaryJoker],
      rotation: gameState().rotation,
      maxRotation: gameState().maxRotation,
      lastDiscard: gameState().lastDiscard?.toJSON() ?? null,
      lastDiscardInfo:
        gameState().lastDiscardInfo == null
          ? null
          : [
              orderedPlayers()[gameState().lastDiscardInfo![0]].id,
              gameState().lastDiscardInfo![1],
            ],
      kongDiscard: gameState().kongDiscard?.toJSON() ?? null,
      reactions:
        gameState().phase.name === Phase.Reaction
          ? (gameState().phase as ReactionPhase).reactions
          : [],
      reactionTimeout: gameState().reactionTimeout,
    }));

    const currentPlayerPeer = useMemo(() =>
      [...session.peers().values()].find(
        (peer) => peer.id === gameInfo().currentPlayer
      )
    );

    useClientSignal((msg) => msg.game?.info, gameInfo);

    const gamePlayersInfo = useMemo<GamePlayersInfo>(() =>
      Object.fromEntries(
        orderedPlayers().map((player, i) => [
          player.id,
          {
            index: i,
            ...gameState().players[i].toOtherPlayer(),
          },
        ])
      )
    );

    useClientSignal((msg) => msg.game?.players, gamePlayersInfo);

    for (const [i, { id }] of orderedPlayers().entries()) {
      // Propagate player secrets

      const clients = useMemo(
        () => [...session.peers().values()].find((peer) => peer.id === id)?.ws
      );

      const { useClientSignal } = useWebSockets(
        () => new Set(clients() == null ? [] : [clients()!])
      );

      const tiles = () =>
        gameState().players[i].tiles.map((tile) => tile.toJSON());

      useClientSignal(
        (msg) => msg.game?.player,
        () => ({
          tiles: tiles(),
          lastDrawnTileIndex: gameState().players[i].lastDrawnTileIndex ?? null,
        })
      );
    }

    const scoreInfo = useMemo<ScoreInfo | null>(() => {
      const phase = gameState().phase;

      return phase instanceof ScorePhase
        ? {
            tiles: gameState().currentPlayer.tiles,
            melds: gameState().currentPlayer.melds,
            winModifiers: phase.winModifiers,
            jokerBonusModifiers: phase.jokerBonusModifiers,
          }
        : null;
    });

    useClientSignal((msg) => msg.game?.score, scoreInfo);

    const nextGameId = uuid();
    const endInfo = useMemo<GameEndInfo | null>(() => {
      const phase = gameState().phase;
      const achievements: GameEndInfo["achievements"] = {};

      if (!(phase instanceof EndPhase)) return null;

      for (const [i, player] of orderedPlayers().entries()) {
        achievements[player.id] = phase.achievements[i];
      }

      return { achievements, nextSession: nextGameId };
    });

    useClientSignal((msg) => msg.game?.end, endInfo);

    // Game operations

    const phase = useMemo(() => gameState().phase.name);

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      let destroy: (() => void) | undefined;
      const phase = gameState().phase;

      if (phase instanceof DealPhase) {
        timeoutId = setTimeout(() => {
          updateGameState(DealPhase, (state) => state.phase.deal());
        }, 100);
      }

      if (phase instanceof ReactionPhase) {
        timeoutId = setTimeout(() => {
          updateGameState(ReactionPhase, (state) => state.phase.next());
        }, gameState().reactionTimeout + 200);
      }

      if (phase instanceof ScorePhase) {
        destroy = onAllReady(session, () => {
          timeoutId = setTimeout(() => {
            updateGameState(ScorePhase, (state) => state.phase.score());
            updateGameState(ScorePhase, (state) => state.phase.next());
          }, 1000);
        });
      }

      return () => {
        clearTimeout(timeoutId);
        destroy?.();
      };
    }, [phase]);

    onClientMessage(
      (msg) => msg.game?.operation,
      (evt) => {
        const targetPeerId = [...session.peers().values()].find(
          (peer) => peer.ws === evt.target
        )?.id;

        if (targetPeerId == null) {
          console.warn(
            `[GameSession] Unauthorized operation from unknown peer`
          );
          return;
        }

        for (const phaseName in evt.data) {
          for (const key in (evt.data as any)[phaseName]) {
            updateGameState("*", (state) => {
              const parameters = (evt.data as any)[phaseName][key] as any[];
              const playerMessageOpts =
                state.phase.allowPlayerMessageFns.get(key);

              if (
                playerMessageOpts != null &&
                (!playerMessageOpts.currentPlayerOnly ||
                  currentPlayerPeer()?.ws === evt.target) &&
                (playerMessageOpts.verifyPlayerIndex == null ||
                  orderedPlayers()[
                    parameters[playerMessageOpts.verifyPlayerIndex]
                  ].id === targetPeerId)
              ) {
                (state.phase as any)[key](...parameters);
              } else {
                console.warn(
                  `[GameSession] Unauthorized operation ${phaseName}.${key} from ${targetPeerId}`
                );
              }
            });
          }
        }
      }
    );

    onClientClose(() => {
      // Destroy session when all peers have disconnected

      if (
        [...session.peers().values()].every(
          (peer) => !allClients().has(peer.ws)
        )
      ) {
        session.peers.set(new Map());
      }
    });
  });

  return destroy;
}

export class GameSession {
  mode = useRef<AppMode>("lobby");
  peers = useRef<Peers>(new Map());
  clients = () => new Set([...this.peers().values()].map((peer) => peer.ws));
  players = useRef<PlayerInfo[]>([]);

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
    const { useClientSignal } = useWebSockets(this.clients);

    useHeartbeat(this);

    useClientSignal((msg) => msg.mode, this.mode);
    useClientSignal((msg) => msg.players, this.players);

    let newGameState = GameState.createNewGame();
    let gameSettings: GameSettings = {
      maxRotation: newGameState.maxRotation,
      reactionTimeout: newGameState.reactionTimeout,
    };

    useEffect(() => {
      let destroy: Cleanup;

      if (this.mode() === "lobby") {
        destroy = useLobby(this, gameSettings);
      } else if (this.mode() === "game") {
        destroy = useGame(this, gameSettings);
      }

      return destroy;
    });

    useEffect(() => {
      // Destroy session

      if (this.peers().size === 0) {
        allGameSessions.delete(this.id);
        this.destroy?.();
      }
    });
  }
}
