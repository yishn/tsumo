import { Component, Style, css, defineComponents } from "sinho";
import { GamePage } from "./pages/game-page.tsx";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <GamePage />

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            color-scheme: dark;
            background: url("./assets/bg.jpg") center / cover no-repeat fixed;
            padding-top: env(safe-area-inset-top);
            overflow: hidden;
            font-family: "Alegreya", "KaiTi", serif;
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
