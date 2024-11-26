import {
  Component,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
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
  timeout: prop<number>(5000, { attribute: Number }),
}) {
  static showDuration = 500;
  static leaveDuration = 200;

  render() {
    const [showTile, setShowTile] = useSignal(false);
    const [progress, setProgress] = useSignal(this.props.timeout());

    setTimeout(() => setShowTile(true), 500);

    useEffect(() => {
      setTimeout(() => {
        setProgress(Math.max(this.props.timeout() - 1000, 0));
      }, 10);

      const intervalId = setInterval(() => {
        if (progress() <= 0) clearInterval(intervalId);
        setProgress((value) => Math.max(value - 1000, 0));
      }, 1000);

      return () => clearInterval(intervalId);
    }, [this.props.timeout]);

    return (
      <>
        <div part="container">
          <h1>React</h1>

          <div part="content">
            <svg viewBox="-20 -20 40 40" class="progress">
              <circle
                cx={0}
                cy={0}
                r={18}
                fill="none"
                pathLength={() => this.props.timeout()}
                stroke="rgba(255, 163, 130, .5)"
                stroke-width={4}
                stroke-dasharray={() => this.props.timeout()}
                stroke-dashoffset={() => this.props.timeout() - progress()}
                transform="rotate(-90)"
              />
            </svg>

            <Tile
              back={() => !showTile()}
              suit={this.props.suit}
              rank={this.props.rank}
              sounds
            />
          </div>

          <ActionBar>
            <slot name="action" />
          </ActionBar>
        </div>

        <Style>{css`
          :host {
            filter: drop-shadow(rgba(0, 0, 0, 0.8) 0 1em 1em);
          }

          @keyframes enter {
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
            align-items: safe center;
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
            animation: ${ReactionWindow.showDuration}ms backwards enter
              0.2s;
          }
          @keyframes leave {
            to {
              border-image: none;
              opacity: 0;
              transform: scale(0.9);
            }
          }
          :host(.leave) [part="container"] {
            animation: ${ReactionWindow.leaveDuration}ms forwards leave;
          }

          h1 {
            margin: 0;
            font-weight: normal;
            font-size: 1.5em;
            font-style: italic;
          }

          @keyframes fade-enter {
            from {
              opacity: 0;
            }
          }
          @keyframes content-enter {
            from {
              opacity: 0;
              transform: scale(0.7) translateY(8em);
            }
          }
          [part="content"] {
            position: relative;
            font-size: 1em;
            margin: 1em 0;
            filter: drop-shadow(rgba(0, 0, 0, 0.9) 0 1em 2em);
            animation: 0.5s content-enter;
          }
          [part="content"] .progress {
            width: 6em;
            height: 6em;
          }
          [part="content"] .progress circle {
            transition: stroke-dashoffset 1s linear;
            animation: 0.5s backwards fade-enter 0.5s;
          }
          [part="content"] mj-tile {
            position: absolute;
            left: 50%;
            top: 50%;
            padding-bottom: 1.3em;
            transform: translate(-50%, -50%);
          }

          mj-action-bar {
            --action-bar-icon-color: #ff7864;
            --action-bar-icon-disabled-color: #8c7672;
            gap: 0.5em;
            padding: 0;
            animation: 0.5s backwards fade-enter 0.2s;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ReactionWindow);
