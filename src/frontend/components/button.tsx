import clsx from "clsx";
import { Component, css, defineComponents, prop, Style } from "sinho";

export class Button extends Component("button", {
  primary: prop<boolean>(false, { attribute: () => true }),
}) {
  render() {
    return (
      <>
        <button class={() => clsx({ primary: this.props.primary() })}>
          <slot></slot>
        </button>

        <Style>{css`
          :host {
            display: inline-grid;
          }

          button {
            --button-shadow: rgba(18, 32, 26, 0.5) 0 0.2em 0.5em;
            border: none;
            border-radius: 0.3em;
            padding: 0.3em 0.5em;
            background-color: #dbe6dd;
            box-shadow:
              0 0.2em 0 #c6cdc8,
              var(--button-shadow);
            font: var(--app-font);
            font-size: 1em;
            font-style: italic;
            color: rgb(18, 32, 26);
            cursor: pointer;
            touch-action: manipulation;
            transition:
              0.2s background-color,
              0.2s box-shadow;
          }

          button:active {
            background-color: #c6cdc8;
            box-shadow:
              0 0.2em 0 #9fa7a1,
              var(--button-shadow);
          }

          button.primary {
            background-color: #11a923;
            box-shadow:
              0 0.2em 0 #077714,
              var(--button-shadow);
            color: #eee;
          }

          button.primary:active {
            background-color: #078307;
            box-shadow:
              0 0.2em 0 #015a01,
              var(--button-shadow);
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", Button);
