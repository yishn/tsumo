import {
  Component,
  Else,
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
  getAvatarUrl,
} from "../assets.ts";
import { ActionBar, ActionBarButton } from "../components/action-bar.tsx";
import { PlayerRow } from "../components/player-row.tsx";
import { Tile } from "../components/tile.tsx";
import { TileRow } from "../components/tile-row.tsx";
import { playPopSound, playShuffleSound } from "../sounds.ts";
import { ITile, PhaseName, Tile as TileClass } from "../../core/main.ts";
import {
  GameInfo,
  PlayerInfo,
  GamePlayersInfo,
  GamePlayerInfo,
} from "../../shared/message.ts";
import { diceSort } from "../../shared/utils.ts";
import { webSocketHook } from "../global-state.ts";
import { TileStack } from "../components/tile-stack.tsx";
import { ReactionWindow } from "../components/reaction-window.tsx";
import { reactionTimeout } from "../../shared/constants.ts";

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
}) {
  render() {
    const remotePlayerInfos = useMemo(() => {
      const sorted = [...this.props.players()].sort((a, b) =>
        diceSort(a.dice ?? [0, 0], b.dice ?? [0, 0])
      );
      const ownIndex = sorted.findIndex(
        (player) => player.id === this.props.ownPlayerId()
      );

      if (ownIndex >= 0) {
        const remotePlayers = sorted.filter((_, i) => i !== ownIndex);

        for (let i = 0; i < sorted.length - ownIndex - 1; i++) {
          remotePlayers.unshift(remotePlayers.pop()!);
        }

        return remotePlayers;
      }

      return sorted;
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

    useEffect(() => {
      if (this.props.gameInfo()?.phase === PhaseName.Deal) {
        playShuffleSound();
      }
    });

    const [selectedTileIndices, setSelectedTileIndices] = useSignal<number[]>(
      []
    );

    useEffect(() => {
      setSelectedTileIndices(
        this.props.ownPlayerInfo()?.lastDrawnTileIndex == null
          ? []
          : [this.props.ownPlayerInfo()!.lastDrawnTileIndex!]
      );
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
                score={() => selfPlayerInfo()?.score ?? 0}
              >
                <TileRow slot="discards">
                  <For
                    each={() => {
                      const gamePlayerInfo =
                        this.props.gamePlayersInfo()?.[player().id];
                      const lastDiscardInfo =
                        this.props.gameInfo()?.lastDiscardInfo;

                      return (gamePlayerInfo?.order ?? []).map(([type, i]) =>
                        type === "discard"
                          ? {
                              ...gamePlayerInfo!.discards[i],
                              highlight:
                                lastDiscardInfo?.[0] === player().id &&
                                lastDiscardInfo?.[1] === i,
                            }
                          : gamePlayerInfo!.melds[i]
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
                      {() => <Tile back animateEnter />}
                    </For>
                  </TileRow>
                </If>
              </PlayerRow>
            )}
          </For>

          <If condition={() => phase() === PhaseName.Reaction}>
            <ReactionWindow
              suit={() => lastDiscard()?.suit}
              rank={() => lastDiscard()?.rank}
              timeout={reactionTimeout}
            >
              <ActionBarButton
                slot="action"
                tooltip="Pong"
                disabled={() =>
                  isSelfTurn() ||
                  (selfPlayerInfo()?.tiles?.filter(
                    (tile) =>
                      tile.suit === lastDiscard()?.suit &&
                      tile.rank === lastDiscard()?.rank
                  ).length ?? 0) < 2
                }
                onclick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [PhaseName.Reaction]: {
                          pongKong: [
                            selfPlayerInfo()!.index!,
                            ...selfPlayerInfo()!
                              .tiles!.filter(
                                (tile) =>
                                  tile.suit === lastDiscard()?.suit &&
                                  tile.rank === lastDiscard()?.rank
                              )
                              .map((_, i) => i)
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
                  (this.props
                    .ownPlayerInfo()
                    ?.tiles.filter(
                      (tile) =>
                        tile.suit === lastDiscard()?.suit &&
                        tile.rank === lastDiscard()?.rank
                    ).length ?? 0) < 3
                }
                onclick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [PhaseName.Reaction]: {
                          pongKong: [
                            selfPlayerInfo()!.index!,
                            ...selfPlayerInfo()!
                              .tiles!.filter(
                                (tile) =>
                                  tile.suit === lastDiscard()?.suit &&
                                  tile.rank === lastDiscard()?.rank
                              )
                              .map((_, i) => i)
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
                disabled={() => isSelfTurn()}
              >
                <WinIcon alt="Win" />
              </ActionBarButton>
            </ReactionWindow>
          </If>
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
                <For each={() => this.props.ownPlayerInfo()?.tiles ?? []}>
                  {(tile, i) => (
                    <Tile
                      animateEnter
                      glow={() =>
                        !!this.props
                          .gameInfo()
                          ?.jokers.some(
                            (joker) =>
                              joker.suit === tile().suit &&
                              joker.rank === tile().rank
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
                            : this.props.gameInfo()?.phase !==
                                  PhaseName.Action ||
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
              slot="player-extra"
              class="joker"
              title="Joker"
              suit={() => this.props.gameInfo()?.jokers[0].suit}
              rank={() => this.props.gameInfo()?.jokers[0].rank}
              glow
            />
          </PlayerRow>

          <ActionBar>
            <If
              condition={() => !isSelfTurn() || phase() !== PhaseName.EndAction}
            >
              <ActionBarButton
                tooltip="Draw"
                disabled={() => !isSelfTurn() || phase() !== PhaseName.Action}
                onButtonClick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [PhaseName.Action]: { draw: [] },
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
                  phase() !== PhaseName.EndAction ||
                  selectedTileIndices().length !== 1
                }
                onButtonClick={() => {
                  webSocketHook.sendMessage({
                    game: {
                      operation: {
                        [PhaseName.EndAction]: {
                          discard: [selectedTileIndices()[0]],
                        },
                      },
                    },
                  });
                }}
              >
                <DiscardIcon alt="Discard" />
              </ActionBarButton>
            </Else>

            <ActionBarButton
              tooltip="Eat"
              disabled={() =>
                !isSelfTurn() ||
                phase() !== PhaseName.Action ||
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
                      [PhaseName.Action]: {
                        eat: selectedTileIndices() as [number, number],
                      },
                    },
                  },
                });
              }}
            >
              <EatIcon alt="Eat" />
            </ActionBarButton>

            <ActionBarButton
              tooltip="Kong"
              disabled={() =>
                !isSelfTurn() ||
                phase() !== PhaseName.Action ||
                phase() !== PhaseName.EndAction
              }
            >
              <KongIcon alt="Kong" />
            </ActionBarButton>

            <ActionBarButton
              tooltip="Win"
              disabled={() =>
                !isSelfTurn() ||
                phase() !== PhaseName.Action ||
                phase() !== PhaseName.EndAction
              }
            >
              <WinIcon alt="Win" />
            </ActionBarButton>
          </ActionBar>
        </div>

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
            animation: 0.5s enter-player both;
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
