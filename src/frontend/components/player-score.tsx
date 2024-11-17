import {
  Component,
  css,
  defineComponents,
  FunctionalComponent,
  MaybeSignal,
  prop,
  Style,
  useEffect,
  useMemo,
  useRef,
  useSignal,
} from "sinho";
import { ScoreIcon } from "../assets.ts";
import { playCoinSound } from "../sounds.ts";

const AnimatedCounter: FunctionalComponent<{
  value?: MaybeSignal<number | undefined>;
  duration?: MaybeSignal<number | undefined>;
  labelDuration?: MaybeSignal<number | undefined>;
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

    let intervalId: NodeJS.Timeout | number | undefined;
    let timeoutId: NodeJS.Timeout | number | undefined;

    if (delta !== 0) {
      const interval =
        (MaybeSignal.peek(props.duration) ?? 500) / Math.abs(delta);

      setDelta(delta);
      setShowDelta(true);

      intervalId = setInterval(() => {
        if (value.peek() === newValue) {
          clearInterval(intervalId);
        } else {
          setValue((value) => value + sign);
        }
      }, interval);

      timeoutId = setTimeout(
        () => {
          setShowDelta(false);
        },
        MaybeSignal.peek(props.labelDuration) ?? 2000
      );
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
                ? "var(--animated-counter-positive, #35de7b)"
                : "var(--animated-counter-negative, #ff8356)",
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

export class PlayerScore extends Component("player-score", {
  score: prop<number>(0, { attribute: Number }),
}) {
  render() {
    const score = useMemo(this.props.score);

    let firstRender = true;

    useEffect(() => {
      if (!firstRender) playCoinSound();
      firstRender = false;
    }, [score]);

    return (
      <>
        <ScoreIcon alt="Score" /> ×
        <AnimatedCounter value={this.props.score} />
        <Style>{css`
          :host {
            font-size: 0.9em;
          }

          svg {
            fill: #ffbb00;
            height: 0.8em;
            width: 0.8em;
            margin-bottom: -0.1em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", PlayerScore);
