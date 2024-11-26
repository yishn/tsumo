import { Component, Style, css, defineComponents, prop } from "sinho";
import { Tile } from "../components/tile.tsx";
import { ErrorIcon, ReloadIcon } from "../assets.ts";
import { ActionBarButton } from "../components/action-bar.tsx";

export class ErrorPage extends Component("error-page", {
  message: prop<string>("", { attribute: String }),
}) {
  render() {
    return (
      <>
        <Tile custom animateEnter>
          <ErrorIcon fill="var(--tile-red)" />
        </Tile>

        <h1>Error</h1>
        <p part="message">{this.props.message}</p>

        <ActionBarButton
          tooltip="Reload"
          onButtonClick={() => window.location.reload()}
        >
          <ReloadIcon />
        </ActionBarButton>

        <Style>{css`
          * {
            margin: 0;
            padding: 0;
          }

          @keyframes page-enter {
            from {
              opacity: 0;
            }
          }
          :host {
            --action-bar-icon-color: rgb(255, 211, 163);
            --action-bar-icon-disabled-color: rgb(255, 211, 163, 0.5);
            display: flex;
            flex-direction: column;
            align-items: safe center;
            padding-top: 4em;
            padding-bottom: 4em;
            background: linear-gradient(
              to bottom,
              transparent,
              rgba(0, 0, 0, 0.2) 5em
            );
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            overflow: auto;
            animation: 1s backwards page-enter;
          }

          h1 {
            margin-top: 1em;
            font-size: 2em;
            font-style: italic;
            font-weight: normal;
          }

          [part="message"] {
            margin-bottom: 1em;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", ErrorPage);
