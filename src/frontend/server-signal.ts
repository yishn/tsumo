import { useSignal, Signal, useEffect } from "sinho";
import { messageHandler } from "./message-handler.ts";
import { ServerMessage } from "../shared/message.ts";

export function useServerSignal<T>(
  path: (msg: ServerMessage) => T
): Signal<T | undefined> {
  const [signal, setSignal] = useSignal<T | undefined>();

  useEffect(() =>
    messageHandler.onMessage(path, (data) => {
      setSignal(() => data);
    })
  );

  return signal;
}
