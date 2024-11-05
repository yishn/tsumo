import { Signal, useSignal } from "sinho";
import confetti from "canvas-confetti";

export function easeOutCubic(t: number): number {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

export function useInProgress(): [
  inProgress: Signal<boolean>,
  start: (wait: Promise<void> | number) => Promise<void>,
] {
  const [inProgress, setInProgress] = useSignal(false);
  let id = 0;

  return [
    inProgress,
    async (wait) => {
      const currentId = ++id;
      setInProgress(true);

      if (typeof wait === "number") {
        await delay(wait);
      } else {
        await wait;
      }

      if (id === currentId) {
        setInProgress(false);
      }
    },
  ];
}

export async function delay(timeout: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

export function useTransition(
  transition: (t: number) => number = (t) => t
): [
  progress: Signal<number>,
  inProgress: Signal<boolean>,
  start: (duration: number) => void,
  stop: () => void,
] {
  const [inProgress, setInProgress] = useSignal(true);
  const [progress, setProgress] = useSignal(0);
  let id = 0;

  const frame = (currentId: number, startTime: number, duration: number) => {
    const progress = transition(
      Math.max(Math.min((Date.now() - startTime) / duration, 1), 0)
    );

    setProgress(progress);
    if (progress >= 1) setInProgress(false);

    if (inProgress() && id === currentId) {
      requestAnimationFrame(() => frame(currentId, startTime, duration));
    }
  };

  return [
    progress,
    inProgress,
    (duration) => {
      const currentId = ++id;
      requestAnimationFrame(() => frame(currentId, Date.now(), duration));
    },
    () => setInProgress(false),
  ];
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
