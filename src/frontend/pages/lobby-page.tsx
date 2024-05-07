import {
  Component,
  Portal,
  Style,
  css,
  defineComponents,
  useSignal,
} from "sinho";
import { PlayerAvatar } from "../components/player-avatar.tsx";
import { ActionBarButton } from "../components/action-bar.tsx";
import { LeftIcon, RightIcon } from "../assets.ts";
import { Tile } from "../components/tile.tsx";
import { TileSuit } from "../../core/tile.ts";

const avatarList = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  // "snake",
  // "horse",
  // "goat",
  "monkey",
  "rooster",
  "dog",
  "boar",
] as const;

export class LobbyPage extends Component("lobby-page") {
  getAvatarUrl(avatar: string): string {
    return `./assets/avatars/${avatar}.png`;
  }

  render() {
    const [ownAvatarIndex, setOwnAvatarIndex] = useSignal(
      Math.floor(Math.random() * avatarList.length)
    );
    const [ownName, setOwnName] = useSignal("");

    return (
      <>
        <Portal mount={document.head}>
          {avatarList.map((avatar) => (
            <link rel="prefetch" href={this.getAvatarUrl(avatar)} />
          ))}
        </Portal>

        <div part="players">
          <PlayerAvatar name="East" avatar="./assets/avatars/monkey.png" />
          <PlayerAvatar name="South" avatar="./assets/avatars/boar.png" />
          <PlayerAvatar name={"\u200b"} />
        </div>

        <div part="avatar-chooser">
          <ActionBarButton
            class="prev"
            onButtonClick={() => {
              setOwnAvatarIndex(
                (index) => (index - 1 + avatarList.length) % avatarList.length
              );
            }}
          >
            <LeftIcon />
          </ActionBarButton>
          <PlayerAvatar
            avatar={() => this.getAvatarUrl(avatarList[ownAvatarIndex()])}
          />
          <ActionBarButton
            class="next"
            onButtonClick={() => {
              setOwnAvatarIndex((index) => (index + 1) % avatarList.length);
            }}
          >
            <RightIcon />
          </ActionBarButton>
        </div>

        <div part="name-chooser">
          <input
            type="text"
            placeholder="Your name"
            value={ownName}
            oninput={(evt) => setOwnName(evt.currentTarget.value)}
          />
        </div>

        <div part="status">Waiting for players…</div>

        <div part="ready">
          <Tile animateEnter back suit={TileSuit.Dragon} rank={2} />
        </div>

        <Style>{css`
          :host {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: safe center;
            align-items: center;
            gap: 0.5em;
            padding: 1em 0;
            background-color: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(0.5em);
            -webkit-backdrop-filter: blur(0.5em);
            overflow: auto;
          }

          [part="players"] {
            display: flex;
            justify-content: center;
            gap: 1em;
            margin-bottom: 1em;
          }
          [part="players"] ::part(avatar) {
            font-size: 1.2em;
          }

          [part="avatar-chooser"] {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5em;
          }
          [part="avatar-chooser"] .prev,
          [part="avatar-chooser"] .next {
            --action-bar-icon-color: #ffd3a3;
          }
          @keyframes prev-arrow-sway {
            from {
              transform: none;
            }
            to {
              transform: translateX(-0.5em);
            }
          }
          @keyframes next-arrow-sway {
            from {
              transform: none;
            }
            to {
              transform: translateX(0.5em);
            }
          }
          [part="avatar-chooser"] .prev svg {
            animation: 0.7s linear infinite alternate prev-arrow-sway;
          }
          [part="avatar-chooser"] .next svg {
            animation: 0.7s linear infinite alternate next-arrow-sway;
          }
          [part="avatar-chooser"] ::part(avatar) {
            font-size: 3em;
          }

          [part="name-chooser"] input {
            box-sizing: border-box;
            width: 6em;
            border: none;
            margin-bottom: 1em;
            background-color: rgba(0, 0, 0, 0.7);
            font: 1.5em var(--heiti-font-stack);
            text-align: center;
          }

          [part="status"] {
            font-style: italic;
            margin-bottom: 1em;
          }

          [part="ready"] mj-tile {
            cursor: pointer;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", LobbyPage);
