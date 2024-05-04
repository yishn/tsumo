import { Component, For, Style, css, defineComponents } from "sinho";
import { TileComponent } from "./components/tile.tsx";
import { Tile, TileSuit } from "../core/tile.ts";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <div
          class="container"
          style={{
            display: "flex",
            gap: ".1em",
            flexWrap: "wrap",
          }}
        >
          <For
            each={[
              TileSuit.Bamboo,
              TileSuit.Circle,
              TileSuit.Myriad,
              TileSuit.Wind,
              TileSuit.Dragon,
            ].flatMap((suit) =>
              [...Array(suit === TileSuit.Wind ? 4 : 3)].map(
                (_, i) => new Tile(suit, i + 1)
              )
            )}
          >
            {(tile) => (
              <TileComponent
                suit={() => tile().suit}
                rank={() => tile().rank}
                onclick={evt => {
                  evt.currentTarget.back = !evt.currentTarget.back;
                }}
              />
            )}
          </For>
          <TileComponent back />
        </div>

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          body {
            font-family: "Alegreya", "KaiTi", serif;
          }
        `}</Style>

        <Style>{css`
          .container {
            padding: 1em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
