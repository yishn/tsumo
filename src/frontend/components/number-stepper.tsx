import { Component, css, defineComponents, event, prop, Style } from "sinho";

export class NumberStepper extends Component("number-stepper", {
  value: prop<number>(0),
  valuePrefix: prop<string>(""),
  valueSuffix: prop<string>(""),
  min: prop<number>(-Infinity),
  max: prop<number>(Infinity),
  onIncrement: event(),
  onDecrement: event(),
}) {
  render() {
    return (
      <>
        <button
          type="button"
          onclick={() => this.events.onDecrement()}
          ontouchstart={() => {}}
        >
          -
        </button>

        <span>
          {this.props.valuePrefix}
          {this.props.value}
          {this.props.valueSuffix}
        </span>

        <button
          type="button"
          onclick={() => this.events.onIncrement()}
          ontouchstart={() => {}}
        >
          +
        </button>

        <Style>{css`
          :host {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.1em;
            border-radius: 0.3em;
            background-color: rgba(255, 255, 255, 0.2);
            overflow: hidden;
          }

          span {
            flex: 1;
            font-variant-numeric: tabular-nums;
          }

          button {
            border: none;
            border-radius: 0.2em;
            padding: 0 0.5em;
            background-color: transparent;
            font: var(--app-font);
            font-size: 1em;
            cursor: pointer;
            touch-action: manipulation;
            transition: 0.2s background-color;
          }
          button:active {
            background-color: #11a923;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", NumberStepper);
