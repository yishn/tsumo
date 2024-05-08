import { useSignal, Signal, useEffect } from "sinho";
import { globalWsHook } from "./websocket.ts";
import { ServerMessage } from "../shared/message.ts";

export function useServerSignal<T>(
  path: (msg: ServerMessage) => T
): Signal<T | undefined> {
  const [signal, setSignal] = useSignal<T | undefined>();

  useEffect(() =>
    globalWsHook.onMessage(path, (data) => {
      setSignal(() => data);
    })
  );

  return signal;
}
