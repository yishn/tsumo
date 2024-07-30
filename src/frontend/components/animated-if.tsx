import {
  Children,
  FunctionalComponent,
  If,
  MaybeSignal,
  SignalLike,
  useEffect,
  useSignal,
} from "sinho";
import { delay } from "../animation";

export const AnimatedIf: FunctionalComponent<{
  condition?: MaybeSignal<boolean>;
  hideDelay?: MaybeSignal<number>;
  children?: (condition: SignalLike<boolean>) => Children;
}> = (props) => {
  const condition = MaybeSignal.upgrade(props.condition ?? false);
  const [show, setShow] = useSignal(condition());

  useEffect(() => {
    let cancelled = false;

    if (condition()) {
      setShow(true);
    } else {
      delay(MaybeSignal.peek(props.hideDelay ?? 0)).then(() => {
        if (cancelled) return;
        setShow(false);
      });
    }

    return () => (cancelled = true);
  });

  return <If condition={show}>{props.children?.(condition)}</If>;
};
