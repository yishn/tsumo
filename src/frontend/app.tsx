import { Component, For, Style, css, defineComponents } from "sinho";
import { Tile, TileSuit } from "../core/tile.ts";
import { TileRowComponent } from "./components/tile-row.tsx";
import { TileComponent } from "./components/tile.tsx";
import { TileStackComponent } from "./components/tile-stack.tsx";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <div class="container">
          <TileRowComponent>
            <For
              each={[TileSuit.Wind, TileSuit.Dragon].flatMap((suit) =>
                [...Array(suit === TileSuit.Wind ? 4 : 3)].map(
                  (_, i) => new Tile(suit, i + 1)
                )
              )}
            >
              {(tile) => (
                <TileComponent
                  suit={() => tile().suit}
                  rank={() => tile().rank}
                />
              )}
            </For>

            <For each={[TileSuit.Bamboo, TileSuit.Circle, TileSuit.Myriad]}>
              {(suit) => (
                <TileStackComponent>
                  <For
                    each={() =>
                      [...Array(3)].map((_, i) => new Tile(suit(), i + 4))
                    }
                  >
                    {(tile) => (
                      <TileComponent
                        suit={() => tile().suit}
                        rank={() => tile().rank}
                      />
                    )}
                  </For>
                </TileStackComponent>
              )}
            </For>
            <TileComponent back suit={TileSuit.Dragon} rank={3} />
          </TileRowComponent>
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
            background-color: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(0.5em);
            height: 100vh;
            overflow: hidden;
            cursor: default;
            user-select: none;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
