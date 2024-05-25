import {
  Component,
  If,
  Style,
  css,
  defineComponents,
  event,
  prop,
  useEffect,
  useRef,
} from "sinho";
import clsx from "clsx";
import { Dice } from "./dice.tsx";
import { Throbber } from "./throbber.tsx";

export class PlayerAvatar extends Component("player-avatar", {
  name: prop<string>("", { attribute: String }),
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
  dice: prop<[number, number]>(),
  sound: prop<boolean>(false, { attribute: () => true }),
  current: prop<boolean>(false, { attribute: () => true }),
  loading: prop<boolean>(false, { attribute: () => true }),
  onAvatarClick: event(MouseEvent),
}) {
  static emptyAvatar = "data:image/svg+xml;utf8,<svg></svg>" as const;

  render() {
    const dice1 = useRef<Dice>();
    const dice2 = useRef<Dice>();

    let prevDice: [number, number] | undefined;

    useEffect(() => {
      const nextDice = this.props.dice();

      if (prevDice == null && nextDice) {
        if (nextDice) {
          dice1()?.roll(nextDice[0]);
          dice2()?.roll(nextDice[1]);
        }

        prevDice = nextDice;
      }
    });

    return (
      <>
        <div part="name">{this.props.name}</div>
        <div
          part="avatar"
          class={() =>
            clsx({
              current: this.props.current(),
              dice: this.props.dice() != null,
              loading: this.props.loading(),
            })
          }
          onclick={this.events.onAvatarClick}
        >
          <Dice ref={dice1} face={6} sound={this.props.sound} />
          <Dice ref={dice2} face={6} sound={this.props.sound} />

          <If condition={this.props.loading}>
            <Throbber />
          </If>
        </div>

        <Style>{css`
          :host {
            --_player-avatar-size: var(--player-avatar-size, 4.2em);
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

          [part="avatar"] {
            position: relative;
            display: flex;
            place-content: center;
            place-items: center;
            gap: calc(0.1 * var(--_player-avatar-size));
            border-radius: 50%;
            outline: 0em solid #e9d883;
            height: var(--_player-avatar-size);
            width: var(--_player-avatar-size);
            transition:
              box-shadow 0.2s,
              outline-width 0.2s,
              background 0.2s;
          }
          @keyframes current-pulse {
            from {
              box-shadow: #e9d883 0 0 0 0.1em;
            }
            to {
              box-shadow: #e9d883 0 0 0 0.3em;
            }
          }
          [part="avatar"].current {
            animation: 1s linear infinite alternate current-pulse;
          }
          [part="avatar"].dice,
          [part="avatar"].loading {
            box-shadow: rgba(0, 0, 0, 0.5) 0 0 0 var(--_player-avatar-size)
              inset;
          }
          @keyframes current-pulse-dark {
            from {
              box-shadow:
                #e9d883 0 0 0 0.1em,
                rgba(0, 0, 0, 0.5) 0 0 0 var(--_player-avatar-size) inset;
            }
            to {
              box-shadow:
                #e9d883 0 0 0 0.3em,
                rgba(0, 0, 0, 0.5) 0 0 0 var(--_player-avatar-size) inset;
            }
          }
          [part="avatar"].dice.current,
          [part="avatar"].loading.current {
            animation-name: current-pulse-dark;
          }
          [part="avatar"] mj-dice {
            --dice-size: calc(0.25 * var(--_player-avatar-size));
            opacity: 0;
            transition: opacity 0.2s;
          }
          [part="avatar"].dice:not(.loading) mj-dice {
            opacity: 1;
          }
          [part="avatar"] mj-throbber {
            position: absolute;
            top: 50%;
            left: 50%;
            --throbber-size: calc(0.7 * var(--_player-avatar-size));
            transform: translate(-50%, -50%);
          }
        `}</Style>

        <Style>{css`
          [part="avatar"] {
            background: url(${this.props.avatar}) center / 100% 100% no-repeat
              rgba(0, 0, 0, 0.3);
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerAvatar);
