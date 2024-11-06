import {
  Component,
  css,
  defineComponents,
  If,
  prop,
  Style,
  useEffect,
  useSignal,
} from "sinho";
import {
  Achievement,
  getAchievementData,
  getAchievementImageUrl,
} from "../../shared/achievements.ts";
import { easeOutCubic, useTransition } from "../animation.ts";

export class EndScreen extends Component("end-screen", {
  achievement: prop<Achievement>(undefined, {
    attribute: (value) =>
      Object.values<string>(Achievement).includes(value)
        ? (value as Achievement)
        : undefined,
  }),
}) {
  #filterName = `dissolve-filter-${crypto.randomUUID()}`;

  render() {
    const [showAchievement, setShowAchievement] = useSignal(false);

    const achievementData = () =>
      this.props.achievement() == null
        ? null
        : getAchievementData(this.props.achievement()!);

    const [
      achievementTransition,
      ,
      startAchievementTransition,
      stopAchievementTransition,
    ] = useTransition(easeOutCubic);

    useEffect(() => {
      setShowAchievement(this.props.achievement() != null);
    }, []);

    useEffect(() => {
      if (showAchievement() && this.props.achievement() != null) {
        startAchievementTransition(3000);

        return () => stopAchievementTransition();
      }
    });

    return (
      <>
        <svg style={{ display: "none" }}>
          <defs>
            <filter
              id={this.#filterName}
              x="-200%"
              y="-200%"
              width="500%"
              height="500%"
              color-interpolation-filters="sRGB"
              overflow="visible"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1"
                numOctaves="1"
                result="fineNoise"
              />

              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.004"
                numOctaves="1"
                seed={Math.random() * 1000}
                result="bigNoise"
              />

              <feComponentTransfer in="bigNoise" result="bigNoiseAdjusted">
                <feFuncR type="linear" slope="3" intercept="-1" />
                <feFuncG type="linear" slope="3" intercept="-1" />
              </feComponentTransfer>

              <feMerge result="mergedNoise">
                <feMergeNode in="bigNoiseAdjusted" />
                <feMergeNode in="fineNoise" />
              </feMerge>

              <feDisplacementMap
                in="SourceGraphic"
                in2="mergedNoise"
                scale={() => 800 * (1 - achievementTransition())}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <If
          condition={() =>
            showAchievement() && this.props.achievement() != null
          }
        >
          <div part="achievement">
            <div class="badge">
              <div class="inner">
                <img
                  src={() => getAchievementImageUrl(this.props.achievement()!)}
                  alt={() => achievementData()?.name}
                />
              </div>
            </div>

            <h2>{() => achievementData()?.name}</h2>

            <p>“{() => achievementData()?.poem}”</p>
          </div>
        </If>

        <Style>{css`
          * {
            margin: 0;
            padding: 0;
          }

          :host {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.8);
          }

          [part="achievement"] {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            grid-gap: 1em;
          }

          @keyframes enter-badge {
            from {
              opacity: 0;
            }
          }
          [part="achievement"] .badge {
            --_border-color: rgb(114, 75, 2);
            filter: drop-shadow(var(--_border-color) 0.2em 0 0)
              drop-shadow(var(--_border-color) -0.2em 0 0)
              drop-shadow(var(--_border-color) 0 0.2em 0)
              drop-shadow(var(--_border-color) 0 -0.2em 0)
              drop-shadow(rgba(53, 22, 0, 0.9) 0 1em 1em)
              url(#${this.#filterName});
            animation: 3s backwards ease-out enter-badge;
          }

          [part="achievement"] .badge .inner {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 6em;
            width: 6em;
            padding: 1em;
            clip-path: polygon(
              30% 0,
              0 30%,
              0 calc(100% - 30%),
              30% 100%,
              calc(100% - 30%) 100%,
              100% calc(100% - 30%),
              100% 30%,
              calc(100% - 30%) 0
            );
            background: radial-gradient(
                circle at center,
                rgba(53, 22, 0, 0.3),
                transparent
              ),
              linear-gradient(to bottom, rgb(244, 216, 122), rgb(198, 132, 30));
          }

          [part="achievement"] .badge img {
            max-height: 6em;
            max-width: 6em;
          }

          @keyframes enter-text {
            from {
              opacity: 0;
            }
          }

          [part="achievement"] h2 {
            margin-top: 1em;
            font-weight: normal;
            font-size: 1.6em;
            text-shadow: rgba(255, 255, 255, 0.7) 0 0 0.5em;
            animation: 3s 2s backwards enter-text;
          }

          [part="achievement"] p {
            font-style: italic;
            text-align: center;
            white-space: pre-line;
            animation: 3s 2s backwards enter-text;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", EndScreen);
