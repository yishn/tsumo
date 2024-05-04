import { Signal, useBatch, useSignal } from "sinho";

export function useAnimation(
  duration: number
): [inProgress: Signal<boolean>, start: () => Promise<void>] {
  const [inProgress, setInProgress] = useSignal(false);

  return [
    inProgress,
    async () => {
      useBatch(() => setInProgress(true));
      debugger;
      await new Promise((resolve) => setTimeout(resolve, duration));
      useBatch(() => setInProgress(false));
    },
  ];
}
