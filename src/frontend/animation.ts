import { MaybeSignal, Signal, useSignal } from "sinho";

export function useInProgress(): [
  inProgress: Signal<boolean>,
  start: (wait: Promise<void> | number) => Promise<void>,
] {
  const [inProgress, setInProgress] = useSignal(false);

  return [
    inProgress,
    async (wait) => {
      setInProgress(true);

      if (typeof wait === "number") {
        await new Promise((resolve) => setTimeout(resolve, wait));
      } else {
        await wait;
      }

      setInProgress(false);
    },
  ];
}

export function useTransition(
  element: MaybeSignal<HTMLElement | undefined>
): [inProgress: Signal<boolean>, start: () => Promise<void>] {
  const [inProgress, start] = useInProgress();
  return [
    inProgress,
    async () => {
      const el = MaybeSignal.get(element);

      if (el != null) {
        await start(transitionEndOf(el));
      }
    },
  ];
}

export function useAnimation(
  element: MaybeSignal<HTMLElement | undefined>
): [inProgress: Signal<boolean>, start: () => Promise<void>] {
  const [inProgress, start] = useInProgress();
  return [
    inProgress,
    async () => {
      const el = MaybeSignal.get(element);

      if (el != null) {
        await start(animationEndOf(el));
      }
    },
  ];
}

export async function transitionEndOf(element: HTMLElement): Promise<void> {
  await new Promise((resolve) => {
    element.addEventListener("transitionend", resolve, { once: true });
  });
}

export async function animationEndOf(element: HTMLElement): Promise<void> {
  await new Promise((resolve) => {
    element.addEventListener("animationend", resolve, { once: true });
  });
}
