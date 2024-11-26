import clsx from "clsx";
import { Component, If, Style, css, defineComponents, prop } from "sinho";
import { DealerIcon } from "../assets.ts";
import { PlayerAvatar } from "./player-avatar.tsx";
import { PlayerScore } from "./player-score.tsx";

export class PlayerRow extends Component("player-row", {
  name: prop<string>("", { attribute: String }),
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
  minimal: prop<boolean>(false, { attribute: () => true }),
  current: prop<boolean>(false, { attribute: () => true }),
  dealer: prop<boolean>(false, { attribute: () => true }),
  loading: prop<boolean>(false, { attribute: () => true }),
  score: prop<number>(0, { attribute: Number }),
}) {
  render() {
    return (
      <div
        part="container"
        class={() =>
          clsx({
            minimal: this.props.minimal(),
            current: this.props.current(),
            dealer: this.props.dealer(),
          })
        }
      >
        <div part="player">
          <If condition={this.props.dealer}>
            <DealerIcon class="dealer" alt="Dealer" title="Dealer" />{" "}
          </If>

          <PlayerAvatar
            name={this.props.name}
            avatar={this.props.avatar}
            current={this.props.current}
            loading={this.props.loading}
          />
          <PlayerScore score={this.props.score} />

          <slot name="player-extra" />
        </div>

        <div part="tiles">
          <slot name="tiles" />
          <slot name="discards" />
        </div>

        <Style>{css`
          svg {
            overflow: visible;
          }

          :host {
            --player-row-background-color: rgba(0, 0, 0, 0.7);
            display: block;
          }

          [part="container"] {
            position: relative;
            display: flex;
            gap: 1em;
            background-color: var(--player-row-background-color);
            padding: 0.5em;
            padding-left: max(0.5em, env(safe-area-inset-left));
            padding-right: env(safe-area-inset-left);
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            transition: background-color 0.2s;
          }
          [part="container"].minimal {
            flex-direction: column;
            gap: 0.7em;
            padding-bottom: 0;
          }

          [part="player"] {
            display: flex;
            flex-direction: column;
            align-items: safe center;
            gap: 0.15em;
          }
          @keyframes dealer-enter {
            from {
              transform: scale(2) translate(0.2em, 0.2em);
            }
          }
          [part="player"] .dealer {
            position: absolute;
            top: 0;
            left: 0;
            height: 0.8em;
            width: 0.8em;
            fill: #ee401d;
            margin-bottom: -0.1em;
            animation: 1s dealer-enter;
          }
          .minimal [part="player"] {
            flex-direction: row;
            justify-content: safe center;
            gap: 0.5em;
          }
          .minimal [part="player"] mj-player-avatar {
            --player-avatar-size: 2.2em;
            flex-direction: row;
            align-items: safe center;
            gap: 0.5em;
            max-width: 50%;
          }
          .minimal [part="player"] mj-player-avatar::part(avatar) {
            order: -1;
          }
          .minimal [part="player"] mj-player-avatar::part(name) {
            max-width: none;
            overflow: hidden;
          }

          mj-player-score {
            text-align: center;
          }

          [part="tiles"] {
            display: flex;
            flex-direction: column;
            gap: 0.5em;
          }

          ::slotted([slot="discards"]) {
            font-size: 0.7em;
          }

          ::slotted([slot="tiles"]) {
            --tile-width: 1.8em;
            font-size: 0.5em;
          }
          @media (max-width: 355px) {
            ::slotted([slot="tiles"]) {
              --tile-width: 1.4em;
            }
          }
        `}</Style>
      </div>
    );
  }
}

defineComponents("mj-", PlayerRow);
