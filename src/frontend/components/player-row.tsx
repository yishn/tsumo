import {
  Component,
  FunctionalComponent,
  MaybeSignal,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useRef,
  useSignal,
} from "sinho";

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

    let intervalId: number | undefined;
    let timeoutId: number | undefined;

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
          fontVariantNumeric: "tabular-nums"
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
  avatar: prop<string>("data:image/svg+xml;utf8,<svg></svg>", {
    attribute: String,
  }),
  score: prop<number>(0, { attribute: Number }),
}) {
  render() {
    return (
      <>
        <div part="player">
          <div part="player-name">{this.props.name}</div>
          <img part="avatar" src={this.props.avatar} alt={this.props.name} />
          <div part="score">
            <img src="./assets/coin.png" alt="Score" /> ×
            <AnimatedCounter value={this.props.score} />
          </div>
        </div>

        <div part="tiles">
          <slot name="discards" />
          <slot name="tiles" />
        </div>

        <Style>{css`
          :host {
            --animated-counter-positive: #35de7b;
            --animated-counter-negative: #ff8356;
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
            max-width: 4.2em;
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          [part="avatar"] {
            display: block;
            border-radius: 50%;
            width: 4.2em;
          }

          [part="score"] {
            font-size: 0.9em;
            margin-top: 0.5em;
            text-align: center;
          }
          [part="score"] img {
            height: 0.8em;
            vertical-align: middle;
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

          ::slotted([slot="tiles"]) {
            gap: 0;
            padding-bottom: 0.8em;
            font-size: 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerRow);
