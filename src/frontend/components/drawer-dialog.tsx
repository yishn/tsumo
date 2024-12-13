import clsx from "clsx";
import { Component, css, defineComponents, event, prop, Style } from "sinho";
import { AnimatedIf } from "./animated-if.tsx";

export class DrawerDialog extends Component("drawer-dialog", {
  show: prop<boolean>(false, { attribute: () => true }),
  onClose: event(),
}) {
  static showTransitionDuration = 300;

  render() {
    return (
      <>
        <AnimatedIf
          value={() => (this.props.show() ? true : undefined)}
          hideDelay={DrawerDialog.showTransitionDuration}
        >
          {(_, leave) => (
            <>
              <div
                class={() => clsx("backdrop", { leave: leave() })}
                onclick={() => this.events.onClose()}
              ></div>

              <div class={() => clsx("drawer", { leave: leave() })}>
                <slot></slot>
              </div>
            </>
          )}
        </AnimatedIf>

        <Style>{css`
          @keyframes enter-backdrop {
            from {
              opacity: 0;
            }
          }
          @keyframes leave-backdrop {
            to {
              opacity: 0;
            }
          }
          .backdrop {
            position: fixed;
            inset: 0;
            background: linear-gradient(
              to bottom,
              transparent,
              rgba(0, 0, 0, 0.3) 50%
            );
            z-index: 99;
            animation: ${DrawerDialog.showTransitionDuration}ms backwards
              enter-backdrop;
          }
          .backdrop.leave {
            animation: ${DrawerDialog.showTransitionDuration}ms backwards
              leave-backdrop;
          }

          @keyframes enter-drawer {
            from {
              transform: translate(-50%, 100%);
            }
          }
          @keyframes leave-drawer {
            to {
              transform: translate(-50%, 100%);
            }
          }
          .drawer {
            box-sizing: border-box;
            position: fixed;
            left: 50%;
            bottom: 0;
            border-radius: 2em 2em 0 0;
            width: min(30em, 100dvw);
            background-color: rgba(0, 0, 0, 0.9);
            padding: 1em;
            padding-bottom: max(1em, env(safe-area-inset-bottom));
            -webkit-backdrop-filter: blur(0.5em);
            backdrop-filter: blur(0.5em);
            box-shadow: 0 -0.5em 1em rgba(14, 4, 2, 0.5);
            transform: translate(-50%, 0);
            animation: ${DrawerDialog.showTransitionDuration}ms backwards
              enter-drawer;
            z-index: 100;
          }
          .drawer.leave {
            animation: ${DrawerDialog.showTransitionDuration}ms forwards
              leave-drawer;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", DrawerDialog);
