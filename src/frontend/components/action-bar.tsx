import { Component, Style, css, defineComponents, event, prop } from "sinho";

export class ActionBarButton extends Component("action-bar-button", {
  disabled: prop<boolean>(false, { attribute: () => true }),
  onButtonClick: event(MouseEvent),
}) {
  render() {
    return (
      <>
        <button
          disabled={this.props.disabled}
          onclick={(evt) => {
            evt.preventDefault();
            this.events.onButtonClick(evt);
          }}
        >
          <slot />
        </button>

        <Style>{css`
          button {
            border: none;
            padding: 0 0.2em;
            background: none;
            cursor: pointer;
            touch-action: manipulation;
          }
          button:disabled {
            cursor: not-allowed;
            --action-bar-icon-color: var(--action-bar-icon-disabled-color);
          }
          button:not(:disabled):active {
            opacity: 0.5;
          }

          ::slotted(svg) {
            fill: var(--action-bar-icon-color);
            stroke: var(--action-bar-icon-color);
            width: 1.8em;
            height: 1.8em;
            overflow: visible;
          }
        `}</Style>
      </>
    );
  }
}

export class ActionBar extends Component("action-bar") {
  render() {
    return (
      <>
        <slot />

        <Style>{css`
          :host {
            --action-bar-icon-color: #35de7b;
            --action-bar-icon-disabled-color: #808f85;
            display: flex;
            justify-content: center;
            gap: 2em;
            padding: 0 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ActionBarButton, ActionBar);
