import {
  Component,
  Else,
  ElseIf,
  If,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";
import { clsx } from "clsx";
import { Tile, TileSuit } from "../../core/main.ts";
import { delay, useInProgress } from "../animation.ts";
import { playClackSound, playPlaceSound } from "../sounds.ts";
import {
  BambooIcon,
  CircleIcon,
  FlowerIcon,
  WhiteIcon,
  WindIcon,
} from "../assets.ts";

class TileComponent extends Component("tile", {
  suit: prop<TileSuit>(undefined, {
    attribute: (val) => val.toLowerCase() as TileSuit,
  }),
  rank: prop<number>(undefined, { attribute: Number }),
  custom: prop<boolean>(false, { attribute: () => true }),
  back: prop<boolean>(false, { attribute: () => true }),
  selected: prop<boolean>(false, { attribute: () => true }),
  highlight: prop<boolean>(false, { attribute: () => true }),
  glow: prop<boolean>(false, { attribute: () => true }),
  animateEnter: prop<boolean | [x: number, y: number]>(false, {
    attribute: () => true,
  }),
  sounds: prop<boolean>(false, { attribute: () => true }),
}) {
  static transitionDuration = 200;
  static enterAnimationDuration = 400;

  getTile(): Tile | null {
    const suit = this.props.suit();
    const rank = this.props.rank();

    if (suit == null || rank == null) return null;

    try {
      return new Tile(suit, rank);
    } catch (err) {
      if (err instanceof TypeError) {
        return null;
      } else {
        throw err;
      }
    }
  }

  render() {
    const tile = useMemo(() => this.getTile());
    const back = useMemo(this.props.back);
    const [backVisual, setBackVisual] = useSignal(this.props.back());
    const [backTransitionInProgress, startBackTransition] = useInProgress();
    const [measuredDimension, setMeasuredDimension] = useSignal<DOMRect>();

    let firstRender = true;

    useEffect(() => {
      if (!firstRender && back() !== backVisual()) {
        startBackTransition(TileComponent.transitionDuration).then(async () => {
          setBackVisual(back());

          if (this.props.sounds()) {
            await delay(TileComponent.transitionDuration);
            playPlaceSound();
          }
        });
      }
    }, [back]);

    useEffect(() => {
      if (this.props.animateEnter() && this.props.sounds()) {
        delay(TileComponent.enterAnimationDuration).then(() => {
          playClackSound();
        });
      }
    }, []);

    useEffect(() => {
      if (measuredDimension() == null) {
        setMeasuredDimension(this.getBoundingClientRect());
      }
    }, []);

    useEffect(() => {
      firstRender = false;
    });

    return (
      <>
        <div
          part="tile"
          class={() =>
            clsx(tile()?.suit, {
              unknown: tile() == null,
              numeric: tile()?.numeric,
              honor: tile()?.honor,
              back: backVisual(),
              selected: this.props.selected(),
              highlight: this.props.highlight(),
              glow: this.props.glow(),
              sparrow: tile()?.rank === 1 && tile()?.suit === TileSuit.Bamboo,
              flower: tile()?.rank === 1 && tile()?.suit === TileSuit.Circle,
            })
          }
          style={{
            transform: () =>
              !backTransitionInProgress() ? undefined : "translateY(-1em)",
            visibility: () =>
              measuredDimension() == null ? "hidden" : undefined,
          }}
        >
          <If condition={backVisual}>
            {/* Keep dummy div to preserve layout */}
            <div part="suit"></div>
          </If>
          <ElseIf condition={() => this.props.custom()}>
            <div part="suit">
              <slot />
            </div>
          </ElseIf>
          <ElseIf condition={() => tile() == null}>
            <div part="rank">?</div>
          </ElseIf>
          <ElseIf condition={() => tile()!.numeric}>
            <div part="rank">{() => tile()?.rank}</div>
            <div part="suit">
              <If condition={() => tile()?.suit === TileSuit.Bamboo}>
                <BambooIcon alt="Bamboo" />
              </If>
              <ElseIf condition={() => tile()?.suit === TileSuit.Circle}>
                <If condition={() => tile()?.rank !== 1}>
                  <CircleIcon alt="Circle" />
                </If>
                <Else>
                  <FlowerIcon alt="Circle" />
                </Else>
              </ElseIf>
              <ElseIf condition={() => tile()?.suit === TileSuit.Myriad}>
                萬
              </ElseIf>
            </div>
          </ElseIf>
          <ElseIf condition={() => tile()!.suit === TileSuit.Wind}>
            <div part="suit">
              <svg
                viewBox="0 0 24 24"
                alt={() =>
                  ["Unknown", "East", "South", "West", "North"][
                    tile()?.rank ?? 0
                  ]
                }
              >
                <g
                  transform={() =>
                    `rotate(${[0, 0, 90, 180, 270][tile()?.rank ?? 0]} 12 12)`
                  }
                >
                  <WindIcon width="24" height="24" />
                </g>
              </svg>
            </div>
            <div part="rank">
              {() => ["?", "東", "南", "西", "北"][tile()?.rank ?? 0]}
            </div>
          </ElseIf>
          <ElseIf condition={() => tile()!.suit === TileSuit.Dragon}>
            <div
              part="rank"
              class={() => ["", "red", "green", "blue"][tile()?.rank ?? 0]}
            >
              <If condition={() => tile()?.rank !== 3}>
                <>{() => ["?", "中", "發"][tile()?.rank ?? 0]}</>
              </If>
              <Else>
                <WhiteIcon class="white" alt="White" />
              </Else>
            </div>
          </ElseIf>
        </div>

        <If
          condition={() =>
            this.props.animateEnter() !== false && measuredDimension() != null
          }
        >
          <Style>{css`
            @keyframes enter-animation {
              from {
                opacity: 0;
                transform: ${() => {
                  const animateEnter = this.props.animateEnter();
                  const delta: [string, string] = Array.isArray(animateEnter)
                    ? [
                        animateEnter[0] - measuredDimension()!.left + "px",
                        animateEnter[1] - measuredDimension()!.top + "px",
                      ]
                    : ["1em", "0"];

                  return `translate(${delta.join(",")})`;
                }};
              }
            }

            :host {
              animation: ${TileComponent.enterAnimationDuration}ms backwards
                enter-animation;
            }
          `}</Style>
        </If>

        <Style>{css`
          :host {
            --_tile-width: var(--tile-width, 2.15em);
            --tile-height: calc(var(--_tile-width) * 1.2);
            --tile-depth: 0.5em;
            --tile-back-depth: 0.3em;
            --tile-shadow: rgba(18, 32, 26, 0.5) 0 0.5em 0.5em;
            --tile-text-color: rgb(18, 32, 26);
            --tile-face-color: #edf4ee;
            --tile-face-border-color: #d3d7d4;
            --tile-face-light-color: #f8fcf9;
            --tile-back-color: #35de7b;
            --tile-back-border-color: #12bb25;
            --tile-back-light-color: #7eecba;
            --tile-face-highlight-color: #fdffbe;
            --tile-face-highlight-border-color: #e9d883;
            --tile-face-highlight-light-color: #feffeb;
            --tile-glow-color: rgba(233, 216, 131, 0.5);
            --tile-glow-pulse-color: rgba(233, 216, 131, 0.9);
            --tile-red: #d4353a;
            --tile-green: #12bb25;
            --tile-blue: #113ea7;
            display: inline-block;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          svg {
            overflow: visible;
          }

          [part="tile"] {
            display: flex;
            flex-direction: column;
            border: 0.15em solid transparent;
            border-top-color: var(--tile-face-light-color);
            border-radius: 0.3em;
            --box-shadow: var(--tile-face-border-color) 0 var(--tile-depth),
              var(--tile-back-border-color) 0
                calc(var(--tile-back-depth) + var(--tile-depth)),
              var(--tile-shadow);
            box-shadow: var(--box-shadow);
            width: var(--_tile-width);
            height: var(--tile-height);
            background-color: var(--tile-face-color);
            overflow: hidden;
            transition: transform ${TileComponent.transitionDuration}ms;
          }
          [part="tile"].highlight,
          [part="tile"].selected {
            --tile-face-color: var(--tile-face-highlight-color);
            --tile-face-border-color: var(--tile-face-highlight-border-color);
            --tile-face-light-color: var(--tile-face-highlight-light-color);
          }
          [part="tile"].selected {
            transform: translateY(-0.3em);
          }
          [part="tile"].glow {
            box-shadow:
              var(--tile-glow-pulse-color) 0 0 0.6em 0.3em,
              var(--box-shadow);
          }
          [part="tile"].back {
            border-color: var(--tile-back-color);
            border-top-color: var(--tile-back-light-color);
            --box-shadow: var(--tile-back-border-color) 0 var(--tile-back-depth),
              var(--tile-face-border-color) 0
                calc(var(--tile-back-depth) + var(--tile-depth)),
              var(--tile-shadow);
            background-color: var(--tile-back-color);
          }
          [part="tile"]:not(.back).sparrow {
            background-image: url("./assets/img/sparrow.png");
            background-position: center calc(100% + 0.15em);
            background-repeat: no-repeat;
            background-size: cover;
          }

          [part="rank"] {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2em;
            font-weight: 500;
            color: var(--tile-text-color);
            text-align: center;
            line-height: 1;
          }
          [part="rank"].red {
            color: var(--tile-red);
          }
          [part="rank"].green {
            color: var(--tile-green);
          }
          [part="rank"].blue {
            color: var(--tile-blue);
          }
          .unknown [part="rank"] {
            font-size: 1.8em;
            font-weight: bold;
          }
          .dragon [part="rank"] {
            font-size: 2em;
            font-weight: bold;
          }
          .wind [part="rank"] {
            font-size: 1.2em;
            font-weight: bold;
          }
          .sparrow [part="rank"],
          .flower [part="rank"] {
            position: absolute;
            left: -9999em;
          }
          [part="rank"] .white {
            stroke: var(--tile-blue);
            width: 80%;
            height: 80%;
          }

          [part="suit"] {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          [part="suit"] svg,
          [part="rank"] svg,
          [part="suit"] ::slotted(*) {
            display: block;
            width: 70%;
            height: 70%;
          }
          .bamboo [part="suit"] svg {
            fill: var(--tile-green);
          }
          .circle [part="suit"] svg {
            fill: var(--tile-blue);
          }
          .flower [part="suit"] svg {
            width: 90%;
            height: 90%;
          }
          .myriad [part="suit"] {
            color: var(--tile-red);
            font-size: 1.2em;
            line-height: 1;
            font-weight: bold;
          }
          .wind [part="suit"] svg {
            fill: var(--tile-text-color);
            height: 1em;
          }
          .sparrow [part="suit"] {
            position: absolute;
            left: -9999em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileComponent);

export { TileComponent as Tile };
