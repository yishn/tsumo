import {
  Component,
  Else,
  ElseIf,
  For,
  If,
  Signal,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";
import {
  DiscardIcon,
  DrawIcon,
  EatIcon,
  KongIcon,
  PongIcon,
  WinIcon,
  avatarList,
  getAvatarUrl,
} from "../assets.ts";
import { ActionBar, ActionBarButton } from "../components/action-bar.tsx";
import { PlayerRow } from "../components/player-row.tsx";
import { Tile } from "../components/tile.tsx";
import { TileRow } from "../components/tile-row.tsx";
import { playPopSound, playShuffleSound, playTurnSound } from "../sounds.ts";
import {
  ITile,
  Phase,
  Reaction,
  ScoreModifierType,
  Tile as TileClass,
} from "../../core/main.ts";
import {
  GameInfo,
  PlayerInfo,
  GamePlayersInfo,
  GamePlayerInfo,
  ScoreInfo,
  GameEndInfo,
} from "../../shared/message.ts";
import { diceSort } from "../../shared/utils.ts";
import { webSocketHook } from "../global-state.ts";
import { TileStack } from "../components/tile-stack.tsx";
import { ReactionWindow } from "../components/reaction-window.tsx";
import { reactionTimeout } from "../../shared/constants.ts";
import { ReactionBar } from "../components/reaction-bar.tsx";
import { ScoreScroll } from "../components/score-scroll.tsx";
import { EndScreen } from "../components/end-screen.tsx";

export interface RemotePlayer {
  name: string;
  avatar: number;
  score: number;
  tiles: number;
  dealer: boolean;
}

export class GamePage extends Component("game-page", {
  players: prop<PlayerInfo[]>([]),
  ownPlayerId: prop<string>(),
  deadPlayers: prop<string[]>([]),
  gameInfo: prop<GameInfo>(),
  gamePlayersInfo: prop<GamePlayersInfo>(),
  ownPlayerInfo: prop<GamePlayerInfo>(),
  scoreInfo: prop<ScoreInfo>(),
  endInfo: prop<GameEndInfo>(),
}) {
  render() {
    const orderedPlayers = useMemo(() =>
      [...this.props.players()].sort((a, b) =>
        diceSort(a.dice ?? [0, 0], b.dice ?? [0, 0])
      )
    );
    const ownPlayerIndex = useMemo(() =>
      orderedPlayers().findIndex(
        (player) => player.id === this.props.ownPlayerId()
      )
    );
    const remotePlayerInfos = useMemo(() => {
      if (ownPlayerIndex() >= 0) {
        const remotePlayers = orderedPlayers().filter(
          (_, i) => i !== ownPlayerIndex()
        );

        for (
          let i = 0;
          i < orderedPlayers().length - ownPlayerIndex() - 1;
          i++
        ) {
          remotePlayers.unshift(remotePlayers.pop()!);
        }

        return remotePlayers;
      }

      return [...orderedPlayers()];
    });
    const selfPlayerInfo = useMemo(() => ({
      ...this.props
        .players()
        .find((player) => player.id === this.props.ownPlayerId()),
      ...this.props.gamePlayersInfo()?.[this.props.ownPlayerId() ?? ""],
      ...this.props.ownPlayerInfo(),
    }));
    const isSelfTurn = useMemo(
      () => this.props.gameInfo()?.currentPlayer === this.props.ownPlayerId()
    );
    const phase = () => this.props.gameInfo()?.phase;
    const lastDiscard = () => this.props.gameInfo()?.lastDiscard;
    const kongDiscard = () => this.props.gameInfo()?.kongDiscard;
    const reacted = () =>
      phase() === Phase.Reaction &&
      !!this.props
        .gameInfo()
        ?.reactions.some(
          (reaction) => reaction.playerIndex === ownPlayerIndex()
        );

    useEffect(() => {
      if (this.props.gameInfo()?.phase === Phase.Deal) {
        playShuffleSound();
      }
    });

    useEffect(() => {
      if (isSelfTurn()) {
        playTurnSound();
      }
    });

    const [selectedTileIndices, setSelectedTileIndices] = useSignal<number[]>(
      []
    );

    useEffect(() => {
      if (this.props.ownPlayerInfo()?.lastDrawnTileIndex != null) {
        setSelectedTileIndices([
          this.props.ownPlayerInfo()!.lastDrawnTileIndex!,
        ]);
      }
    });

    useEffect(() => {
      if (
        selectedTileIndices().some((i) => selfPlayerInfo().tiles?.[i] == null)
      ) {
        setSelectedTileIndices([]);
      }
    });

    const [reactions, setReactions] = useSignal<Reaction[]>([]);
    let lastReaction: number | undefined;

    useEffect(() => {
      // Always allow 1s of reaction banner animation

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const nextReactions = this.props.gameInfo()?.reactions ?? [];

      if (
        nextReactions.length < reactions().length &&
        lastReaction != null &&
        Date.now() - lastReaction < 1000
      ) {
        timeoutId = setTimeout(() => setReactions(nextReactions), 1000);
      } else {
        setReactions(nextReactions);
        lastReaction = nextReactions.length === 0 ? undefined : Date.now();
      }

      return () => {
        clearTimeout(timeoutId);
      };
    });

    return (
      <>
        <div part="players" class={() => phase()}>
          <For each={remotePlayerInfos}>
            {(player, i) => (
              <PlayerRow
                style={{ animationDelay: `${i() * 0.1}s` }}
                name={() => player().name ?? ""}
                avatar={() => getAvatarUrl(player().avatar)}
                current={() =>
                  player().id === this.props.gameInfo()?.currentPlayer
                }
                dealer={() => player().id === this.props.gameInfo()?.dealer}
                loading={() => this.props.deadPlayers().includes(player().id)}
                score={() =>
                  this.props.gamePlayersInfo()?.[player().id]?.score ?? 0
                }
              >
                <TileRow slot="discards">
                  <For
                    each={() => {
                      const gamePlayerInfo =
                        this.props.gamePlayersInfo()?.[player().id];
                      const lastDiscardInfo =
                        this.props.gameInfo()?.lastDiscardInfo;

                      return (gamePlayerInfo?.order ?? [])
                        .map(([type, i]) =>
                          type === "discard"
                            ? {
                                ...gamePlayerInfo!.discards[i],
                                highlight:
                                  lastDiscardInfo?.[0] === player().id &&
                                  lastDiscardInfo?.[1] === i,
                              }
                            : gamePlayerInfo!.melds[i]
                        )
                        .filter((tileOrMeld) =>
                          phase() === Phase.Reaction &&
                          !Array.isArray(tileOrMeld) &&
                          tileOrMeld.highlight
                            ? false
                            : true
                        );
                    }}
                  >
                    {(tileOrMeld) => (
                      <>
                        <If condition={() => Array.isArray(tileOrMeld())}>
                          <TileStack>
                            <For each={tileOrMeld as Signal<TileClass[]>}>
                              {(tile) => (
                                <Tile
                                  animateEnter
                                  sounds
                                  suit={() => tile().suit}
                                  rank={() => tile().rank}
                                />
                              )}
                            </For>
                          </TileStack>
                        </If>
                        <Else>
                          <Tile
                            animateEnter
                            sounds
                            highlight={() =>
                              (tileOrMeld() as { highlight: boolean }).highlight
                            }
                            suit={() => (tileOrMeld() as ITile).suit}
                            rank={() => (tileOrMeld() as ITile).rank}
                          />
                        </Else>
                      </>
                    )}
                  </For>
                </TileRow>

                <If
                  condition={() =>
                    (this.props.gamePlayersInfo()?.[player().id]?.tilesCount ??
                      0) > 0
                  }
                >
                  <TileRow slot="tiles" minimal>
                    <For
                      each={() => [
                        ...Array(
                          this.props.gamePlayersInfo()?.[player().id]
                            ?.tilesCount ?? 0
                        ),
                      ]}
                    >
                      {() => <Tile back animateEnter sounds />}
                    </For>
                  </TileRow>
                </If>
              </PlayerRow>
            )}
          </For>

          <If condition={() => phase() === Phase.Reaction}>
            <ReactionWindow
              suit={() => kongDiscard()?.suit ?? lastDiscard()?.suit}
              rank={() => kongDiscard()?.rank ?? lastDiscard()?.rank}
              timeout={reactionTimeout}
            >
              <ActionBarButton
                slot="action"
                tooltip="Pong"
                disabled={() =>
                  isSelfTurn() ||
                  reacted() ||
                  (selfPlayerInfo()?.tiles?.filter(
                    (tile) =>
                      lastDiscard() != null &&
                      TileClass.equal(tile, lastDiscard()!)
                  ).length ?? 0) < 2
                }
                onclick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Reaction]: {
                          pongKong: [
                            selfPlayerInfo()!.index!,
                            ...selfPlayerInfo()!
                              .tiles!.map((tile, i) => [tile, i] as const)
                              .filter(
                                ([tile]) =>
                                  lastDiscard() != null &&
                                  TileClass.equal(tile, lastDiscard()!)
                              )
                              .map(([_, i]) => i)
                              .slice(0, 2),
                          ],
                        },
                      },
                    },
                  });
                }}
              >
                <PongIcon alt="Pong" />
              </ActionBarButton>

              <ActionBarButton
                slot="action"
                tooltip="Kong"
                disabled={() =>
                  isSelfTurn() ||
                  reacted() ||
                  (this.props
                    .ownPlayerInfo()
                    ?.tiles.filter(
                      (tile) =>
                        lastDiscard() != null &&
                        TileClass.equal(tile, lastDiscard()!)
                    ).length ?? 0) < 3
                }
                onclick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Reaction]: {
                          pongKong: [
                            selfPlayerInfo()!.index!,
                            ...selfPlayerInfo()!
                              .tiles!.map((tile, i) => [tile, i] as const)
                              .filter(
                                ([tile]) =>
                                  lastDiscard() != null &&
                                  TileClass.equal(tile, lastDiscard()!)
                              )
                              .map(([_, i]) => i)
                              .slice(0, 3),
                          ],
                        },
                      },
                    },
                  });
                }}
              >
                <KongIcon alt="Kong" />
              </ActionBarButton>

              <ActionBarButton
                slot="action"
                tooltip="Win"
                disabled={() => isSelfTurn() || reacted()}
                onButtonClick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Reaction]: {
                          win: [selfPlayerInfo()!.index!],
                        },
                      },
                    },
                  });
                }}
              >
                <WinIcon alt="Win" />
              </ActionBarButton>
            </ReactionWindow>
          </If>

          <For each={reactions} key={(reaction) => reaction.playerIndex}>
            {(reaction, i) => (
              <ReactionBar
                style={{
                  "--y-offset": i,
                }}
                avatar={() =>
                  avatarList[
                    orderedPlayers()[reaction().playerIndex]?.avatar ?? 0
                  ]
                }
              >
                <If condition={() => reaction().type === "kong"}>
                  <KongIcon />
                </If>
                <ElseIf condition={() => reaction().type === "pong"}>
                  <PongIcon />
                </ElseIf>
                <ElseIf condition={() => reaction().type === "win"}>
                  <WinIcon />
                </ElseIf>
              </ReactionBar>
            )}
          </For>
        </div>

        <div part="self">
          <PlayerRow
            name={() => selfPlayerInfo()?.name ?? ""}
            minimal
            avatar={() => getAvatarUrl(selfPlayerInfo()?.avatar ?? 0)}
            current={isSelfTurn}
            dealer={() =>
              this.props.ownPlayerId() === this.props.gameInfo()?.dealer
            }
            score={() => selfPlayerInfo()?.score ?? 0}
          >
            <TileRow slot="discards">
              <For
                each={() => {
                  const lastDiscardInfo =
                    this.props.gameInfo()?.lastDiscardInfo;

                  return (selfPlayerInfo()?.order ?? []).map(([type, i]) =>
                    type === "discard"
                      ? {
                          ...selfPlayerInfo()!.discards![i],
                          highlight:
                            lastDiscardInfo?.[0] === this.props.ownPlayerId() &&
                            lastDiscardInfo?.[1] === i,
                        }
                      : selfPlayerInfo()!.melds![i]
                  );
                }}
              >
                {(tileOrMeld) => (
                  <>
                    <If condition={() => Array.isArray(tileOrMeld())}>
                      <TileStack>
                        <For each={tileOrMeld as Signal<TileClass[]>}>
                          {(tile) => (
                            <Tile
                              animateEnter
                              sounds
                              suit={() => tile().suit}
                              rank={() => tile().rank}
                            />
                          )}
                        </For>
                      </TileStack>
                    </If>
                    <Else>
                      <Tile
                        animateEnter
                        sounds
                        highlight={() =>
                          (tileOrMeld() as { highlight: boolean }).highlight
                        }
                        suit={() => (tileOrMeld() as ITile).suit}
                        rank={() => (tileOrMeld() as ITile).rank}
                      />
                    </Else>
                  </>
                )}
              </For>
            </TileRow>

            <If
              condition={() =>
                (this.props.ownPlayerInfo()?.tiles.length ?? 0) > 0
              }
            >
              <TileRow slot="tiles">
                <For each={() => selfPlayerInfo().tiles ?? []}>
                  {(tile, i) => (
                    <Tile
                      animateEnter
                      sounds
                      glow={() =>
                        !!this.props
                          .gameInfo()
                          ?.jokers.some((joker) =>
                            TileClass.equal(joker, tile())
                          )
                      }
                      suit={() => tile().suit}
                      rank={() => tile().rank}
                      selected={() => selectedTileIndices().includes(i())}
                      onclick={() => {
                        playPopSound();

                        setSelectedTileIndices((indices) =>
                          indices.includes(i())
                            ? indices.filter((index) => index !== i())
                            : this.props.gameInfo()?.phase !== Phase.Pull ||
                                indices.length !== 1 ||
                                lastDiscard() == null ||
                                !TileClass.isSet(
                                  TileClass.fromJSON(lastDiscard()!),
                                  TileClass.fromJSON(tile()),
                                  TileClass.fromJSON(
                                    this.props.ownPlayerInfo()!.tiles[
                                      indices[0]
                                    ]
                                  )
                                )
                              ? [i()]
                              : [...indices, i()]
                        );
                      }}
                    />
                  )}
                </For>
              </TileRow>
            </If>

            <div slot="player-extra" style={{ flex: 1 }} />
            <span slot="player-extra" class="rounds">
              {() => this.props.gameInfo()?.round ?? 1}/
              {() => this.props.gameInfo()?.maxRound ?? 1}
            </span>
            <Tile
              sounds
              slot="player-extra"
              class="joker"
              title="Joker"
              suit={() => this.props.gameInfo()?.jokers[0].suit}
              rank={() => this.props.gameInfo()?.jokers[0].rank}
              glow
            />
          </PlayerRow>

          <ActionBar>
            <If condition={() => !isSelfTurn() || phase() !== Phase.Push}>
              <ActionBarButton
                tooltip="Draw"
                disabled={() => !isSelfTurn() || phase() !== Phase.Pull}
                onButtonClick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Pull]: { draw: [] },
                      },
                    },
                  });
                }}
              >
                <DrawIcon alt="Draw" />
              </ActionBarButton>
            </If>
            <Else>
              <ActionBarButton
                tooltip="Discard"
                disabled={() =>
                  !isSelfTurn() ||
                  phase() !== Phase.Push ||
                  selectedTileIndices().length !== 1
                }
                onButtonClick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Push]: {
                          discard: [selectedTileIndices()[0]],
                        },
                      },
                    },
                  });

                  setSelectedTileIndices([]);
                }}
              >
                <DiscardIcon alt="Discard" />
              </ActionBarButton>
            </Else>

            <ActionBarButton
              tooltip="Eat"
              disabled={() =>
                !isSelfTurn() ||
                phase() !== Phase.Pull ||
                selectedTileIndices().length !== 2 ||
                lastDiscard() == null ||
                this.props.ownPlayerInfo() == null ||
                !TileClass.isSet(
                  TileClass.fromJSON(lastDiscard()!),
                  ...(selectedTileIndices().map((i) =>
                    TileClass.fromJSON(this.props.ownPlayerInfo()!.tiles[i])
                  ) as [TileClass, TileClass])
                )
              }
              onButtonClick={() => {
                webSocketHook.sendMessage({
                  game: {
                    operation: {
                      [Phase.Pull]: {
                        eat: selectedTileIndices() as [number, number],
                      },
                    },
                  },
                });

                setSelectedTileIndices([]);
              }}
            >
              <EatIcon alt="Eat" />
            </ActionBarButton>

            <ActionBarButton
              tooltip="Kong"
              disabled={() =>
                !isSelfTurn() ||
                (phase() !== Phase.Pull && phase() !== Phase.Push) ||
                selectedTileIndices().length !== 1 ||
                (phase() === Phase.Push
                  ? selfPlayerInfo().tiles?.filter((tile) =>
                      TileClass.equal(
                        tile,
                        selfPlayerInfo().tiles![selectedTileIndices()[0]]
                      )
                    ).length !== 4 &&
                    !selfPlayerInfo().melds?.some((meld) =>
                      meld.every((tile) =>
                        TileClass.equal(
                          tile,
                          selfPlayerInfo().tiles![selectedTileIndices()[0]]
                        )
                      )
                    )
                  : this.props.gameInfo()?.lastDiscard == null ||
                    selfPlayerInfo().tiles?.filter((tile) =>
                      TileClass.equal(tile, this.props.gameInfo()!.lastDiscard!)
                    ).length !== 3)
              }
              onButtonClick={() => {
                if (phase() === Phase.Pull) {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [Phase.Pull]: {
                          kong: selfPlayerInfo()
                            .tiles!.map((tile, i) => [tile, i] as const)
                            .filter(([tile]) =>
                              TileClass.equal(
                                tile,
                                this.props.gameInfo()!.lastDiscard!
                              )
                            )
                            .map(([_, i]) => i) as [number, number, number],
                        },
                      },
                    },
                  });
                } else if (phase() === Phase.Push) {
                  const ownKongIndices = selfPlayerInfo()
                    .tiles!.map((tile, i) => [tile, i] as const)
                    .filter(([tile]) =>
                      TileClass.equal(
                        tile,
                        selfPlayerInfo().tiles![selectedTileIndices()[0]]
                      )
                    )
                    .map(([_, i]) => i);

                  if (ownKongIndices.length === 4) {
                    webSocketHook.sendMessage({
                      game: {
                        operation: {
                          [Phase.Push]: {
                            kong: ownKongIndices as [
                              number,
                              number,
                              number,
                              number,
                            ],
                          },
                        },
                      },
                    });
                  } else {
                    const meldIndex = selfPlayerInfo().melds!.findIndex(
                      (meld) =>
                        meld.every((tile) =>
                          TileClass.equal(
                            tile,
                            selfPlayerInfo().tiles![selectedTileIndices()[0]]
                          )
                        )
                    );

                    webSocketHook.sendMessage({
                      game: {
                        operation: {
                          [Phase.Push]: {
                            meldKong: [selectedTileIndices()[0], meldIndex],
                          },
                        },
                      },
                    });
                  }
                }

                setSelectedTileIndices([]);
              }}
            >
              <KongIcon alt="Kong" />
            </ActionBarButton>

            <ActionBarButton
              tooltip="Win"
              disabled={() =>
                !isSelfTurn() ||
                (phase() !== Phase.Pull && phase() !== Phase.Push) ||
                (lastDiscard() == null && phase() === Phase.Pull)
              }
              onButtonClick={() => {
                webSocketHook.sendMessage({
                  game: { operation: { [phase()!]: { win: [] } } },
                });

                setSelectedTileIndices([]);
              }}
            >
              <WinIcon alt="Win" />
            </ActionBarButton>
          </ActionBar>
        </div>

        <If condition={() => this.props.scoreInfo() != null}>
          <ScoreScroll
            tiles={() =>
              (this.props.scoreInfo()?.tiles ?? []).concat(
                this.props.gameInfo()?.kongDiscard ??
                  this.props.gameInfo()?.lastDiscard ??
                  []
              )
            }
            melds={() => this.props.scoreInfo()?.melds ?? []}
            jokers={() => this.props.gameInfo()?.jokers ?? []}
            avatars={() => orderedPlayers().map((player) => player.avatar)}
            winModifiers={() => this.props.scoreInfo()?.winModifiers ?? []}
            jokerBonusModifiers={() =>
              this.props.scoreInfo()?.jokerBonusModifiers ?? []
            }
            showSakura={() =>
              this.props.gameInfo()?.currentPlayer ===
                this.props.ownPlayerId() &&
              !this.props
                .scoreInfo()
                ?.winModifiers.flat()
                .some((modifier) => modifier[0] === ScoreModifierType.FalseWin)
            }
          />
        </If>

        <If condition={() => phase() === Phase.End}>
          <EndScreen
            achievement={() =>
              this.props.endInfo()?.[this.props.ownPlayerId()!].achievement ??
              null
            }
            players={() =>
              orderedPlayers().map((player) => ({
                name: player.name,
                avatar: getAvatarUrl(player.avatar),
                score: this.props.gamePlayersInfo()?.[player.id]?.score,
                achievement: this.props.endInfo()?.[player.id]?.achievement,
              }))
            }
          />
        </If>

        <Style>{css`
          :host {
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          @keyframes enter-player {
            from {
              transform: translateY(1em);
              opacity: 0;
            }
          }
          [part="players"] {
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: safe center;
            gap: 0.2em;
            padding-bottom: 0.2em;
            overflow: auto;
            scroll-snap-type: y proximity;
          }
          [part="players"] > mj-player-row {
            scroll-snap-align: center;
            animation: 0.5s backwards enter-player;
          }

          mj-reaction-window {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }

          @keyframes enter-self {
            from {
              transform: translateY(100%);
            }
          }
          [part="self"] {
            --action-bar-icon-color: #35de7b;
            --action-bar-icon-disabled-color: #808f85;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding-bottom: max(0.5em, env(safe-area-inset-bottom));
            background-color: rgba(0, 0, 0, 0.9);
            animation: 0.5s enter-self;
          }
          [part="self"] .rounds {
            opacity: 0.7;
          }
          [part="self"] .joker {
            font-size: 0.7em;
            margin-right: 0.5em;
          }
          [part="self"] > mj-player-row {
            --player-row-background-color: transparent;
            -webkit-backdrop-filter: unset;
            backdrop-filter: unset;
          }
          [part="self"] [slot="tiles"] {
            --tile-width: initial;
            align-self: center;
            order: 2;
            margin-bottom: 0.5em;
            font-size: 0.9em;
          }
          [part="self"] [slot="tiles"] > mj-tile {
            cursor: pointer;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", GamePage);
