import { Component, css, defineComponents, prop, Style } from "sinho";

export class FormRow extends Component("form-row", {
  label: prop<string>(""),
}) {
  render() {
    return (
      <>
        <div part="label">{this.props.label}</div>
        <slot />

        <Style>{css`
          :host {
            display: flex;
            align-items: center;
            gap: 0.5em;
            margin: 0.5em 0;
          }

          [part="label"] {
            flex: 1;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", FormRow);
