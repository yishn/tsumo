import {
  Component,
  ElseIf,
  If,
  Portal,
  Style,
  css,
  defineComponents,
  useEffect,
  useSignal,
} from "sinho";
import { GamePage } from "./pages/game-page.tsx";
import { LobbyPage } from "./pages/lobby-page.tsx";
import { SECRET, SESSION, setSecret, webSocketHook } from "./global-state.ts";
import { avatarList, getAvatarUrl } from "./assets.ts";

export class AppComponent extends Component("app") {
  render() {
    const mode = webSocketHook.useServerSignal((msg) => msg.mode);

    const players = webSocketHook.useServerSignal((msg) => msg.players);
    const [ownPlayerId, setOwnPlayerId] = useSignal<string>();

    useEffect(() => {
      if (webSocketHook.connected()) {
        webSocketHook.sendMessage({
          join: {
            session: SESSION!, // TODO
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

        <If condition={() => mode() === "lobby"}>
          <LobbyPage players={players} ownPlayerId={ownPlayerId} />
        </If>
        <ElseIf condition={() => mode() === "game"}>
          <GamePage />
        </ElseIf>

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");
          @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;1,900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            --app-kaiti-font-stack: "Alegreya", "KaiTi", "Kaiti TC", serif;
            --app-heiti-font-stack: "Alegreya", "YaHei", "Heiti TC", serif;
            --app-sansserif-font-stack: "Poppins", "YaHei", "Heiti TC", serif;
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
            font: 1.2em var(--app-heiti-font-stack);
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
