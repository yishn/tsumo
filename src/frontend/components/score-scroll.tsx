import {
  Component,
  For,
  If,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";
import { delay, sakuraBlossoms } from "../animation.ts";
import { Tile } from "./tile.tsx";
import { ScorePhase, Tile as TileClass } from "../../core/main.ts";
import { playRevealSound, playScrollSound } from "../sounds.ts";
import { PlayerAvatar } from "./player-avatar.tsx";
import { SubmitIcon, getAvatarUrl } from "../assets.ts";
import { ITile, ScoreModifier, ScoreModifierType } from "../../core/main.ts";
import { TileRow } from "./tile-row.tsx";
import { TileStack } from "./tile-stack.tsx";
import { webSocketHook } from "../global-state.ts";

const modifierTypeLabels: Record<ScoreModifierType, string> = {
  [ScoreModifierType.Draw]: "Draw",
  [ScoreModifierType.HeavenlyWin]: "Heavenly Win",
  [ScoreModifierType.EarthlyWin]: "Earthly Win",
  [ScoreModifierType.FalseWin]: "False Win",
  [ScoreModifierType.Win]: "Win",
  [ScoreModifierType.Dealer]: "Dealer",
  [ScoreModifierType.SelfDraw]: "Self-Draw",
  [ScoreModifierType.Detonator]: "Detonator",
  [ScoreModifierType.JokerFisher]: "Joker Fisher",
  [ScoreModifierType.KongBloom]: "Kong Bloom",
  [ScoreModifierType.StolenKong]: "Stolen Kong",
  [ScoreModifierType.AllPong]: "All Pong",
  [ScoreModifierType.SevenPairs]: "Seven Pairs",
  [ScoreModifierType.Chaotic]: "Chaotic Thirteen",
  [ScoreModifierType.SevenStars]: "Seven Stars",
  [ScoreModifierType.JokerFree]: "Joker-Free",
  [ScoreModifierType.PureJokerFree]: "Pure Joker-Free",
  [ScoreModifierType.Joker]: "Joker",
  [ScoreModifierType.Overlord]: "Joker (Overlord)",
};

export class ScoreScroll extends Component("score-scroll", {
  tiles: prop<ITile[]>([]),
  melds: prop<ITile[][]>([]),
  jokers: prop<ITile[]>([]),
  avatars: prop<number[]>([0, 1, 2, 3]),
  winModifiers: prop<ScoreModifier[][]>([]),
  jokerBonusModifiers: prop<ScoreModifier[][]>([]),
  showSakura: prop<boolean>(false),
}) {
  static enterAnimationDuration = 2000;
  static enterRowAnimationDuration = 500;

  render() {
    const winResult = useMemo(() =>
      ScorePhase.getWinResult(this.props.winModifiers())
    );

    const jokerBonusResult = useMemo(() =>
      ScorePhase.getJokerBonusResult(this.props.jokerBonusModifiers())
    );

    const [ready, setReady] = useSignal(false);

    useEffect(() => {
      // Reveal animation

      playScrollSound();

      delay(ScoreScroll.enterAnimationDuration).then(() => {
        [...this.shadowRoot!.querySelectorAll("[part='tiles'] mj-tile")]
          .filter((tile): tile is Tile => tile instanceof Tile && tile.back)
          .forEach((tile) => {
            tile.back = false;
            delay(Tile.transitionDuration).then(playRevealSound);
          });
      });
    });

    useEffect(() => {
      let cleanup: () => void;

      if (this.props.showSakura()) {
        cleanup = sakuraBlossoms();
      }

      return () => cleanup?.();
    });

    let row = 1;

    const rowAnimationDelayStyle = () => ({
      animationDelay: () =>
        `${ScoreScroll.enterAnimationDuration + row++ * 500}ms`,
    });

    return (
      <>
        <div part="container">
          <h1>Score</h1>
          <img class="head" src="./assets/img/win.svg" alt="和" />

          <TileRow part="tiles">
            <For each={this.props.melds}>
              {(meld) => (
                <TileStack>
                  <For each={meld}>
                    {(tile) => (
                      <Tile
                        back
                        glow={() =>
                          this.props
                            .jokers()
                            .some((joker) => TileClass.equal(joker, tile()))
                        }
                        suit={() => tile().suit}
                        rank={() => tile().rank}
                      />
                    )}
                  </For>
                </TileStack>
              )}
            </For>

            <TileStack>
              <For each={this.props.tiles}>
                {(tile) => (
                  <Tile
                    back
                    glow={() =>
                      this.props
                        .jokers()
                        .some((joker) => TileClass.equal(joker, tile()))
                    }
                    suit={() => tile().suit}
                    rank={() => tile().rank}
                  />
                )}
              </For>
            </TileStack>
          </TileRow>

          <table part="score-table">
            <thead>
              <tr>
                <th class="type">Type</th>
                <For each={this.props.avatars}>
                  {(avatar) => (
                    <th class="player">
                      <PlayerAvatar avatar={() => getAvatarUrl(avatar())} />
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For
                each={() =>
                  ScoreModifierType.list().filter(
                    (type) =>
                      !!this.props
                        .winModifiers()
                        .some((modifiers) =>
                          modifiers.some((modifier) => modifier[0] === type)
                        )
                  )
                }
              >
                {(type) => (
                  <tr style={rowAnimationDelayStyle()}>
                    <td class="type">{() => modifierTypeLabels[type()]}</td>
                    <For each={this.props.winModifiers}>
                      {(modifiers) => {
                        const modifier = () =>
                          modifiers().find(
                            (modifier) => modifier[0] === type()
                          );

                        return (
                          <td class="player">
                            <If
                              condition={() =>
                                modifier() != null && modifier()![2] !== 1
                              }
                            >
                              ×{() => modifier()?.[2]}
                            </If>
                            <If
                              condition={() =>
                                modifier() != null && modifier()![3] !== 0
                              }
                            >
                              {() =>
                                modifier() != null && modifier()![3] > 0
                                  ? "+" + modifier()![3]
                                  : modifier()?.[3]
                              }
                            </If>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>

              <tr class="result" style={rowAnimationDelayStyle()}>
                <td class="type"></td>
                <For each={winResult}>
                  {(total) => {
                    return (
                      <td class="player">
                        {() => (total() > 0 ? "+" + total() : total())}
                      </td>
                    );
                  }}
                </For>
              </tr>

              <For
                each={() =>
                  this.props
                    .avatars()
                    .map((_, i) =>
                      this.props
                        .jokerBonusModifiers()
                        .map((modifiers) =>
                          modifiers.find((modifier) => modifier[1] === i)
                        )
                    )
                    .filter((modifiers) =>
                      modifiers.some((modifier) => modifier != null)
                    )
                }
              >
                {(modifiers, i, arr) => (
                  <tr style={rowAnimationDelayStyle()}>
                    <If condition={() => i() === 0}>
                      <td class="type" rowSpan={arr().length}>
                        Joker
                      </td>
                    </If>

                    <For each={modifiers}>
                      {(modifier) => {
                        const sum = () =>
                          -modifiers().reduce(
                            (sum, modifier) =>
                              sum +
                              (modifier == null
                                ? 0
                                : modifier[3] * modifier[2]),
                            0
                          );

                        return (
                          <td class="player">
                            <If condition={() => modifier() == null}>
                              {() => (sum() > 0 ? "+" + sum() : sum())}
                            </If>
                            <If
                              condition={() =>
                                modifier() != null && modifier()![3] !== 0
                              }
                            >
                              {() =>
                                modifier() != null && modifier()![3] > 0
                                  ? "+" + modifier()![3]
                                  : modifier()?.[3]
                              }
                            </If>
                            <If
                              condition={() =>
                                modifier() != null && modifier()![2] !== 1
                              }
                            >
                              ×{() => modifier()?.[2]}
                            </If>
                          </td>
                        );
                      }}
                    </For>
                  </tr>
                )}
              </For>

              <tr class="result" style={rowAnimationDelayStyle()}>
                <td class="type"></td>
                <For each={jokerBonusResult}>
                  {(total) => {
                    return (
                      <td class="player">
                        {() => (total() > 0 ? "+" + total() : total())}
                      </td>
                    );
                  }}
                </For>
              </tr>

              <tr class="total" style={rowAnimationDelayStyle()}>
                <td class="type">Total</td>
                <For
                  each={() =>
                    winResult().map((n, i) => n + jokerBonusResult()[i])
                  }
                >
                  {(total) => {
                    return (
                      <td class="player">
                        {() => (total() > 0 ? "+" + total() : total())}
                      </td>
                    );
                  }}
                </For>
              </tr>
            </tbody>
          </table>

          <Tile
            style={rowAnimationDelayStyle()}
            class="submit"
            sounds
            custom
            back={ready}
            onclick={() => {
              webSocketHook.sendMessage({ ready: {} });
              setReady(true);
            }}
          >
            <SubmitIcon fill="#12bb25" />
          </Tile>
        </div>

        <Style>{css`
          * {
            box-sizing: border-box;
          }

          @keyframes enter {
            from {
              transform: translate(-50%, -100%);
            }
          }
          :host {
            display: block;
            position: fixed;
            top: 0;
            left: 50%;
            height: 100dvh;
            width: min(100dvw, 30em);
            overflow: hidden;
            transform: translateX(-50%);
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
            top: 4em;
            bottom: 4em;
            left: 0;
            right: 0;
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

          img.head {
            width: 2.5em;
            height: 2.5em;
            opacity: 0.9;
          }
          h1 {
            margin: 0;
            font-weight: normal;
            font-size: 1.5em;
            font-style: italic;
            text-align: center;
          }

          [part="tiles"],
          .submit {
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
          @keyframes enter-row {
            from {
              border-color: transparent;
              opacity: 0;
              transform: scale(1.1) translateY(0.5em);
            }
          }
          [part="score-table"] tr {
            animation: ${ScoreScroll.enterRowAnimationDuration}ms 2s backwards
              enter-row;
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
          [part="score-table"] .result td {
            padding-bottom: 0.5em;
          }

          .submit {
            cursor: pointer;
            animation: ${ScoreScroll.enterRowAnimationDuration}ms 2s backwards
              enter-row;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ScoreScroll);
