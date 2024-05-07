import { Component, Style, css, defineComponents, prop } from "sinho";

export class TileRow extends Component("tile-row", {
  minimal: prop<boolean>(false, { attribute: () => true }),
}) {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            display: flex;
            gap: ${() => (this.props.minimal() ? 0 : "0.2em")};
            flex-wrap: wrap;
            padding-bottom: 0.8em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileRow);
