import { Component, Style, css, defineComponents, prop } from "sinho";

export class PlayerRow extends Component("player-row", {
  name: prop<string>(""),
  avatar: prop<string>("./assets/avatars/monkey.png"),
  gold: prop<number>(0),
}) {
  render() {
    return (
      <>
        <div part="player">
          <div part="player-name">{this.props.name}</div>
          <img part="avatar" src={this.props.avatar} alt={this.props.name} />
          <div part="gold">
            <img src="./assets/coin.png" alt="Gold" /> ×{this.props.gold}
          </div>
        </div>

        <div part="tiles">
          <slot name="discards" />
          <slot name="tiles" />
        </div>

        <Style>{css`
          :host {
            display: flex;
            align-items: flex-start;
            gap: 1em;
            background-color: rgba(0, 0, 0, 0.5);
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            padding: 0.5em;
            padding-left: max(0.5em, env(safe-area-inset-left));
            padding-right: env(safe-area-inset-left);
            color: white;
          }

          [part="player-name"] {
            font-weight: bold;
            text-align: center;
          }

          [part="avatar"] {
            display: block;
            border-radius: 50%;
            width: 4.2em;
          }

          [part="gold"] {
            font-size: 0.9em;
            margin-top: 0.5em;
            text-align: center;
          }
          [part="gold"] img {
            height: 0.8em;
            vertical-align: middle;
          }

          [part="tiles"] {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          ::slotted([slot="discards"]) {
            margin-bottom: 1.3em;
            font-size: 0.9em;
          }

          ::slotted([slot="tiles"]) {
            padding-bottom: 0.8em;
            font-size: 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerRow);
