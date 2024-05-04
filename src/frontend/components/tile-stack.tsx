import { Component, Style, css, defineComponents } from "sinho";

export class TileStackComponent extends Component("tile-stack") {
  render() {
    return (
      <div class="tile-stack">
        <slot />

        <Style>{css`
          :host {
            display: inline-block;
          }

          .tile-stack {
            display: flex;
          }

          ::slotted(mj-tile:not(:first-child)) {
            margin-left: -1.3em;
          }
        `}</Style>
      </div>
    );
  }
}

defineComponents("mj-", TileStackComponent);
