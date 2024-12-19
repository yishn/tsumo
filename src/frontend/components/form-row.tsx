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
          }

          [part="label"] {
            flex: 1;
            padding: 0.2em 0;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", FormRow);
