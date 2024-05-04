import {
  Component,
  ElseIf,
  If,
  Style,
  css,
  defineComponents,
  prop,
  useMemo,
} from "sinho";
import { clsx } from "clsx";
import { Tile, TileSuit } from "../../core/tile.ts";
import BambooIcon from "../../../assets/bamboo.svg";
import CircleIcon from "../../../assets/circle.svg";
import WindIcon from "../../../assets/wind.svg";

export class TileComponent extends Component("tile", {
  suit: prop<TileSuit>(undefined, {
    attribute: (val) => val.toLowerCase() as TileSuit,
  }),
  rank: prop<number>(undefined, { attribute: Number }),
  back: prop<boolean>(false, { attribute: () => true }),
}) {
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

    return (
      <>
        <div
          part="tile"
          class={() =>
            clsx(tile()?.suit, {
              unknown: tile() == null,
              numeric: tile()?.numeric,
              honor: tile()?.honor,
              back: this.props.back(),
            })
          }
        >
          <If condition={this.props.back}></If>
          <ElseIf condition={() => tile() == null}>?</ElseIf>
          <ElseIf condition={() => tile()!.numeric}>
            <div part="rank">{() => tile()?.rank}</div>
            <div part="suit">
              <If condition={() => tile()?.suit === TileSuit.Bamboo}>
                <BambooIcon />
              </If>
              <ElseIf condition={() => tile()?.suit === TileSuit.Circle}>
                <CircleIcon />
              </ElseIf>
              <ElseIf condition={() => tile()?.suit === TileSuit.Myriad}>
                萬
              </ElseIf>
            </div>
          </ElseIf>
          <ElseIf condition={() => tile()!.suit === TileSuit.Wind}>
            <div part="suit">
              <WindIcon
                style={{
                  transform: () =>
                    `rotate(${[0, 0, 90, 180, 270][tile()?.rank ?? 0]}deg)`,
                }}
                alt={() =>
                  ["Unknown", "East", "South", "West", "North"][
                    tile()?.rank ?? 0
                  ]
                }
              />
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
              {() => ["?", "中", "發", "白"][tile()?.rank ?? 0]}
            </div>
          </ElseIf>
        </div>

        <Style>{css`
          :host {
            display: inline-block;
            --tile-text-color: #00331d;
            --tile-face-color: #edf4ee;
            --tile-face-border-color: #d3d7d4;
            --tile-face-light-color: #f8fcf9;
            --tile-back-color: #35de7b;
            --tile-back-border-color: #12bb25;
            --tile-back-light-color: #7eecba;
            --tile-red: #d4353a;
            --tile-green: #12bb25;
            --tile-blue: #113ea7;
          }

          [part="tile"] {
            --tile-width: 2.5em;
            --tile-height: calc(var(--tile-width) * 1.25);
            display: flex;
            flex-direction: column;
            border: 3px solid var(--tile-face-color);
            border-bottom-color: var(--tile-face-border-color);
            border-top-color: var(--tile-face-light-color);
            border-radius: 0.3em;
            box-shadow:
              var(--tile-face-border-color) 0 -0.5em,
              var(--tile-back-border-color) 0 -0.8em;
            margin-top: 0.8em;
            width: var(--tile-width);
            height: var(--tile-height);
            background-color: var(--tile-face-color);
            overflow: hidden;
          }
          [part="tile"].back {
            border-color: var(--tile-back-color);
            border-top-color: var(--tile-back-light-color);
            border-bottom-color: var(--tile-back-border-color);
            box-shadow:
              var(--tile-back-border-color) 0 -0.3em,
              var(--tile-face-border-color) 0 -0.8em;
            background-color: var(--tile-back-color);
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
          .dragon [part="rank"] {
            font-size: 2em;
            font-weight: bold;
          }
          .wind [part="rank"] {
            font-size: 1.4em;
            font-weight: bold;
          }

          [part="suit"] {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          [part="suit"] svg {
            display: block;
            max-width: 70%;
            max-height: 70%;
          }
          .bamboo [part="suit"] svg {
            fill: var(--tile-green);
          }
          .circle [part="suit"] svg {
            fill: var(--tile-blue);
          }
          .myriad [part="suit"] {
            color: var(--tile-red);
            font-size: 1.4em;
            line-height: 1;
            font-weight: bold;
          }
          .wind [part="suit"] svg {
            fill: var(--tile-text-color);
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileComponent);
