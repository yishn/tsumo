import { Component, Style, css, defineComponents } from "sinho";
import { PlayerRowComponent } from "./components/player-row.tsx";

export class AppComponent extends Component("app") {
  render() {
    return (
      <>
        <div part="players">
          <PlayerRowComponent
            name="East"
            avatar="./assets/avatars/monkey.png"
          />
          <PlayerRowComponent name="South" avatar="./assets/avatars/boar.png" />
          <PlayerRowComponent
            name="West"
            avatar="./assets/avatars/dog.png"
          />
          <PlayerRowComponent
            name="North"
            avatar="./assets/avatars/dragon.png"
          />
        </div>

        <Style light>{css`
          ${() => ""}
          @import url("https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap");

          * {
            margin: 0;
            padding: 0;
          }

          html {
            background: url("./assets/bg.jpg") center / cover no-repeat fixed;
          }

          body {
            font-family: "Alegreya", "KaiTi", serif;
            background-color: rgba(0, 0, 0, 0.2);
            height: 100vh;
            overflow: hidden;
            cursor: default;
            user-select: none;
          }
        `}</Style>

        <Style>{css`
          [part="players"] {
            display: flex;
            flex-direction: column;
            gap: .2em;
            margin-top: 3em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", AppComponent);
