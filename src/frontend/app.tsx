import { Component, For, Style, css, defineComponents } from "sinho";
import { PlayerRow } from "./components/player-row.tsx";
import { Tile } from "./components/tile.tsx";
import { TileRow } from "./components/tile-row.tsx";
import { TileSuit } from "../core/tile.ts";
import { TileStack } from "./components/tile-stack.tsx";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <div part="players">
          <PlayerRow name="East" avatar="./assets/avatars/monkey.png" gold={50}>
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
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>
          <PlayerRow name="South" avatar="./assets/avatars/boar.png" gold={50}>
            <TileRow slot="discards">
              <TileStack>
                <Tile suit={TileSuit.Myriad} rank={3} />
                <Tile suit={TileSuit.Myriad} rank={4} />
                <Tile suit={TileSuit.Myriad} rank={5} />
              </TileStack>
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>
          <PlayerRow name="West" avatar="./assets/avatars/dog.png" gold={50}>
            <TileRow slot="discards">
              <Tile suit={TileSuit.Myriad} rank={1} />
              <TileStack>
                <Tile suit={TileSuit.Circle} rank={6} />
                <Tile suit={TileSuit.Circle} rank={7} />
                <Tile suit={TileSuit.Circle} rank={8} />
              </TileStack>
              <Tile suit={TileSuit.Bamboo} rank={2} />
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>
          <PlayerRow name="North" avatar="./assets/avatars/dragon.png" gold={50}>
            <TileRow slot="discards">
              <Tile />
            </TileRow>

            <TileRow slot="tiles">
              <For each={[...Array(14)]}>{() => <Tile back />}</For>
            </TileRow>
          </PlayerRow>
        </div>

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            background: url("./assets/bg.jpg") center / cover no-repeat fixed;
          }

          body {
            font-family: "Alegreya", "KaiTi", serif;
            font-size: 1.1em;
            background-color: rgba(0, 0, 0, 0.2);
            min-height: 100dvh;
            cursor: default;
            user-select: none;
          }
        `}</Style>

        <Style>{css`
          [part="players"] {
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            margin-top: 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
