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
import { PlayerAvatar } from "../components/player-avatar.tsx";
import { ActionBarButton } from "../components/action-bar.tsx";
import {
  LeftIcon,
  RightIcon,
  SubmitIcon,
  avatarList,
  getAvatarUrl,
} from "../assets.ts";
import { Tile } from "../components/tile.tsx";
import { TileSuit } from "../../core/tile.ts";
import { SECRET, SESSION, webSocketHook } from "../global-state.ts";
import clsx from "clsx";

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
    const [ready, setReady] = useSignal(ownDice() != null);

    useEffect(() => {
      if (ownPlayerId() == null) return;

      webSocketHook.sendMessage({
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

    const canRollInitiative = () =>
      ownName().trim() !== "" && players()?.length === 4;

    const everyoneReady = () =>
      players()?.length === 4 &&
      !!players()?.every((player) => player.dice != null);

    const startPlayerId = () =>
      !everyoneReady()
        ? undefined
        : players()?.reduce((startPlayer, player) => {
            if (player.dice == null) return startPlayer;
            if (startPlayer.dice == null) return player;
            if (
              player.dice.reduce((sum, n) => sum + n) >
              startPlayer.dice.reduce((sum, n) => sum + n)
            )
              return player;

            return startPlayer;
          });

    const [countdown, setCountdown] = useSignal(3);

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      if (everyoneReady() && countdown() > 0) {
        timeoutId = setTimeout(() => {
          setCountdown((n) => n - 1);
        }, 1000);
      }

      return () => {
        clearTimeout(timeoutId);
      };
    });

    const status = () => {
      if (ownName().trim() === "") {
        return "Enter your name…";
      } else if (players() == null || players()!.length < 4) {
        return "Waiting for players…";
      } else if (ownDice() == null) {
        return "Tap on tile to roll for initiative…";
      } else if (!everyoneReady()) {
        return "Waiting for other players to roll for initiative…";
      } else if (countdown() > 0) {
        return `Starting game in ${countdown()}…`;
      }

      return `Starting game now…`;
    };

    const [justCopiedInviteLink, setJustCopiedInviteLink] = useSignal(false);

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      if (justCopiedInviteLink()) {
        timeoutId = setTimeout(() => {
          setJustCopiedInviteLink(false);
        }, 1000);
      }

      return () => {
        clearTimeout(timeoutId);
      };
    });

    return (
      <>
        <div part="players">
          <For each={remotePlayers} key={(player, i) => player?.id ?? i}>
            {(player) => (
              <PlayerAvatar
                name={() => player()?.name || "\u200b"}
                current={() => player().id === startPlayerId()?.id}
                avatar={() =>
                  player()?.avatar == null
                    ? PlayerAvatar.emptyAvatar
                    : getAvatarUrl(player()!.avatar!)
                }
                dice={() => player()?.dice}
              />
            )}
          </For>

          <If condition={() => remotePlayers().length < 3}>
            <PlayerAvatar
              class="invite"
              name={"\u200b"}
              avatar={() =>
                !justCopiedInviteLink()
                  ? "./assets/icons/invite.svg"
                  : "./assets/icons/clipboard.svg"
              }
              title="Copy invitation link"
              onAvatarClick={() => {
                navigator.clipboard.writeText(
                  new URL(
                    "?" +
                      new URLSearchParams({
                        session: SESSION ?? "",
                      }).toString(),
                    location.href
                  ).toString()
                );

                setJustCopiedInviteLink(true);
              }}
            />
          </If>
        </div>

        <div part="avatar-chooser">
          <ActionBarButton
            class={() => clsx("prev", { disabled: ready() })}
            disabled={ready}
            tooltip="Previous avatar"
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

          <PlayerAvatar
            avatar={() => getAvatarUrl(ownAvatarIndex())}
            current={() => ownPlayerId() === startPlayerId()?.id}
            sound
            dice={ownDice}
          />

          <ActionBarButton
            class={() => clsx("next", { disabled: ready() })}
            disabled={ready}
            tooltip="Next avatar"
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
            onkeypress={(evt) => {
              if (evt.key === "Enter") {
                canRollInitiative() && setReady(true);
              }
            }}
          />
        </div>

        <div part="status">{status}</div>

        <div part="ready">
          <Tile
            class={() => clsx({ hide: ready() ? true : false })}
            custom
            animateEnter
            sounds={() => canRollInitiative() || ready()}
            back={() => !canRollInitiative() && !ready()}
            suit={TileSuit.Dragon}
            rank={2}
            onclick={() => canRollInitiative() && setReady(true)}
          >
            <SubmitIcon fill="#12bb25" />
          </Tile>
        </div>

        <Style>{css`
          :host {
            --action-bar-icon-color: rgb(255, 211, 163);
            --action-bar-icon-disabled-color: rgba(255, 211, 163, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: safe center;
            align-items: safe center;
            gap: 0.5em;
            padding: 0.5em 0;
            padding-bottom: env(safe-area-inset-bottom);
            overflow: auto;
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
          }
          :host::before {
            content: "";
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            background: linear-gradient(
              to bottom,
              transparent,
              rgba(0, 0, 0, 0.2) 5em
            );
            z-index: -1;
          }

          [part="players"] {
            display: flex;
            justify-content: safe center;
            gap: 1em;
            margin-bottom: 1em;
          }
          @keyframes player-slide-in {
            from {
              transform: translateX(0.5em);
              opacity: 0;
            }
          }
          [part="players"] > * {
            animation: 0.5s backwards player-slide-in;
          }
          [part="players"] ::part(avatar) {
            font-size: 1.2em;
          }
          [part="players"] .invite::part(avatar) {
            background-size: 33% 33%;
            cursor: pointer;
          }

          [part="avatar-chooser"] {
            --player-avatar-size: 12em;
            display: flex;
            justify-content: safe center;
            align-items: safe center;
            gap: 0.5em;
          }
          [part="avatar-chooser"] .prev,
          [part="avatar-chooser"] .next {
            transition: opacity 0.2s;
          }
          @keyframes prev-arrow-sway {
            to {
              transform: translateX(-0.5em);
            }
          }
          @keyframes next-arrow-sway {
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

          [part="name-chooser"] input {
            box-sizing: border-box;
            width: 6em;
            border: none;
            margin-bottom: 1em;
            background-color: rgba(0, 0, 0, 0.7);
            font: 1.5em var(--app-kaiti-font-stack);
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
            transition: opacity 0.2s;
          }
          [part="ready"] mj-tile.hide {
            opacity: 0;
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
