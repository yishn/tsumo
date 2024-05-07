import { Component, If, Style, css, defineComponents, prop } from "sinho";
import { DealerIcon } from "../assets.ts";
import clsx from "clsx";

export class PlayerAvatar extends Component("player-avatar", {
  name: prop<string>("", { attribute: String }),
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
  current: prop<boolean>(false, { attribute: () => true }),
  dealer: prop<boolean>(false, { attribute: () => true }),
}) {
  render() {
    return (
      <>
        <div part="name">
          <If condition={this.props.dealer}>
            <DealerIcon class="dealer" alt="Dealer" />{" "}
          </If>
          {this.props.name}
        </div>
        <img
          part="avatar"
          class={() => clsx({ current: this.props.current() })}
          src={this.props.avatar}
          alt={this.props.name}
        />

        <Style>{css`
          :host {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.15em;
          }

          [part="name"] {
            max-width: 4.2em;
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @keyframes dealer-enter {
            from {
              transform: scale(2);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          [part="name"] .dealer {
            fill: #ee401d;
            height: 0.8em;
            width: 0.8em;
            margin-bottom: -0.1em;
            animation: 1s dealer-enter;
          }

          [part="avatar"] {
            display: block;
            border-radius: 50%;
            width: 4.2em;
            transition: box-shadow 0.2s;
          }
          [part="avatar"].current {
            box-shadow: #e9d883 0 0 0 0.3em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerAvatar);
