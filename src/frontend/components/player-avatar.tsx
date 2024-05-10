import {
  Component,
  If,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useRef,
} from "sinho";
import { DealerIcon } from "../assets.ts";
import clsx from "clsx";
import { Dice } from "./dice.tsx";

export class PlayerAvatar extends Component("player-avatar", {
  name: prop<string>("", { attribute: String }),
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
  dice: prop<[number, number]>(),
  current: prop<boolean>(false, { attribute: () => true }),
  dealer: prop<boolean>(false, { attribute: () => true }),
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
        <div part="name">
          <If condition={this.props.dealer}>
            <DealerIcon class="dealer" alt="Dealer" />{" "}
          </If>
          {this.props.name}
        </div>
        <div
          part="avatar"
          class={() =>
            clsx({
              current: this.props.current(),
              dice: this.props.dice() != null,
            })
          }
        >
          <Dice ref={dice1} face={6} />
          <Dice ref={dice2} face={6} />
        </div>

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
          }
          [part="name"] .dealer {
            fill: #ee401d;
            height: 0.8em;
            width: 0.8em;
            margin-bottom: -0.1em;
            animation: 1s dealer-enter;
          }

          [part="avatar"] {
            display: flex;
            place-content: center;
            place-items: center;
            gap: calc(0.1 * var(--player-avatar-size));
            border-radius: 50%;
            outline: 0em solid #e9d883;
            height: var(--player-avatar-size);
            width: var(--player-avatar-size);
            transition:
              box-shadow 0.2s,
              outline-width 0.2s,
              background 0.2s;
          }
          [part="avatar"].current {
            outline-width: 0.3em;
          }
          [part="avatar"].dice {
            box-shadow: rgba(0, 0, 0, 0.5) 0 0 0 var(--player-avatar-size) inset;
          }
          [part="avatar"] mj-dice {
            --dice-size: calc(0.25 * var(--player-avatar-size));
            opacity: 0;
            transition: opacity 0.2s;
          }
          [part="avatar"].dice mj-dice {
            opacity: 1;
          }
        `}</Style>

        <Style>{css`
          [part="avatar"] {
            background: rgba(0, 0, 0, 0.3) url(${this.props.avatar}) 0 0 / 100%
              100%;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerAvatar);
