import {
  Component,
  ElseIf,
  If,
  Style,
  css,
  defineComponents,
  useSignal,
} from "sinho";
import { GamePage } from "./pages/game-page.tsx";
import { LobbyPage } from "./pages/lobby-page.tsx";

export class AppComponent extends Component("app") {
  render() {
    const [page, setPage] = useSignal<"lobby" | "game">("game");

    return (
      <>
        <If condition={() => page() === "lobby"}>
          <LobbyPage />
        </If>
        <ElseIf condition={() => page() === "game"}>
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
