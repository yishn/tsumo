import { Component, For, Style, css, defineComponents, useSignal } from "sinho";
import { DrawIcon, EatIcon, KongIcon, WinIcon } from "../assets.ts";
import { ActionBar, ActionBarButton } from "../components/action-bar.tsx";
import { PlayerRow } from "../components/player-row.tsx";
import { Tile } from "../components/tile.tsx";
import { TileRow } from "../components/tile-row.tsx";
import { TileStack } from "../components/tile-stack.tsx";
import { playPopSound } from "../sounds.ts";
import {
  TileSuit,
  Tile as TileClass,
  generateShuffledFullDeck,
} from "../../core/main.ts";

export class GamePage extends Component("game-page") {
  render() {
    const [selectedTileIndex, setSelectedTileIndex] = useSignal<number>(-1);

    return (
      <>
        <div part="players">
          <PlayerRow
            style={{ animationDelay: "0s" }}
            name="East"
            dealer
            avatar="./assets/avatars/monkey.png"
            score={50}
          >
            <TileRow slot="discards">
              <Tile suit={TileSuit.Bamboo} rank={1} />
              <Tile suit={TileSuit.Circle} rank={9} />
              <TileStack>
                <Tile suit={TileSuit.Wind} rank={4} />
                <Tile suit={TileSuit.Wind} rank={4} />
                <Tile suit={TileSuit.Wind} rank={4} />
                <Tile suit={TileSuit.Wind} rank={4} />
              </TileStack>
            </TileRow>

            <TileRow slot="tiles" minimal>
              <For each={[...Array(11)]}>
                {() => <Tile back animateEnter />}
              </For>
            </TileRow>
          </PlayerRow>

          <PlayerRow
            style={{ animationDelay: "0.1s" }}
            name="South"
            current
            avatar="./assets/avatars/boar.png"
            score={50}
          >
            <TileRow slot="discards">
              <TileStack>
                <Tile suit={TileSuit.Myriad} rank={3} />
                <Tile suit={TileSuit.Myriad} rank={4} />
                <Tile suit={TileSuit.Myriad} rank={5} />
              </TileStack>
              <TileStack>
                <Tile suit={TileSuit.Circle} rank={1} />
                <Tile suit={TileSuit.Circle} rank={1} />
                <Tile suit={TileSuit.Circle} rank={1} />
              </TileStack>
            </TileRow>

            <TileRow slot="tiles" minimal>
              <For each={[...Array(8)]}>{() => <Tile back animateEnter />}</For>
            </TileRow>
          </PlayerRow>

          <PlayerRow
            style={{ animationDelay: "0.2s" }}
            name="West"
            avatar="./assets/avatars/dog.png"
            score={50}
          >
            <TileRow slot="discards">
              <Tile suit={TileSuit.Myriad} rank={1} />
              <Tile suit={TileSuit.Bamboo} rank={2} highlight />
            </TileRow>

            <TileRow slot="tiles" minimal>
              <For each={[...Array(14)]}>
                {() => <Tile back animateEnter />}
              </For>
            </TileRow>
          </PlayerRow>
        </div>

        <div part="self">
          <PlayerRow
            name="North"
            minimal
            avatar="./assets/avatars/dragon.png"
            score={50}
          >
            <TileRow slot="discards">
              <Tile suit={TileSuit.Wind} rank={2} />
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
            <ActionBarButton>
              <DrawIcon alt="Draw" />
            </ActionBarButton>
            <ActionBarButton>
              <EatIcon alt="Eat" />
            </ActionBarButton>
            <ActionBarButton>
              <KongIcon alt="Kong" />
            </ActionBarButton>
            <ActionBarButton disabled>
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
            align-self: center;
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
