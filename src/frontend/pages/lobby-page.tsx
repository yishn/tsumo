import {
  Component,
  For,
  Portal,
  Style,
  css,
  defineComponents,
  useEffect,
  useSignal,
} from "sinho";
import { PlayerAvatar } from "../components/player-avatar.tsx";
import { ActionBarButton } from "../components/action-bar.tsx";
import { LeftIcon, RightIcon } from "../assets.ts";
import { Tile } from "../components/tile.tsx";
import { TileSuit } from "../../core/tile.ts";
import { globalWsHook } from "../websocket.ts";
import { useServerSignal } from "../server-signal.ts";

const SESSION = "test"; // TODO

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
  getAvatarUrl(avatar: number): string {
    return `./assets/avatars/${avatarList[avatar % avatarList.length]}.png`;
  }

  render() {
    const remotePlayers = useServerSignal((msg) => msg.lobby?.players);
    const [ownPlayerId, setOwnPlayerId] = useSignal<string>();
    const [ownAvatarIndex, setOwnAvatarIndex] = useSignal(
      Math.floor(Math.random() * avatarList.length)
    );
    const [ownName, setOwnName] = useSignal("");
    const [dice, setDice] = useSignal<number>();

    const canRollInitiative = () =>
      ownName().trim() !== "" && remotePlayers()?.length === 4;

    const status = () => {
      if (ownName().trim() === "") {
        return "Enter your name…";
      } else if (remotePlayers() == null || remotePlayers()!.length < 4) {
        return "Waiting for players…";
      } else if (dice() == null) {
        return "Tap on tile to roll for initiative…";
      } else if (remotePlayers()?.some((player) => player.dice == null)) {
        return "Waiting for other players to run for initiative…";
      }

      return "Starting game…";
    };

    useEffect(() => {
      if (globalWsHook.connected()) {
        globalWsHook.send({
          lobby: {
            join: {
              session: SESSION,
            },
          },
        });
      }
    }, [globalWsHook.connected]);

    globalWsHook.onMessage(
      (msg) => msg.lobby?.joined,
      (data) => {
        setOwnPlayerId(data.id);

        globalWsHook.send({
          lobby: {
            playerInfo: {
              secret: data.secret,
              name: ownName(),
              avatar: ownAvatarIndex(),
            },
          },
        });
      }
    );

    return (
      <>
        <Portal mount={document.head}>
          {avatarList.map((_, i) => (
            <link rel="prefetch" href={this.getAvatarUrl(i)} />
          ))}
        </Portal>

        <div part="players">
          <For each={() => [...Array(3)]}>
            {(_, i) => {
              const player = () =>
                remotePlayers()?.filter(
                  (player) => player.id !== ownPlayerId()
                )[i()];

              return (
                <PlayerAvatar
                  name={() => player()?.name || "\u200b"}
                  avatar={() =>
                    player()?.avatar == null
                      ? PlayerAvatar.emptyAvatar
                      : this.getAvatarUrl(player()!.avatar!)
                  }
                />
              );
            }}
          </For>
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

          <PlayerAvatar avatar={() => this.getAvatarUrl(ownAvatarIndex())} />

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

        <div part="status">{status}</div>

        <div part="ready">
          <Tile
            animateEnter
            back={() => !canRollInitiative()}
            suit={TileSuit.Dragon}
            rank={2}
          />
        </div>

        <Style>{css`
          :host {
            display: flex;
            flex-direction: column;
            justify-content: safe center;
            align-items: center;
            gap: 0.5em;
            padding: 0.5em 0;
            padding-bottom: env(safe-area-inset-bottom);
            background: linear-gradient(
              to bottom,
              transparent,
              rgba(0, 0, 0, 0.2) 5em
            );
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
            --player-avatar-size: 12em;
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
            margin-bottom: 1em;
          }
        `}</Style>

        <Style>{css`
          [part="ready"] mj-tile {
            cursor: ${canRollInitiative() ? "pointer" : "not-allowed"};
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", LobbyPage);
