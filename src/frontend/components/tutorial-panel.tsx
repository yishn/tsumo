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
import { Button } from "./button.tsx";

export class TutorialPanel extends Component("tutorial-panel", {
  content: prop<Template[]>([]),
  onFinished: event(),
}) {
  static enterAnimationDuration = 300;
  static leaveAnimationDuration = 300;

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
          <Button
            class="next"
            primary
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
          </Button>
        </div>

        <Style>{css`
          @keyframes enter {
            from {
              opacity: 0;
              transform: translate(-50%, 0) scale(0.8);
            }
          }
          @keyframes leave {
            to {
              opacity: 0;
              transform: translate(-50%, 0) scale(0.8);
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
            overflow: hidden;
            transform: translate(-50%, 0);
            background-color: rgba(14, 4, 2, 0.9);
            box-shadow: 0 0.5em 1em rgba(14, 4, 2, 0.5);
            animation: ${TutorialPanel.enterAnimationDuration}ms backwards enter;
          }
          :host(.hide) {
            animation: ${TutorialPanel.leaveAnimationDuration}ms forwards leave;
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
            background-color: var(--app-theme-color);
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
            padding-bottom: max(1em, env(safe-area-inset-bottom));
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
          [part="content"] .nb {
            display: inline-block;
          }
          [part="content"] .spacer {
            flex: 1;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TutorialPanel);
