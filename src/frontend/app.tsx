import {
  Component,
  ElseIf,
  If,
  Portal,
  Signal,
  Style,
  css,
  defineComponents,
  useEffect,
  useSignal,
} from "sinho";
import { GamePage } from "./pages/game-page.tsx";
import { LobbyPage } from "./pages/lobby-page.tsx";
import {
  SECRET,
  SERVER,
  SESSION,
  setSecret,
  webSocketHook,
} from "./global-state.ts";
import { avatarList, getAvatarUrl } from "./assets.ts";
import { ErrorPage } from "./pages/error-page.tsx";

function useHeartbeat(): void {
  let heartbeatTimeout: ReturnType<typeof setTimeout> | undefined;

  webSocketHook.onServerMessage(
    (msg) => msg,
    (msg) => {
      if (webSocketHook.connected()) {
        clearTimeout(heartbeatTimeout);

        if (msg.heartbeat != null) {
          webSocketHook.sendMessage({
            heartbeat: {
              id: msg.heartbeat.id,
              now: Date.now(),
            },
          });
        }

        heartbeatTimeout = setTimeout(() => {
          console.warn("[WebSocket] Server not responsive");
          webSocketHook.close();
        }, 30000);
      }
    }
  );

  useEffect(() => {
    if (!webSocketHook.connected()) {
      clearTimeout(heartbeatTimeout);
    }
  });

  useEffect(() => () => clearTimeout(heartbeatTimeout));
}

function useError(): Signal<Error | undefined> {
  const [error, setError] = useSignal<Error>();

  useEffect(() => {
    if (!SERVER) {
      setError(
        (err) =>
          err ?? {
            name: "WebSocketError",
            message: "Server not configured",
          }
      );
    } else if (webSocketHook.error() != null) {
      console.error("[WebSocket]", webSocketHook.error());
      setError(
        (err) =>
          err ?? {
            name: "WebSocketError",
            message: "Web socket failure",
          }
      );
    }
  });

  let connected = false;

  useEffect(() => {
    if (webSocketHook.connected()) {
      connected = true;
    }

    if (connected && !webSocketHook.connected()) {
      setError(
        (err) =>
          err ?? {
            name: "WebSocketError",
            message: "Web socket disconnected",
          }
      );
    }
  });

  webSocketHook.onServerMessage(
    (msg) => msg.error,
    (data) => {
      setError(
        (err) =>
          err ?? {
            name: "ServerError",
            message: data.message,
          }
      );
    }
  );

  return error;
}

export class AppComponent extends Component("app") {
  render() {
    useHeartbeat();

    const error = useError();
    const [ownPlayerId, setOwnPlayerId] = useSignal<string>();

    const mode = webSocketHook.useServerSignal((msg) => msg.mode);
    const players = webSocketHook.useServerSignal((msg) => msg.players);
    const deadPlayers = webSocketHook.useServerSignal((msg) => msg.deadPlayers);
    const gameInfo = webSocketHook.useServerSignal((msg) => msg.game?.info);
    const gamePlayersInfo = webSocketHook.useServerSignal(
      (msg) => msg.game?.players
    );
    const ownPlayerInfo = webSocketHook.useServerSignal(
      (msg) => msg.game?.player
    );
    const scoreInfo = webSocketHook.useServerSignal((msg) => msg.game?.score);
    const endInfo = webSocketHook.useServerSignal((msg) => msg.game?.end);

    useEffect(() => {
      if (webSocketHook.connected()) {
        webSocketHook.sendMessage({
          join: {
            session: SESSION,
            secret: SECRET,
          },
        });
      }
    }, [webSocketHook.connected]);

    webSocketHook.onServerMessage(
      (msg) => msg.joined,
      (data) => {
        setSecret(data.secret);
        setOwnPlayerId(data.id);
      }
    );

    return (
      <>
        <Portal mount={document.head}>
          <link rel="prefetch" href="./assets/img/sparrow.png" />
          {avatarList.map((_, i) => (
            <link rel="prefetch" href={getAvatarUrl(i)} />
          ))}
        </Portal>

        <If condition={() => !!error()}>
          <ErrorPage message={() => error()?.message ?? "Unknown error"} />
        </If>
        <ElseIf condition={() => mode() === "lobby"}>
          <LobbyPage players={players} ownPlayerId={ownPlayerId} />
        </ElseIf>
        <ElseIf condition={() => mode() === "game"}>
          <GamePage
            players={() => players() ?? []}
            ownPlayerId={ownPlayerId}
            deadPlayers={() => deadPlayers() ?? []}
            gameInfo={gameInfo}
            gamePlayersInfo={gamePlayersInfo}
            ownPlayerInfo={ownPlayerInfo}
            scoreInfo={() => scoreInfo() ?? undefined}
            endInfo={() => endInfo() ?? undefined}
          />
        </ElseIf>

        <Style light>{css`
          @font-face {
            font-family: "Alegreya";
            src: url("./assets/font/alegreya/Alegreya-VariableFont_wght.ttf");
          }

          @font-face {
            font-family: "Alegreya";
            font-style: italic;
            src: url("./assets/font/alegreya/Alegreya-Italic-VariableFont_wght.ttf");
          }

          * {
            margin: 0;
            padding: 0;
          }

          html {
            --app-kaiti-font-stack: "Alegreya", "KaiTi", "Kaiti TC", serif;
            --app-background: linear-gradient(
                to bottom,
                #714634,
                transparent 5em
              ),
              url("./assets/img/bg.jpg") center / cover no-repeat fixed #714634;
            width: 100dvw;
            height: 100dvh;
            color-scheme: dark;
            background: var(--app-background);
            padding-top: env(safe-area-inset-top);
            overflow: hidden;
            font: 1.2em var(--app-kaiti-font-stack);
            color: #eee;
            cursor: default;
            -webkit-user-select: none;
            user-select: none;
            -webkit-user-drag: none;
            white-space: nowrap;
          }
        `}</Style>

        <Style>{css`
          :host {
            position: absolute;
            top: 0;
            left: 0;
            width: 100dvw;
            height: 100dvh;
            display: flex;
            align-items: stretch;
          }

          :host > * {
            flex: 1;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
