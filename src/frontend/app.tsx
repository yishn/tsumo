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
    const [page, setPage] = useSignal<"lobby" | "game">("lobby");

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
            color-scheme: dark;
            background: url("./assets/img/bg.jpg") center / cover no-repeat
              fixed;
            padding-top: env(safe-area-inset-top);
            overflow: hidden;
            font-family: var(--heiti-font-stack);
            font-size: 1.2em;
            cursor: default;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
            white-space: nowrap;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
