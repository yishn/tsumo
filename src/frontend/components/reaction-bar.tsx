import {
  Component,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
} from "sinho";
import { avatarList, getAvatarColor, getAvatarUrl } from "../assets.ts";
import { playWhooshSound } from "../sounds.ts";

type Avatar = (typeof avatarList)[number];

const avatarData: Record<Avatar, { top: number }> = {
  rat: { top: 39 },
  ox: { top: 53 },
  tiger: { top: 47 },
  rabbit: { top: 56 },
  dragon: { top: 48 },
  snake: { top: 48 },
  monkey: { top: 53 },
  rooster: { top: 40 },
  dog: { top: 44 },
  boar: { top: 52 },
};

export class ReactionBar extends Component("reaction-bar", {
  avatar: prop<Avatar>("rat"),
}) {
  static enterDuration = 500;
  static leaveDuration = 500;

  render() {
    const avatarIndex = () => avatarList.indexOf(this.props.avatar());

    useEffect(() => {
      playWhooshSound();
    });

    return (
      <>
        <div class="banner">
          <div class="bubble">
            <slot />
          </div>
        </div>

        <Style>{css`
          .banner {
            --bg-color: ${() => getAvatarColor(avatarIndex())};
            --avatar-size: 20em;
            --avatar-left: calc(50% - var(--avatar-size) / 2 + 1em);
            --avatar-right: calc(50% + var(--avatar-size) / 2 - 1em);
            background:
              linear-gradient(
                to right,
                var(--bg-color),
                var(--bg-color) var(--avatar-left),
                transparent calc(var(--avatar-left) + 2em),
                transparent calc(var(--avatar-right) - 2em),
                var(--bg-color) var(--avatar-right)
              ),
              var(--bg-color) url(${() => getAvatarUrl(avatarIndex())}) /* */
                center ${() => avatarData[this.props.avatar()].top}% /
                var(--avatar-size) no-repeat;
          }
        `}</Style>

        <Style>{css`
          @keyframes enter {
            from {
              height: 0;
              transform: translate(-100dvw, -50%);
            }
          }
          @keyframes leave {
            to {
              height: 0;
              width: 0;
              transform: translate(100dvw, -50%);
            }
          }
          :host {
            --_y-offset: var(--y-offset, 0);
            position: absolute;
            left: 0;
            width: 100%;
            height: 3em;
            top: calc(50% - 6em + 2em * var(--_y-offset));
            border: 0.2em solid white;
            border-left: none;
            border-right: none;
            box-shadow: rgba(0, 0, 0, 0.3) 0 0.5em 1em;
            transform: translate(0, -50%);
            background-color: white;
            overflow: hidden;
            animation: ${ReactionBar.enterDuration}ms ease-in backwards enter;
          }
          :host(.leave) {
            animation: ${ReactionBar.leaveDuration}ms ease-in forwards leave;
          }

          @keyframes banner-enter {
            from {
              opacity: 0;
              background-position: 50% 100%;
            }
            30% {
              background-position-x: calc(50% + 3em);
            }
          }
          @keyframes banner-leave {
            to {
              opacity: 0;
            }
          }
          .banner {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 3em;
            animation: 1s ease-out backwards banner-enter;
          }
          :host(.leave) .banner {
            animation: ${ReactionBar.leaveDuration}ms ease-out forwards
              banner-leave;
          }

          @keyframes bubble-enter {
            from {
              opacity: 0;
              transform: var(--base-transform) scale(0.5);
            }
          }
          .bubble {
            --base-transform: translate(calc(-50% - 8em), -50%);
            display: inline-block;
            position: absolute;
            left: 50%;
            top: 50%;
            padding: 1em;
            background: url("./assets/img/burstbubble.svg") center / contain
              no-repeat;
            line-height: 1em;
            transform: var(--base-transform);
            animation: 0.2s ease-out 0.8s backwards bubble-enter;
          }
          ::slotted(svg) {
            vertical-align: bottom;
            fill: rgba(0, 0, 0, 0.7);
            stroke: rgba(0, 0, 0, 0.7);
            stroke-width: 0;
            height: 1.2em;
            width: 1.2em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ReactionBar);
