import {
  Component,
  Style,
  css,
  defineComponents,
  prop,
  useSignal,
} from "sinho";
import { ActionBar } from "./action-bar.tsx";
import { Tile } from "./tile.tsx";
import { TileSuit } from "../../core/tile.ts";

export class ReactionWindow extends Component("reaction-window", {
  suit: prop<TileSuit>(undefined, {
    attribute: (val) => val.toLowerCase() as TileSuit,
  }),
  rank: prop<number>(undefined, { attribute: Number }),
  progress: prop<number>(0, { attribute: Number }),
}) {
  render() {
    const [showTile, setShowTile] = useSignal(false);

    setTimeout(() => setShowTile(true), 500);

    return (
      <>
        <div part="container">
          <h1>React</h1>

          <div part="content">
            <Tile
              back={() => !showTile()}
              suit={this.props.suit}
              rank={this.props.rank}
            />
          </div>

          <ActionBar>
            <slot name="action" />
          </ActionBar>
        </div>

        <Style>{css`
          :host {
            filter: drop-shadow(rgba(0, 0, 0, 0.9) 0 1em 2em);
          }

          @keyframes show-window {
            from {
              background-color: transparent;
              border-image: none;
              color: transparent;
              transform: scale(0.9);
            }
          }
          [part="container"] {
            --border-size: 4em;
            --clip-cutoff-size: calc(var(--border-size) * 3 / 4);
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: rgba(63, 5, 21, 0.9);
            border: var(--border-size) solid transparent;
            border-image: url("./assets/img/lattice.svg") 45%;
            clip-path: polygon(
              var(--clip-cutoff-size) 0,
              0 var(--clip-cutoff-size),
              0 calc(100% - var(--clip-cutoff-size)),
              var(--clip-cutoff-size) 100%,
              calc(100% - var(--clip-cutoff-size)) 100%,
              100% calc(100% - var(--clip-cutoff-size)),
              100% var(--clip-cutoff-size),
              calc(100% - var(--clip-cutoff-size)) 0
            );
            animation: 0.5s backwards show-window 0.2s;
          }

          h1 {
            margin: 0;
            font-weight: normal;
            font-size: 1.5em;
            font-style: italic;
          }

          @keyframes content-enter {
            from {
              opacity: 0;
              transform: scale(0.7) translateY(8em);
            }
          }
          [part="content"] {
            font-size: 1em;
            margin: 1em 0;
            padding: 1em;
            filter: drop-shadow(rgba(0, 0, 0, 0.9) 0 1em 2em);
            animation: 0.5s content-enter;
          }
          [part="content"] mj-tile {
            margin-bottom: 0.8em;
          }

          @keyframes actions-enter {
            from {
              opacity: 0;
            }
          }
          mj-action-bar {
            --action-bar-icon-color: #ff7864;
            --action-bar-icon-disabled-color: #8c7672;
            gap: 0.5em;
            padding: 0;
            animation: 0.5s backwards actions-enter 0.2s;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ReactionWindow);
