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
  useRef,
  useSignal,
} from "sinho";
import { DealerIcon, ScoreIcon } from "../assets.ts";

const AnimatedCounter: FunctionalComponent<{
  value?: MaybeSignal<number | undefined>;
  duration?: MaybeSignal<number | undefined>;
}> = (props) => {
  const elRef = useRef<HTMLSpanElement>();
  const deltaRef = useRef<HTMLSpanElement>();
  const [value, setValue] = useSignal(MaybeSignal.get(props.value) ?? 0);
  const [delta, setDelta] = useSignal(0);
  const [showDelta, setShowDelta] = useSignal(false);

  useEffect(() => {
    const newValue = MaybeSignal.get(props.value) ?? 0;
    const delta = newValue - value.peek();
    const sign = Math.sign(delta);
    const interval =
      (MaybeSignal.peek(props.duration) ?? 300) / Math.abs(delta);

    let intervalId: NodeJS.Timeout | number | undefined;
    let timeoutId: NodeJS.Timeout | number | undefined;

    if (value.peek() !== newValue) {
      setDelta(newValue - value.peek());
      setShowDelta(true);

      intervalId = setInterval(() => {
        if (value.peek() === newValue) {
          clearInterval(intervalId);
        } else {
          setValue((value) => value + sign);
        }
      }, interval);

      timeoutId = setTimeout(() => setShowDelta(false), 1000);
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
  minimal: prop<boolean>(false, { attribute: () => true }),
  current: prop<boolean>(false, { attribute: () => true }),
  dealer: prop<boolean>(false, { attribute: () => true }),
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
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
          <div part="player-name">
            <If condition={this.props.dealer}>
              <DealerIcon alt="Dealer" />{" "}
            </If>
            {this.props.name}
          </div>
          <img part="avatar" src={this.props.avatar} alt={this.props.name} />
          <div part="score">
            <ScoreIcon alt="Score" /> ×
            <AnimatedCounter value={this.props.score} />
          </div>
        </div>

        <div part="tiles">
          <slot name="discards" />
          <slot name="tiles" />
        </div>

        <Style>{css`
          svg {
            overflow: visible;
          }

          :host {
            --animated-counter-positive: #35de7b;
            --animated-counter-negative: #ff8356;
            --player-row-background-color: rgba(0, 0, 0, 0.5);
            display: block;
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
          }

          [part="container"] {
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
          .minimal [part="player"] {
            flex-direction: row;
            gap: 0.5em;
          }

          [part="player-name"] {
            max-width: 4.2em;
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .dealer [part="player-name"] svg {
            fill: #ee401d;
            height: 0.8em;
            width: 0.8em;
            margin-bottom: -0.1em;
          }

          [part="avatar"] {
            display: block;
            border-radius: 50%;
            width: 4.2em;
            transition: box-shadow 0.2s;
          }
          .current [part="avatar"] {
            box-shadow: #e9d883 0 0 0 0.3em;
          }
          .minimal [part="avatar"] {
            order: -1;
            width: 2.2em;
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
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          ::slotted([slot="discards"]) {
            margin-bottom: 1.3em;
            font-size: 0.9em;
          }
          .minimal ::slotted([slot="discards"]) {
            font-size: 0.7em;
          }

          ::slotted([slot="tiles"]) {
            gap: 0;
            padding-bottom: 0.8em;
            font-size: 0.5em;
          }
          .minimal ::slotted([slot="tiles"]) {
            align-self: center;
          }
        `}</Style>
      </div>
    );
  }
}

defineComponents("mj-", PlayerRow);
