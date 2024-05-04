import { Component, Style, css, defineComponents, prop } from "sinho";

export class PlayerRowComponent extends Component("player-row", {
  name: prop<string>(""),
  avatar: prop<string>("./assets/avatars/monkey.png"),
}) {
  render() {
    return (
      <>
        <div part="player">
          <div part="player-name">{this.props.name}</div>
          <img part="avatar" src={this.props.avatar} alt={this.props.name} />
        </div>

        <Style>{css`
          :host {
            display: flex;
            gap: 1em;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(0.5em);
            padding: .5em;
          }

          [part="player-name"] {
            color: white;
            font-weight: bold;
            text-align: center;
          }

          [part="avatar"] {
            display: block;
            border-radius: 50%;
            width: 5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerRowComponent);
