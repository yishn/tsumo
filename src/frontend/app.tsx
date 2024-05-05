import { Component, For, Style, css, defineComponents } from "sinho";
import { PlayerRow } from "./components/player-row.tsx";
import { generateShuffledFullDeck } from "../core/game-state.ts";
import { Tile as TileClass } from "../core/tile.ts";
import { Tile } from "./components/tile.tsx";
import { TileRow } from "./components/tile-row.tsx";
import { TileSuit } from "../core/tile.ts";
import { TileStack } from "./components/tile-stack.tsx";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <div part="players">
          <PlayerRow
            name="East"
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
              <For each={[...Array(10)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>

          <PlayerRow name="South" avatar="./assets/avatars/boar.png" score={50}>
            <TileRow slot="discards">
              <TileStack>
                <Tile suit={TileSuit.Myriad} rank={3} />
                <Tile suit={TileSuit.Myriad} rank={4} />
                <Tile suit={TileSuit.Myriad} rank={5} />
              </TileStack>
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(11)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>

          <PlayerRow name="West" avatar="./assets/avatars/dog.png" score={50}>
            <TileRow slot="discards">
              <Tile suit={TileSuit.Myriad} rank={1} />
              <Tile suit={TileSuit.Bamboo} rank={2} />
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>
        </div>

        <div part="self">
          <PlayerRow
            name="North"
            avatar="./assets/avatars/dragon.png"
            score={50}
          >
            <TileRow slot="discards">
              <Tile />
            </TileRow>
          </PlayerRow>

          <TileRow>
            <For
              each={generateShuffledFullDeck()
                .slice(0, 13)
                .sort(TileClass.sort)}
            >
              {(item) => (
                <Tile suit={() => item().suit} rank={() => item().rank} />
              )}
            </For>
          </TileRow>
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
            overflow: hidden;
          }

          body {
            font-family: "Alegreya", "KaiTi", serif;
            font-size: 1.2em;
            min-height: 100dvh;
            cursor: default;
            user-select: none;
            overflow: hidden;
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
            padding: 0.2em 0;
            overflow: auto;
          }

          [part="self"] {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding-bottom: 2em;
            background-color: rgba(0, 0, 0, 0.8);
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
          }
          [part="self"] > mj-player-row {
            background-color: transparent;
            -webkit-backdrop-filter: unset;
            backdrop-filter: unset;
          }
          [part="self"] > mj-tile-row {
            align-self: center;
            padding: 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
