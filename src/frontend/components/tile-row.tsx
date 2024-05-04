import { Component, Style, css, defineComponents } from "sinho";

export class TileRowComponent extends Component("tile-row") {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            display: flex;
            gap: 0.2em;
            flex-wrap: wrap;
            padding: 1em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileRowComponent);
