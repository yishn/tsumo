import { Component, For, Style, css, defineComponents, useSignal } from "sinho";
import { PlayerRow } from "./components/player-row.tsx";
import {
  TileSuit,
  Tile as TileClass,
  generateShuffledFullDeck,
} from "../core/main.ts";
import { Tile } from "./components/tile.tsx";
import { TileRow } from "./components/tile-row.tsx";
import { TileStack } from "./components/tile-stack.tsx";
import { ActionBar, ActionBarButton } from "./components/action-bar.tsx";
import { DrawIcon, EatIcon, KongIcon, WinIcon } from "./assets.ts";
import { playPopSound } from "./sounds.ts";

export class AppComponent extends Component("app") {
  render() {
    const [selectedTileIndex, setSelectedTileIndex] = useSignal<number>(-1);

    return (
      <>
        <div part="players">
          <PlayerRow
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

            <TileRow slot="tiles">
              <For each={[...Array(11)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>

          <PlayerRow
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
                <Tile suit={TileSuit.Circle} rank={2} />
                <Tile suit={TileSuit.Circle} rank={2} />
                <Tile suit={TileSuit.Circle} rank={2} />
              </TileStack>
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(8)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>

          <PlayerRow name="West" avatar="./assets/avatars/dog.png" score={50}>
            <TileRow slot="discards">
              <Tile suit={TileSuit.Myriad} rank={1} />
              <Tile suit={TileSuit.Bamboo} rank={2} highlight />
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
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

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            color-scheme: dark;
            background: url("./assets/bg.jpg") center / cover no-repeat fixed;
            padding-top: env(safe-area-inset-top);
            overflow: hidden;
            font-family: "Alegreya", "KaiTi", serif;
            font-size: 1.2em;
            cursor: default;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
            white-space: nowrap;
          }
        `}</Style>

        <Style>{css`
          :host {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          [part="players"] {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            padding-bottom: 0.2em;
            overflow: auto;
            scroll-snap-type: y proximity;
          }
          [part="players"] > mj-player-row {
            scroll-snap-align: center;
          }

          [part="self"] {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding-bottom: max(0.5em, env(safe-area-inset-bottom));
            background-color: rgba(0, 0, 0, 0.8);
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
          }
          [part="self"] > mj-player-row {
            --player-row-background-color: transparent;
            -webkit-backdrop-filter: unset;
            backdrop-filter: unset;
          }
          [part="self"] mj-tile-row[slot="tiles"] {
            align-self: center;
            gap: 0.2em;
            margin-bottom: 0.3em;
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

defineComponents("mj-", AppComponent);
