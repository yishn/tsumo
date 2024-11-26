import {
  Component,
  css,
  defineComponents,
  Else,
  event,
  For,
  If,
  prop,
  Style,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";
import {
  Achievement,
  getAchievementData,
  getAchievementImageUrl,
} from "../../shared/achievements.ts";
import { ActionBar, ActionBarButton } from "./action-bar.tsx";
import { ContinueIcon, ReloadIcon } from "../assets.ts";
import { PlayerAvatar } from "./player-avatar.tsx";
import { PlayerScore } from "./player-score.tsx";

export class EndScreen extends Component("end-screen", {
  players: prop<
    {
      avatar?: string;
      name?: string;
      score?: number;
      achievement?: Achievement | null;
    }[]
  >([]),
  achievement: prop<Achievement | null>(null, {
    attribute: (value) =>
      Object.values<string>(Achievement).includes(value)
        ? (value as Achievement)
        : null,
  }),
  onFinished: event(MouseEvent),
}) {
  render() {
    const [showAchievement, setShowAchievement] = useSignal(false);
    const achievement = useMemo(this.props.achievement);
    const orderedPlayers = useMemo(() =>
      [...this.props.players()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    );

    const achievementData = () =>
      this.props.achievement() == null
        ? null
        : getAchievementData(this.props.achievement()!);

    useEffect(() => {
      setShowAchievement(achievement() != null);
    });

    return (
      <>
        <If condition={() => showAchievement() && achievement() != null}>
          <div part="achievement">
            <div class="badge">
              <div class="inner">
                <img
                  src={() => getAchievementImageUrl(achievement()!)}
                  alt={() => achievementData()?.name}
                />
              </div>
            </div>

            <h2>{() => achievementData()?.name}</h2>

            <p>“{() => achievementData()?.poem}”</p>

            <ActionBar>
              <ActionBarButton
                tooltip="Continue"
                onButtonClick={() => {
                  setShowAchievement(false);
                }}
              >
                <ContinueIcon alt="Continue" />
              </ActionBarButton>
            </ActionBar>
          </div>
        </If>

        <Else>
          <div part="players">
            <For each={orderedPlayers}>
              {(item, i) => (
                <div class="player" style={{ "--_i": i }}>
                  <PlayerAvatar
                    avatar={() => item().avatar ?? PlayerAvatar.emptyAvatar}
                  />

                  <h2>{() => item().name}</h2>

                  <PlayerScore score={() => item().score ?? 0} />

                  <span class="achievement">
                    {() =>
                      item().achievement == null
                        ? ""
                        : getAchievementData(item().achievement!).name
                    }
                  </span>
                </div>
              )}
            </For>

            <ActionBar>
              <ActionBarButton
                tooltip="New Game"
                onButtonClick={(evt) => {
                  this.events.onFinished(evt);
                }}
              >
                <ReloadIcon alt="New Game" />
              </ActionBarButton>
            </ActionBar>
          </div>
        </Else>

        <Style>{css`
          * {
            margin: 0;
            padding: 0;
          }

          @keyframes enter {
            from {
              opacity: 0;
            }
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
            padding: 1.5em;
            background: rgba(0, 0, 0, 0.9);
            animation: 0.5s backwards enter;
          }

          h2 {
            font-weight: normal;
            font-size: 1.6em;
            text-shadow: rgba(255, 255, 255, 0.7) 0 0 0.5em;
          }

          mj-action-bar {
            margin-top: 2em;
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
              transform: scale(0.5);
              filter: drop-shadow(var(--_border-color) 0.2em 0 0)
                drop-shadow(var(--_border-color) -0.2em 0 0)
                drop-shadow(var(--_border-color) 0 0.2em 0)
                drop-shadow(var(--_border-color) 0 -0.2em 0);
            }
          }
          [part="achievement"] .badge {
            --_border-color: rgb(114, 75, 2);
            filter: drop-shadow(var(--_border-color) 0.2em 0 0)
              drop-shadow(var(--_border-color) -0.2em 0 0)
              drop-shadow(var(--_border-color) 0 0.2em 0)
              drop-shadow(var(--_border-color) 0 -0.2em 0)
              drop-shadow(rgba(235, 167, 118, 0.7) 0 0.5em 2em);
            animation: 2s backwards cubic-bezier(0.26, 1.14, 0.78, 1.5)
              enter-badge;
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
            animation: 3s 2s backwards enter-text;
          }

          [part="achievement"] p {
            font-style: italic;
            text-align: center;
            white-space: pre-line;
            opacity: 0.7;
            animation: 3s 2s backwards enter-text;
          }

          [part="achievement"] mj-action-bar {
            animation: 3s 2.5s backwards enter-text;
          }

          [part="players"] {
            display: flex;
            flex-direction: column;
            justify-items: start;
            justify-content: center;
            grid-gap: 1.5em;
          }

          @keyframes enter-player {
            from {
              opacity: 0;
              transform: translateY(2em);
            }
          }
          [part="players"] .player {
            display: grid;
            grid-template-areas: "avatar name name" "avatar score achievement";
            grid-template-columns: auto 1fr auto;
            column-gap: 1em;
            animation: 1s backwards enter-player;
            animation-delay: calc(var(--_i, 0) * 0.3s);
          }

          [part="players"] .player mj-player-avatar {
            grid-area: avatar;
          }

          [part="players"] .player h2 {
            grid-area: name;
            align-self: end;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          [part="players"] .player mj-player-score {
            grid-area: score;
          }

          [part="players"] .player .achievement {
            grid-area: achievement;
            opacity: 0.7;
          }

          [part="players"] mj-action-bar {
            animation: 1s backwards 1.5s enter-player;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", EndScreen);
