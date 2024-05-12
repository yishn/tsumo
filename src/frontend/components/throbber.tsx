import { Component, Style, css, defineComponents } from "sinho";

export class Throbber extends Component("throbber") {
  render() {
    return (
      <>
        <div></div>
        <div></div>
        <div></div>
        <div></div>

        <Style>{css`
          * {
            box-sizing: border-box;
          }

          :host {
            --throbber-size: 80px;
            display: inline-block;
            position: relative;
            width: var(--throbber-size);
            height: var(--throbber-size);
          }
          :host div {
            position: absolute;
            top: calc(0.4166 * var(--throbber-size));
            width: calc(0.1666 * var(--throbber-size));
            height: calc(0.1666 * var(--throbber-size));
            border-radius: 50%;
            background: currentColor;
            animation-timing-function: cubic-bezier(0, 1, 1, 0);
          }
          :host div:nth-child(1) {
            left: calc(0.1 * var(--throbber-size));
            animation: 0.6s infinite lds-ellipsis1;
          }
          :host div:nth-child(2) {
            left: calc(0.1 * var(--throbber-size));
            animation: 0.6s infinite lds-ellipsis2;
          }
          :host div:nth-child(3) {
            left: calc(0.4 * var(--throbber-size));
            animation: 0.6s infinite lds-ellipsis2;
          }
          :host div:nth-child(4) {
            left: calc(0.7 * var(--throbber-size));
            animation: 0.6s infinite lds-ellipsis3;
          }
          @keyframes lds-ellipsis1 {
            0% {
              transform: scale(0);
            }
            100% {
              transform: scale(1);
            }
          }
          @keyframes lds-ellipsis3 {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(0);
            }
          }
          @keyframes lds-ellipsis2 {
            0% {
              transform: translate(0, 0);
            }
            100% {
              transform: translate(calc(0.3 * var(--throbber-size)), 0);
            }
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", Throbber);
