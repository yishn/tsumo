import { Component, Style, css, defineComponents, useEffect } from "sinho";
import { delay } from "../animation.ts";
import { Tile } from "./tile.tsx";
import { playRevealSound } from "../sounds.ts";
import { PlayerAvatar } from "./player-avatar.tsx";
import { getAvatarUrl } from "../assets.ts";

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

          <table part="score-table">
            <thead>
              <tr>
                <th class="type">Type</th>
                <th class="player">
                  <PlayerAvatar avatar={getAvatarUrl(0)} />
                </th>
                <th class="player">
                  <PlayerAvatar avatar={getAvatarUrl(1)} />
                </th>
                <th class="player">
                  <PlayerAvatar avatar={getAvatarUrl(2)} />
                </th>
                <th class="player">
                  <PlayerAvatar avatar={getAvatarUrl(3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="type">Win</td>
                <td class="player">{-1}</td>
                <td class="player">{-1}</td>
                <td class="player"></td>
                <td class="player">{-1}</td>
              </tr>
              <tr>
                <td class="type">Dealer</td>
                <td class="player">×2</td>
                <td class="player"></td>
                <td class="player"></td>
                <td class="player"></td>
              </tr>
              <tr>
                <td class="type">Detonator</td>
                <td class="player"></td>
                <td class="player">×2</td>
                <td class="player"></td>
                <td class="player"></td>
              </tr>
              <tr class="result">
                <td class="type"></td>
                <td class="player">{-2}</td>
                <td class="player">{-2}</td>
                <td class="player">{5}</td>
                <td class="player">{-1}</td>
              </tr>

              <tr>
                <td class="type" rowSpan={4}>
                  Joker
                </td>
                <td class="player">{9}</td>
                <td class="player">{-3}</td>
                <td class="player">{-3}</td>
                <td class="player">{-3}</td>
              </tr>
              <tr>
                <td class="player">{-1}</td>
                <td class="player">3</td>
                <td class="player">{-1}</td>
                <td class="player">{-1}</td>
              </tr>
              <tr>
                <td class="player">
                  <span style={{ visibility: "hidden" }}>×2</span>
                  {-5}×2
                </td>
                <td class="player">
                  <span style={{ visibility: "hidden" }}>×2</span>
                  {-5}×2
                </td>
                <td class="player">
                  <span style={{ visibility: "hidden" }}>×2</span>15×2
                </td>
                <td class="player">
                  <span style={{ visibility: "hidden" }}>×2</span>
                  {-5}×2
                </td>
              </tr>
              <tr>
                <td class="player">{-1}</td>
                <td class="player">{-1}</td>
                <td class="player">{-1}</td>
                <td class="player">3</td>
              </tr>
              <tr class="result">
                <td class="type"></td>
                <td class="player">{-3}</td>
                <td class="player">{-11}</td>
                <td class="player">{25}</td>
                <td class="player">{-11}</td>
              </tr>

              <tr class="total">
                <td class="type"></td>
                <td class="player">{-5}</td>
                <td class="player">{-13}</td>
                <td class="player">{30}</td>
                <td class="player">{-12}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Style>{css`
          * {
            box-sizing: border-box;
          }

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
            justify-content: safe center;
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
            margin: 1.2em 0;
            font-size: 0.8em;
          }

          [part="score-table"] {
            --player-avatar-size: 2.5em;
            border: none;
            border-collapse: collapse;
          }
          [part="score-table"] thead th {
            padding-bottom: 0.5em;
          }
          [part="score-table"] td,
          [part="score-table"] th {
            padding: 0 0.2em;
            vertical-align: top;
          }
          [part="score-table"] th.type {
            opacity: 0;
          }
          [part="score-table"] .type {
            text-align: right;
            font-weight: bold;
          }
          [part="score-table"] .player {
            width: 3em;
            text-align: center;
            font-variant-numeric: tabular-nums;
          }
          [part="score-table"] .result {
            border-top: 0.1em solid rgb(22, 40, 22, 0.7);
          }
          [part="score-table"] .total {
            border-top: 0.3em double rgb(22, 40, 22, 0.7);
          }
          [part="score-table"] .result td,
          [part="score-table"] .total td {
            padding-bottom: 0.5em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ScoreScroll);
