import { Component, Style, css, defineComponents, prop } from "sinho";
import { avatarList } from "../assets";

type Avatar = (typeof avatarList)[number];

const avatarData: Record<
  (typeof avatarList)[number],
  { color: string; top: number }
> = {
  rat: {
    color: "#4e3f63",
    top: 39,
  },
  ox: {
    color: "#85874e",
    top: 53,
  },
  tiger: {
    color: "#b7b2b4",
    top: 47,
  },
  rabbit: {
    color: "#189662",
    top: 56,
  },
  dragon: {
    color: "#8dbced",
    top: 48,
  },
  monkey: {
    color: "#c45c3f",
    top: 53,
  },
  rooster: {
    color: "#f0e56e",
    top: 40,
  },
  dog: {
    color: "#9c6850",
    top: 44,
  },
  boar: {
    color: "#1b728f",
    top: 52,
  },
};

export class ReactionBar extends Component("reaction-bar", {
  avatar: prop<Avatar>("rat"),
}) {
  render() {
    return (
      <>
        <div class="banner" />

        <Style>{css`
          .banner {
            --bg-color: ${() => avatarData[this.props.avatar()].color};
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
              var(--bg-color)
                url(${() => `./assets/avatars/${this.props.avatar()}.png`})
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
          :host {
            position: absolute;
            left: 0;
            right: 0;
            height: 3em;
            top: 50%;
            border: 0.2em solid white;
            border-left: none;
            border-right: none;
            transform: translateY(-50%);
            background-color: white;
            overflow: hidden;
            animation: 0.5s ease-in backwards enter;
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
          .banner {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 3em;
            animation: 1s ease-out backwards banner-enter;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ReactionBar);
