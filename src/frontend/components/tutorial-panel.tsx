import {
  Component,
  css,
  defineComponents,
  Else,
  event,
  For,
  If,
  prop,
  Style,
  Template,
  useEffect,
  useSignal,
} from "sinho";
import { ActionBarButton } from "./action-bar.tsx";
import { CloseIcon, LeftIcon } from "../assets.ts";
import { playPopSound } from "../sounds.ts";

export class TutorialPanel extends Component("tutorial-panel", {
  content: prop<Template[]>([]),
  onFinished: event(),
}) {
  render() {
    const [currentStep, setCurrentStep] = useSignal(0);
    const maxStep = () => Math.max(this.props.content().length - 1, 1);

    let firstRender = true;
    useEffect(() => {
      if (!firstRender) throw new TypeError("Unable to mutate `content` prop");
      firstRender = false;
    }, [this.props.content]);

    return (
      <>
        <div part="header">
          <ActionBarButton
            title="Back"
            onButtonClick={() => {
              if (currentStep() === 0) {
                this.events.onFinished();
              } else {
                setCurrentStep((step) => (step === 0 ? 0 : step - 1));
              }
            }}
          >
            <If condition={() => currentStep() === 0}>
              <CloseIcon />
            </If>
            <Else>
              <LeftIcon />
            </Else>
          </ActionBarButton>

          <div
            class="progress"
            style={{
              "--progress": () => currentStep() / maxStep(),
            }}
          >
            <div></div>
          </div>
        </div>

        <div part="content">
          <For each={this.props.content}>
            {(template, i) => (
              <If condition={() => i() === currentStep()}>{template()}</If>
            )}
          </For>

          <div class="spacer"></div>
          <button
            class="next"
            onclick={(evt) => {
              evt.preventDefault();

              playPopSound();

              if (currentStep() === maxStep()) {
                this.events.onFinished();
              } else {
                setCurrentStep((step) => step + 1);
              }
            }}
          >
            <If condition={() => currentStep() < maxStep()}>Continue</If>
            <Else>Finish</Else>
          </button>
        </div>

        <Style>{css`
          @keyframes enter {
            from {
              transform: translate(-50%, -100%);
            }
          }
          @keyframes leave {
            to {
              transform: translate(-50%, -105%);
            }
          }
          :host {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: min(100dvw, 30em);
            padding-bottom: env(safe-area-inset-bottom);
            overflow: hidden;
            transform: translate(-50%, 0);
            background-color: rgba(14, 4, 2, 0.9);
            box-shadow: 0 0.5em 1em rgba(14, 4, 2, 0.5);
            animation: 1s backwards enter;
          }
          :host(.hide) {
            animation: 1s forwards leave;
          }

          [part="header"] {
            display: flex;
            align-items: center;
            gap: 1em;
            padding: 1em;
            box-shadow: 0 0.5em 1em rgba(14, 4, 2, 0.5);
            z-index: 1;
          }
          [part="header"] .progress {
            position: relative;
            flex: 1;
            border-radius: 0.5em;
            height: 1em;
            background-color: rgb(123, 77, 55);
          }
          [part="header"] .progress div {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            border-radius: 0.5em;
            width: calc(var(--progress) * 100%);
            background-color: #35de7b;
            transition: 0.2s width;
          }

          [part="content"] {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 1em;
            overflow: auto;
            z-index: 0;
          }
          [part="content"] p {
            margin: 0 0 1em;
          }
          [part="content"] table {
            margin: 0 auto 1em;
          }
          [part="content"] th {
            text-align: right;
            padding-right: 1em;
          }
          [part="content"] svg {
            height: 1em;
            margin-bottom: -0.25em;
            fill: currentColor;
            stroke: currentColor;
            stroke-width: 0;
          }
          [part="content"] mj-tile-row {
            font-size: 0.7em;
            justify-content: center;
          }

          [part="content"] .spacer {
            flex: 1;
          }
          [part="content"] .next {
            border: none;
            border-radius: 0.2em;
            padding: 0.3em 0.5em;
            background-color: #11a923;
            box-shadow: 0 0.2em 0 #077714;
            font: var(--app-font);
            font-size: 1em;
            font-style: italic;
            color: #eee;
            cursor: pointer;
            touch-action: manipulation;
            transition:
              0.2s background-color,
              0.2s box-shadow;
          }
          [part="content"] .next:active {
            background-color: #078307;
            box-shadow: 0 0.2em 0 #015a01;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TutorialPanel);
