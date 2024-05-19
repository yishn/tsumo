import clsx from "clsx";
import {
  Component,
  FunctionalComponent,
  If,
  MaybeSignal,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useRef,
  useSignal,
} from "sinho";
import { DealerIcon, ScoreIcon } from "../assets.ts";
import { PlayerAvatar } from "./player-avatar.tsx";
import { playCoinSound } from "../sounds.ts";

const AnimatedCounter: FunctionalComponent<{
  value?: MaybeSignal<number | undefined>;
  duration?: MaybeSignal<number | undefined>;
}> = (props) => {
  const elRef = useRef<HTMLSpanElement>();
  const deltaRef = useRef<HTMLSpanElement>();
  const [value, setValue] = useSignal(0);
  const [delta, setDelta] = useSignal(0);
  const [showDelta, setShowDelta] = useSignal(false);

  useEffect(() => {
    const newValue = MaybeSignal.get(props.value) ?? 0;
    const delta = newValue - value.peek();
    const sign = Math.sign(delta);
    const interval =
      (MaybeSignal.peek(props.duration) ?? 500) / Math.abs(delta);

    let intervalId: NodeJS.Timeout | number | undefined;
    let timeoutId: NodeJS.Timeout | number | undefined;

    if (value.peek() !== newValue) {
      setDelta(newValue - value.peek());
      setShowDelta(true);

      intervalId = setInterval(() => {
        if (value.peek() === newValue) {
          clearInterval(intervalId);
          setShowDelta(false);
        } else {
          setValue((value) => value + sign);
        }
      }, interval);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  });

  return (
    <>
      <span
        ref={elRef}
        style={{
          position: "relative",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}

        <span
          ref={deltaRef}
          style={{
            position: "absolute",
            left: 0,
            top: "-1em",
            padding: "0 .2em",
            marginLeft: "-.2em",
            borderRadius: ".2em",
            lineHeight: "1",
            fontWeight: "bold",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: () =>
              delta() >= 0
                ? "var(--animated-counter-positive)"
                : "var(--animated-counter-negative)",
            opacity: () => (showDelta() ? 1 : 0),
            transform: () => (showDelta() ? undefined : "translateY(.5em)"),
            transition: "opacity .2s, transform .2s",
          }}
        >
          <> </>
          {() => (delta() >= 0 ? "+" : "")}
          {delta}
        </span>
      </span>
    </>
  );
};

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
    const score = useMemo(this.props.score);

    useEffect(() => {
      playCoinSound();
    }, [score]);

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
          <div part="score">
            <ScoreIcon alt="Score" /> ×
            <AnimatedCounter value={score} />
          </div>

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
            --animated-counter-positive: #35de7b;
            --animated-counter-negative: #ff8356;
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
            color: white;
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
            align-items: center;
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
            justify-content: center;
            gap: 0.5em;
          }
          .minimal [part="player"] mj-player-avatar {
            flex-direction: row;
            align-items: center;
            gap: 0.5em;
          }
          .minimal [part="player"] mj-player-avatar::part(avatar) {
            order: -1;
            --player-avatar-size: 2.2em;
          }

          [part="score"] {
            font-size: 0.9em;
            text-align: center;
          }
          [part="score"] svg {
            fill: #ffbb00;
            height: 0.8em;
            width: 0.8em;
            margin-bottom: -0.1em;
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
        `}</Style>
      </div>
    );
  }
}

defineComponents("mj-", PlayerRow);
