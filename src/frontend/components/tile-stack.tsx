import { Component, Style, css, defineComponents } from "sinho";

export class TileStack extends Component("tile-stack") {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            display: inline-flex;
          }

          ::slotted(:not(:first-child)) {
            margin-left: -1.11em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileStack);
