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
  useRef,
  useSignal,
} from "sinho";
import clsx from "clsx";
import { PlayerAvatar } from "../components/player-avatar.tsx";
import { ActionBarButton } from "../components/action-bar.tsx";
import {
  HelpIcon,
  LeftIcon,
  RightIcon,
  SettingsIcon,
  SubmitIcon,
  avatarList,
  getAvatarUrl,
} from "../assets.ts";
import { Tile } from "../components/tile.tsx";
import { TileSuit } from "../../core/tile.ts";
import { SECRET, SESSION, webSocketHook } from "../global-state.ts";
import { LocalStorage } from "../local-storage.ts";
import { TutorialPanel } from "../components/tutorial-panel.tsx";
import { AnimatedIf } from "../components/animated-if.tsx";
import { Button, ButtonList } from "../components/button.tsx";
import { DrawerDialog } from "../components/drawer-dialog.tsx";
import TutorialPage1 from "../tutorial/tiles.tsx";
import TutorialPage2 from "../tutorial/pairs-and-sets.tsx";
import TutorialPage3 from "../tutorial/winning-hands.tsx";
import TutorialPage4 from "../tutorial/joker.tsx";
import TutorialPage5 from "../tutorial/game-flow.tsx";
import { uuid } from "../../shared/utils.ts";
import { FormRow } from "../components/form-row.tsx";

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

    const [ownAvatarIndex, setOwnAvatarIndex] = useSignal(LocalStorage.avatar);
    const [ownName, setOwnName] = useSignal(LocalStorage.name);
    const [showTutorial, setShowTutorial] = useSignal(false);

    useEffect(() => {
      LocalStorage.avatar = ownAvatarIndex();
    });

    useEffect(() => {
      LocalStorage.name = ownName();
    });

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

    const [showJoinDialog, setShowJoinDialog] = useSignal(false);
    const [joinSessionId, setJoinSessionId] = useSignal("");
    const joinSessionIdInput = useRef<HTMLInputElement>();

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      if (showJoinDialog()) {
        setJoinSessionId("");

        timeoutId = setTimeout(() => {
          joinSessionIdInput()?.focus();
        }, DrawerDialog.showTransitionDuration);
      }

      return () => clearTimeout(timeoutId);
    });

    const [showSettingsDialog, setShowSettingsDialog] = useSignal(false);

    return (
      <>
        <div class="content">
          <div class="spacer"></div>

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
                title="Copy Table Identifier"
                onAvatarClick={() => {
                  navigator.clipboard.writeText(SESSION);

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

          <div
            part="ready"
            class={() => clsx({ hide: ready() ? true : false })}
          >
            <ActionBarButton
              disabled={ready}
              tooltip="Game Settings"
              onButtonClick={() => setShowSettingsDialog(true)}
            >
              <SettingsIcon />
            </ActionBarButton>

            <Tile
              title="Ready"
              custom
              sounds={() => canRollInitiative() || ready()}
              back={() => !canRollInitiative() && !ready()}
              suit={TileSuit.Dragon}
              rank={2}
              onclick={() => canRollInitiative() && setReady(true)}
            >
              <SubmitIcon fill="#12bb25" />
            </Tile>

            <ActionBarButton
              disabled={ready}
              tooltip="How To Play"
              onButtonClick={() => setShowTutorial(true)}
            >
              <HelpIcon />
            </ActionBarButton>
          </div>

          <div class="spacer"></div>

          <Button part="join" onclick={() => setShowJoinDialog(true)}>
            Join Another Table
          </Button>
        </div>

        <AnimatedIf
          value={() => (showTutorial() ? {} : undefined)}
          hideDelay={TutorialPanel.leaveAnimationDuration}
        >
          {(_, hide) => (
            <TutorialPanel
              class={() => clsx({ hide: hide() })}
              content={[
                <TutorialPage1 />,
                <TutorialPage2 />,
                <TutorialPage3 />,
                <TutorialPage4 />,
                <TutorialPage5 />,
              ]}
              onFinished={() => setShowTutorial(false)}
            />
          )}
        </AnimatedIf>

        <DrawerDialog
          show={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
        >
          <FormRow label="Rotations"></FormRow>
          <FormRow label="Reaction Duration"></FormRow>

          <ButtonList>
            <Button onclick={() => setShowSettingsDialog(false)}>Close</Button>
          </ButtonList>
        </DrawerDialog>

        <DrawerDialog
          show={showJoinDialog}
          onClose={() => setShowJoinDialog(false)}
        >
          <form
            class="inner"
            onsubmit={(evt) => {
              evt.preventDefault();

              if (joinSessionId().trim() === "") return;

              window.location.href =
                "?" +
                new URLSearchParams({
                  session: joinSessionId(),
                }).toString();
            }}
          >
            <input
              ref={joinSessionIdInput}
              type="text"
              placeholder="Table Identifier"
              value={joinSessionId}
              maxLength={50}
              oninput={(evt) => setJoinSessionId(evt.currentTarget.value)}
            />
            <ButtonList>
              <Button
                primary
                disabled={() => joinSessionId().trim() === ""}
                onclick={(evt) =>
                  (
                    evt.currentTarget.parentElement!
                      .parentElement as HTMLFormElement
                  ).requestSubmit()
                }
              >
                Join
              </Button>
              <Button
                onclick={() => {
                  window.location.href =
                    "?" +
                    new URLSearchParams({
                      session: uuid(),
                    }).toString();
                }}
              >
                New Table
              </Button>
            </ButtonList>
          </form>
        </DrawerDialog>

        <Style>{css`
          @keyframes enter {
            from {
              opacity: 0;
            }
          }
          :host {
            --action-bar-icon-color: rgb(255, 211, 163);
            --action-bar-icon-disabled-color: rgba(255, 211, 163, 0.5);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            background: linear-gradient(
              to bottom,
              var(--app-theme-color),
              rgba(0, 0, 0, 0.2) 5em
            );
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            animation: 1s backwards enter;
          }

          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: safe center;
            padding: 1em;
            padding-bottom: max(1em, env(safe-area-inset-bottom));
            overflow: auto;
          }
          .content .spacer {
            flex: 1;
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
            --player-avatar-size: 10em;
            display: flex;
            justify-content: safe center;
            align-items: safe center;
            gap: 0.5em;
            margin-bottom: 0.5em;
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

          input {
            box-sizing: border-box;
            border: none;
            border-radius: 0.3em;
            padding: 0 0.5em;
            background-color: rgba(0, 0, 0, 0.7);
            font: 1em/1.5 var(--app-kaiti-font-stack);
          }
          input:disabled {
            cursor: not-allowed;
          }
          [part="name-chooser"] input {
            width: 6em;
            margin-bottom: .7em;
            font-size: 1.5em;
            text-align: center;
          }

          [part="status"] {
            font-style: italic;
            margin-bottom: 1em;
          }

          [part="ready"] {
            display: flex;
            align-items: center;
            gap: 1em;
            transition: opacity 0.2s;
            padding-bottom: 1em;
          }
          [part="ready"].hide {
            opacity: 0;
          }

          [part="join"] {
            align-self: center;
            width: 100%;
            max-width: 20em;
          }

          mj-drawer-dialog .inner {
            display: flex;
            flex-direction: column;
            justify-content: stretch;
          }
          mj-drawer-dialog input {
            background-color: rgba(255, 255, 255, 0.2);
          }
          mj-drawer-dialog mj-button-list {
            margin-top: 1em;
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
