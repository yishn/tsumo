import {
  Component,
  ElseIf,
  If,
  Style,
  css,
  defineComponents,
  useEffect,
  useSignal,
} from "sinho";
import { GamePage } from "./pages/game-page.tsx";
import { LobbyPage } from "./pages/lobby-page.tsx";
import { useServerSignal } from "./server-signal.ts";
import { globalWsHook } from "./websocket.ts";
import { SESSION, setSecret } from "./global-state.ts";

export class AppComponent extends Component("app") {
  render() {
    const mode = useServerSignal((msg) => msg.mode);

    const players = useServerSignal((msg) => msg.players);
    const [ownPlayerId, setOwnPlayerId] = useSignal<string>();

    useEffect(() => {
      if (globalWsHook.connected()) {
        globalWsHook.send({
          join: {
            session: SESSION!, // TODO
          },
        });
      }
    }, [globalWsHook.connected]);

    globalWsHook.onMessage(
      (msg) => msg.joined,
      (data) => {
        setSecret(data.secret);
        setOwnPlayerId(data.id);
      }
    );

    return (
      <>
        <If condition={() => mode() === "lobby"}>
          <LobbyPage prop:players={players} prop:ownPlayerId={ownPlayerId} />
        </If>
        <ElseIf condition={() => mode() === "game"}>
          <GamePage />
        </ElseIf>

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            --kaiti-font-stack: "Alegreya", "KaiTi", "Kaiti TC", serif;
            --heiti-font-stack: "Alegreya", "YaHei", "Heiti TC", serif;
            width: 100dvw;
            height: 100dvh;
            color-scheme: dark;
            background:
              linear-gradient(to bottom, #714634, transparent 5em),
              url("./assets/img/bg.jpg") center / cover no-repeat fixed #714634;
            padding-top: env(safe-area-inset-top);
            overflow: hidden;
            font: 1.2em var(--heiti-font-stack);
            cursor: default;
            user-select: none;
            -webkit-user-select: none;
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
