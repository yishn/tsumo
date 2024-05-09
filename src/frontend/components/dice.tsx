import {
  Component,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";

export class Dice extends Component("dice", {
  face: prop<number>(1, { attribute: Number }),
}) {
  render() {
    const facePropMemo = useMemo(this.props.face);
    const face = () => Math.max(1, Math.min(6, facePropMemo()));
    const [multipliers, setMultipliers] = useSignal<[number, number]>([0, 0]);

    const rotateInfo: Partial<Record<number, [number, number, number]>> = {
      1: [0, 0, 0],
      2: [-90, 0, 0],
      3: [0, 90, 0],
      4: [0, -90, 0],
      5: [90, 0, 0],
      6: [180, 0, 0],
    };

    const transform = () =>
      rotateInfo[face()]
        ?.map(
          (deg, i) =>
            `rotate${"XYZ"[i]}(${deg + (multipliers()[i] ?? 0) * 360}deg)`
        )
        .join(" ");

    useEffect(() => {
      setMultipliers(
        (multipliers) =>
          multipliers.map((n) => n + (Math.random() > 0.5 ? 1 : -1)) as [
            number,
            number,
          ]
      );
    }, [face]);

    return (
      <>
        <div part="dice" style={{ transform }}>
          {[...Array(6)].map((_, i) => (
            <div part="face" data-face={i + 1}>
              {[...Array(i + 1)].map((_, j) => (
                <div class="dot" style={{ gridArea: `d${j + 1}` }} />
              ))}
            </div>
          ))}
        </div>

        <Style>{css`
          :host {
            --dice-face-color: #edf4ee;
            --dice-dot-color: #113ea7;
            --dice-size: 1.8em;
            display: inline-block;
            perspective: calc(3em);
            box-shadow: black 0 0 calc(1 * var(--dice-size))
              calc(-0.2 * var(--dice-size));
          }

          [part="dice"] {
            position: relative;
            display: block;
            width: var(--dice-size);
            height: var(--dice-size);
            transform-origin: center center calc(-0.5 * var(--dice-size));
            transform-style: preserve-3d;
            transition: transform 1.5s ease-out;
          }

          [part="face"] {
            position: absolute;
            display: grid;
            grid: repeat(3, 1fr) / repeat(3, 1fr);
            place-items: center;
            place-content: stretch;
            box-sizing: border-box;
            border: calc(0.1 * var(--dice-size)) solid #d3d7d4;
            width: var(--dice-size);
            height: var(--dice-size);
            background-color: var(--dice-face-color);
          }
          [part="face"][data-face="1"] {
            grid-template-areas:
              ". . ."
              ". d1 ."
              ". . .";
          }
          [part="face"][data-face="2"] {
            transform: translateZ(calc(-0.5 * var(--dice-size)))
              translateY(calc(-0.5 * var(--dice-size))) rotateX(90deg);
            grid-template-areas:
              "d1 . ."
              ". . ."
              ". . d2";
          }
          [part="face"][data-face="3"] {
            transform: translateZ(calc(-0.5 * var(--dice-size)))
              translateX(calc(-0.5 * var(--dice-size))) rotateY(-90deg);
            grid-template-areas:
              "d1 . ."
              ". d2 ."
              ". . d3";
          }
          [part="face"][data-face="4"] {
            transform: translateZ(calc(-0.5 * var(--dice-size)))
              translateX(calc(0.5 * var(--dice-size))) rotateY(90deg);
            grid-template-areas:
              "d1 . d2"
              ". . ."
              "d3 . d4";
          }
          [part="face"][data-face="5"] {
            transform: translateZ(calc(-0.5 * var(--dice-size)))
              translateY(calc(0.5 * var(--dice-size))) rotateX(-90deg);
            grid-template-areas:
              "d1 . d2"
              ". d5 ."
              "d3 . d4";
          }
          [part="face"][data-face="6"] {
            transform: translateZ(calc(-1 * var(--dice-size))) rotateX(180deg);
            grid-template-areas:
              "d1 . d2"
              "d3 . d4"
              "d5 . d6";
          }

          .dot {
            --dice-dot-size: calc(var(--dice-size) * 0.2);
            background-color: var(--dice-dot-color);
            border-radius: 50%;
            width: var(--dice-dot-size);
            height: var(--dice-dot-size);
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", Dice);