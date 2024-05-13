import {
  Component,
  For,
  Style,
  css,
  defineComponents,
  prop,
  useMemo,
  useSignal,
} from "sinho";
import {
  DrawIcon,
  EatIcon,
  KongIcon,
  WinIcon,
  getAvatarUrl,
} from "../assets.ts";
import { ActionBar, ActionBarButton } from "../components/action-bar.tsx";
import { PlayerRow } from "../components/player-row.tsx";
import { Tile } from "../components/tile.tsx";
import { TileRow } from "../components/tile-row.tsx";
import { playPopSound } from "../sounds.ts";
import {
  TileSuit,
  Tile as TileClass,
  generateShuffledFullDeck,
} from "../../core/main.ts";
import { PlayerInfo } from "../../shared/message.ts";
import { diceSort } from "../../shared/utils.ts";

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
}) {
  render() {
    const [selectedTileIndex, setSelectedTileIndex] = useSignal<number>(-1);
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
    const selfPlayerInfo = useMemo(() =>
      this.props
        .players()
        .find((player) => player.id === this.props.ownPlayerId())
    );

    return (
      <>
        <div part="players">
          <For each={remotePlayerInfos}>
            {(player, i) => (
              <PlayerRow
                style={{ animationDelay: `${i() * 0.1}s` }}
                name={() => player().name ?? ""}
                avatar={() => getAvatarUrl(player().avatar)}
                dealer={false}
                loading={() => this.props.deadPlayers().includes(player().id)}
                score={50}
              >
                <TileRow slot="discards"></TileRow>

                <TileRow slot="tiles" minimal>
                  <For each={() => [...Array(13)]}>
                    {() => <Tile back animateEnter />}
                  </For>
                </TileRow>
              </PlayerRow>
            )}
          </For>
        </div>

        <div part="self">
          <PlayerRow
            name={() => selfPlayerInfo()?.name ?? ""}
            minimal
            avatar={() => getAvatarUrl(selfPlayerInfo()?.avatar ?? 0)}
            score={50}
          >
            <TileRow slot="discards">
              <Tile />
            </TileRow>

            <TileRow slot="tiles">
              <For
                each={generateShuffledFullDeck()
                  .slice(0, 13)
                  .sort(TileClass.sort)}
              >
                {(item, i) => (
                  <Tile
                    animateEnter
                    glow={() => i() <= 1}
                    suit={() => item().suit}
                    rank={() => item().rank}
                    selected={() => selectedTileIndex() === i()}
                    onclick={() => {
                      if (selectedTileIndex() !== i()) {
                        playPopSound();
                      }
                      setSelectedTileIndex(i());
                    }}
                  />
                )}
              </For>
            </TileRow>
          </PlayerRow>

          <ActionBar>
            <ActionBarButton tooltip="Draw">
              <DrawIcon alt="Draw" />
            </ActionBarButton>
            <ActionBarButton tooltip="Eat">
              <EatIcon alt="Eat" />
            </ActionBarButton>
            <ActionBarButton tooltip="Kong">
              <KongIcon alt="Kong" />
            </ActionBarButton>
            <ActionBarButton disabled tooltip="Win">
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
            background-color: rgba(0, 0, 0, 0.8);
            animation: 0.5s enter-self;
          }
          [part="self"] > mj-player-row {
            --player-row-background-color: transparent;
            -webkit-backdrop-filter: unset;
            backdrop-filter: unset;
          }
          [part="self"] mj-tile-row[slot="tiles"] {
            --tile-width: initial;
            align-self: center;
            order: 2;
            margin-bottom: 0.5em;
            font-size: 0.9em;
          }
          [part="self"] mj-tile-row[slot="tiles"] > mj-tile {
            cursor: pointer;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", GamePage);
