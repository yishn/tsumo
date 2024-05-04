import { Component, Style, css, defineComponents } from "sinho";

export class TileRow extends Component("tile-row") {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            display: flex;
            gap: 0.2em;
            flex-wrap: wrap;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileRow);
