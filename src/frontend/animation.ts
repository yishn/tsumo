import { Signal, useSignal } from "sinho";
import confetti from "canvas-confetti";

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

export function sakuraBlossoms(): () => void {
  let stop = false;
  let skew = 1;

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const frame = () => {
    skew = Math.max(0.8, skew - 0.001);

    confetti({
      particleCount: 1,
      startVelocity: 0,
      origin: {
        x: Math.random(),
        y: Math.random() * skew - 0.2,
      },
      colors: ["#e05d91"],
      shapes: ["circle"],
      gravity: randomInRange(0.4, 0.6),
      scalar: randomInRange(0.4, 1),
      drift: randomInRange(-0.4, 0.4),
    });

    if (!stop) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  return () => (stop = true);
}
