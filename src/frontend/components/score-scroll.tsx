import { Component, Style, css, defineComponents, useEffect } from "sinho";
import { delay } from "../animation.ts";
import { Tile } from "./tile.tsx";
import { playRevealSound } from "../sounds.ts";

export class ScoreScroll extends Component("score-scroll") {
  static enterAnimationDuration = 2000;

  render() {
    useEffect(() => {
      // Reveal animation

      delay(ScoreScroll.enterAnimationDuration).then(() => {
        [...this.querySelectorAll("[slot='tiles'] mj-tile")]
          .filter((tile): tile is Tile => tile instanceof Tile && tile.back)
          .forEach((tile) => {
            tile.back = false;
            delay(Tile.transitionDuration).then(playRevealSound);
          });
      });
    });

    return (
      <>
        <div part="container">
          <h1>Score</h1>

          <slot name="tiles" />
        </div>

        <Style>{css`
          @keyframes enter {
            from {
              transform: translateY(-100%);
            }
          }
          :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 100dvh;
            overflow: hidden;
            background:
              linear-gradient(
                to bottom,
                rgba(4, 14, 4, 0.7),
                rgba(255, 249, 234, 0.3) 0.4em,
                rgba(4, 14, 4, 0.7) 1em,
                rgba(4, 14, 4, 1) 1.5em,
                transparent 1.7em,
                transparent calc(100% - 1.7em),
                rgba(4, 14, 4, 0.7) calc(100% - 1.5em),
                rgba(255, 249, 234, 0.3) calc(100% - 1.1em),
                rgba(4, 14, 4, 0.7) calc(100% - 0.5em),
                rgba(4, 14, 4, 1)
              ),
              #162816 url("./assets/img/pattern.svg") center / 15em;
            box-shadow: rgba(4, 14, 4, 0.3) 0 1em 1em;
            animation: ${ScoreScroll.enterAnimationDuration}ms backwards enter;
          }

          [part="container"] {
            box-sizing: border-box;
            position: absolute;
            bottom: 4em;
            left: 0;
            right: 0;
            height: calc(100dvh - 8em);
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 0.2em solid rgb(22, 40, 22, 0.7);
            border-left: none;
            border-right: none;
            padding: 0.5em;
            background: #f6db9d url("./assets/img/pattern.svg") center / 15em;
            color: #333;
            overflow: auto;
          }

          h1 {
            margin: 0;
            font-weight: normal;
            font-size: 1.5em;
            font-style: italic;
            text-align: center;
          }

          ::slotted([slot="tiles"]) {
            margin: 0.5em 0;
            font-size: 0.8em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ScoreScroll);
