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
        await delay(wait);
      } else {
        await wait;
      }

      setInProgress(false);
    },
  ];
}

export async function delay(timeout: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}
