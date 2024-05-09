import {
  Component,
  Else,
  For,
  If,
  Portal,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useMemo,
  useSignal,
} from "sinho";
import { PlayerAvatar } from "../components/player-avatar.tsx";
import { ActionBarButton } from "../components/action-bar.tsx";
import { LeftIcon, RightIcon } from "../assets.ts";
import { Tile } from "../components/tile.tsx";
import { TileSuit } from "../../core/tile.ts";
import { globalWsHook } from "../websocket.ts";
import { SECRET } from "../global-state.ts";
import { Dice } from "../components/dice.tsx";
import clsx from "clsx";

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

export class LobbyPage extends Component("lobby-page", {
  players: prop<
    {
      id: string;
      name?: string;
      avatar: number;
      dice?: [number, number];
    }[]
  >(),
  ownPlayerId: prop<string>(),
}) {
  getAvatarUrl(avatar: number): string {
    return `./assets/avatars/${avatarList[avatar % avatarList.length]}.png`;
  }

  render() {
    const players = this.props.players;
    const ownPlayerId = this.props.ownPlayerId;
    const remotePlayers = useMemo(
      () =>
        players()?.filter((player) => player.id !== this.props.ownPlayerId()) ??
        []
    );

    const [ownAvatarIndex, setOwnAvatarIndex] = useSignal(
      Math.floor(Math.random() * avatarList.length)
    );
    const [ownName, setOwnName] = useSignal("");

    const ownDice = () =>
      players()?.find((player) => player.id === ownPlayerId())?.dice;

    const canRollInitiative = () =>
      ownName().trim() !== "" && players()?.length === 4;
    const [ready, setReady] = useSignal(ownDice() != null);

    const status = () => {
      if (ownName().trim() === "") {
        return "Enter your name…";
      } else if (players() == null || players()!.length < 4) {
        return "Waiting for players…";
      } else if (ownDice() == null) {
        return "Tap on tile to roll for initiative…";
      } else if (players()?.some((player) => player.dice == null)) {
        return "Waiting for other players to run for initiative…";
      }

      return "Starting game…";
    };

    useEffect(() => {
      if (ownPlayerId() == null) return;

      globalWsHook.send({
        lobby: {
          playerInfo: {
            secret: SECRET,
            name: ownName(),
            avatar: ownAvatarIndex(),
            ready: ready(),
          },
        },
      });
    });

    return (
      <>
        <Portal mount={document.head}>
          {avatarList.map((_, i) => (
            <link rel="prefetch" href={this.getAvatarUrl(i)} />
          ))}
        </Portal>

        <div part="players">
          <For each={remotePlayers} key={(player, i) => player?.id ?? i}>
            {(player) => (
              <PlayerAvatar
                name={() => player()?.name || "\u200b"}
                avatar={() =>
                  player()?.avatar == null
                    ? PlayerAvatar.emptyAvatar
                    : this.getAvatarUrl(player()!.avatar!)
                }
              />
            )}
          </For>

          <If condition={() => remotePlayers().length <= 0}>
            <PlayerAvatar style={{ visibility: "hidden" }} name={"\u200b"} />
          </If>
        </div>

        <div part="avatar-chooser">
          <ActionBarButton
            class={() => clsx("prev", { disabled: ready() })}
            disabled={ready}
            tooltip="Previous Avatar"
            onButtonClick={() => {
              setOwnAvatarIndex((index) =>
                ready()
                  ? index
                  : (index - 1 + avatarList.length) % avatarList.length
              );
            }}
          >
            <LeftIcon />
          </ActionBarButton>

          <PlayerAvatar avatar={() => this.getAvatarUrl(ownAvatarIndex())} />

          <ActionBarButton
            class={() => clsx("next", { disabled: ready() })}
            disabled={ready}
            tooltip="Next Avatar"
            onButtonClick={() => {
              setOwnAvatarIndex((index) =>
                ready() ? index : (index + 1) % avatarList.length
              );
            }}
          >
            <RightIcon />
          </ActionBarButton>
        </div>

        <div part="name-chooser">
          <input
            type="text"
            disabled={() => ready()}
            placeholder="Your name"
            value={ownName}
            oninput={(evt) => setOwnName(evt.currentTarget.value)}
          />
        </div>

        <div part="status">{status}</div>

        <div part="ready">
          <Tile
            class={() => clsx({ hide: ready() ? true : false })}
            animateEnter
            back={() => !canRollInitiative() && !ready()}
            suit={TileSuit.Dragon}
            rank={2}
            onclick={() => canRollInitiative() && setReady(true)}
          />
        </div>

        <div part="dice">
          <Dice face={() => ownDice()?.[0] ?? 7} />
          <Dice face={() => ownDice()?.[1] ?? 7} />
        </div>

        <Style>{css`
          @keyframes page-enter {
            from {
              opacity: 0;
              transform: translateY(1em);
            }
            to {
              transform: none;
            }
          }
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
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            overflow: auto;
            animation: 0.5s backwards page-enter;
          }

          [part="players"] {
            display: flex;
            justify-content: center;
            gap: 1em;
            margin-bottom: 1em;
          }
          @keyframes player-slide-in {
            from {
              transform: translateX(0.5em);
              opacity: 0;
            }
            to {
              transform: none;
            }
          }
          [part="players"] > * {
            animation: 0.5s backwards player-slide-in;
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
            --action-bar-icon-disabled-color: #d4ab8e;
            transition: 0.2s opacity;
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
          [part="avatar-chooser"] .prev:not(.disabled) svg {
            animation: 0.7s linear infinite alternate prev-arrow-sway;
          }
          [part="avatar-chooser"] .next:not(.disabled) svg {
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
          [part="name-chooser"] input:disabled {
            cursor: not-allowed;
          }

          [part="status"] {
            font-style: italic;
            margin-bottom: 1em;
          }

          [part="ready"] mj-tile {
            margin-bottom: 1em;
            transition: 0.2s opacity;
          }
          [part="ready"] mj-tile.hide {
            opacity: 0;
          }

          [part="dice"] {
            display: flex;
            gap: 0.5em;
          }
        `}</Style>

        <Style>{css`
          [part="ready"] mj-tile {
            cursor: ${() =>
              ready()
                ? "default"
                : canRollInitiative()
                  ? "pointer"
                  : "not-allowed"};
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", LobbyPage);
