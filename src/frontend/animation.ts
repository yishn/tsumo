import { Signal, useSignal } from "sinho";

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
