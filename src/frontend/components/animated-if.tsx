import {
  Children,
  If,
  MaybeSignal,
  SignalLike,
  useEffect,
  useSignal,
} from "sinho";
import { delay } from "../animation.ts";

export function AnimatedIf<T extends {} | null>(props: {
  hideDelay?: number;
  value?: MaybeSignal<T | undefined>;
  children?: (
    value: SignalLike<T | undefined>,
    leave: SignalLike<boolean>
  ) => Children;
}) {
  const valueRaw = MaybeSignal.upgrade(props.value ?? undefined);
  const [show, setShow] = useSignal(valueRaw() !== undefined);
  const [value, setValue] = useSignal(valueRaw());

  useEffect(() => {
    let cancelled = false;

    if (valueRaw() !== undefined) {
      setValue(() => valueRaw());
      setShow(true);
    } else {
      delay(props.hideDelay ?? 0).then(() => {
        if (cancelled) return;
        setShow(false);
      });
    }

    return () => (cancelled = true);
  });

  return (
    <If condition={show}>
      {props.children?.(value, () => valueRaw() === undefined)}
    </If>
  );
}
