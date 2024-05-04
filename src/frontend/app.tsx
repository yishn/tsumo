import { Component, For, Style, css, defineComponents } from "sinho";
import { TileComponent } from "./components/tile.tsx";
import { TileSuit } from "../core/tile.ts";

export class App extends Component("app") {
  render() {
    return (
      <>
        <For each={[...Array(14)]}>
          {() => <TileComponent suit={TileSuit.Bamboo} rank={5} />}
        </For>

        <Style light>{css`
          * {
            margin: 0;
            padding: 0;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", App);
