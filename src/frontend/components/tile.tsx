import {
  Component,
  ElseIf,
  If,
  Style,
  css,
  defineComponents,
  prop,
} from "sinho";
import { clsx } from "clsx";
import { Tile, TileSuit } from "../../core/tile.ts";

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
    const tile = () => this.getTile();

    return (
      <>
        <div
          class={() =>
            clsx("tile", {
              unknown: tile() == null,
              back: this.props.back(),
            })
          }
        >
          <If condition={this.props.back}></If>
          <ElseIf condition={() => tile() == null}>?</ElseIf>
          <ElseIf condition={() => tile()!.numeric}>
            {/* <span>{() => tile()?.rank}</span>
            <> </>
            <span>{() => tile()?.suit}</span> */}
          </ElseIf>
        </div>

        <Style>{css`
          :host {
            display: inline-block;
          }

          .tile {
            border: 2px solid #edf4ee;
            border-bottom-color: #d3d7d4;
            border-radius: 0.3em;
            box-shadow:
              #d3d7d4 0 -0.5em,
              #12bb25 0 -0.8em;
            margin-top: 0.8em;
            width: 3em;
            height: 4em;
            background-color: #edf4ee;
            overflow: hidden;
          }

          .tile.back {
            border-color: #35de7b;
            border-bottom-color: #12bb25;
            box-shadow:
              #12bb25 0 -0.3em,
              #d7e0d8 0 -0.8em;
            background-color: #35de7b;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileComponent);
