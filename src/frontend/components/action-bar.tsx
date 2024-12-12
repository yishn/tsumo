import { Component, Style, css, defineComponents, event, prop } from "sinho";

export class ActionBarButton extends Component("action-bar-button", {
  tooltip: prop<string>(),
  disabled: prop<boolean>(false, { attribute: () => true }),
  onButtonClick: event(MouseEvent),
}) {
  render() {
    return (
      <>
        <button
          part="button"
          title={() => this.props.tooltip() ?? ""}
          disabled={this.props.disabled}
          onclick={(evt) => {
            evt.preventDefault();
            this.events.onButtonClick(evt);
          }}
        >
          <slot />
        </button>

        <Style>{css`
          :host {
            --_action-bar-icon-color: var(
              --action-bar-icon-color,
              currentColor
            );
            --_action-bar-icon-disabled-color: var(
              --action-bar-icon-disabled-color,
              currentColor
            );
            display: inline-flex;
          }

          button {
            display: inline-flex;
            border: none;
            padding: 0 0.2em;
            background: none;
            cursor: pointer;
            font: var(--app-font);
            font-size: 1em;
            color: var(--_action-bar-icon-color);
            touch-action: manipulation;
          }
          button:disabled {
            cursor: not-allowed;
            --_action-bar-icon-color: var(--_action-bar-icon-disabled-color);
          }
          button:not(:disabled):active {
            opacity: 0.5;
          }

          ::slotted(svg) {
            fill: var(--_action-bar-icon-color);
            stroke: var(--_action-bar-icon-color);
            stroke-width: 0;
            width: 1.25em;
            height: 1.25em;
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
            display: flex;
            justify-content: safe center;
            gap: 2em;
            padding: 0 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ActionBarButton, ActionBar);
