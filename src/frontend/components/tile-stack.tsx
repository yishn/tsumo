import { Component, Style, css, defineComponents } from "sinho";

export class TileStackComponent extends Component("tile-stack") {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            display: inline-flex;
          }

          ::slotted(mj-tile:not(:first-child)) {
            margin-left: -1.3em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileStackComponent);
