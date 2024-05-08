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
  static emptyAvatar = "data:image/svg+xml;utf8,<svg></svg>" as const;

  render() {
    return (
      <>
        <div part="name">
          <If condition={this.props.dealer}>
            <DealerIcon class="dealer" alt="Dealer" />{" "}
          </If>
          {this.props.name}
        </div>
        <div
          part="avatar"
          class={() => clsx({ current: this.props.current() })}
        />

        <Style>{css`
          :host {
            --player-avatar-size: 4.2em;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.15em;
          }

          [part="name"] {
            box-sizing: border-box;
            padding: 0 0.4em;
            max-width: 4.2em;
            font-weight: bold;
            text-align: center;
            overflow-x: clip;
            overflow-y: visible;
            text-overflow: ellipsis;
          }
          @keyframes dealer-enter {
            from {
              transform: scale(2);
            }
            to {
              transform: scale(1);
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
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            height: var(--player-avatar-size);
            width: var(--player-avatar-size);
            transition:
              box-shadow 0.2s,
              background-image 0.2s;
          }
          [part="avatar"].current {
            box-shadow: #e9d883 0 0 0 0.3em;
          }
        `}</Style>

        <Style>{css`
          [part="avatar"] {
            background: url(${this.props.avatar}) 0 0 / 100% 100%;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerAvatar);
