import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";

export interface WebSocketHook {
  connected: Signal<boolean>;
  error: Signal<Event | undefined>;
}

export function useWebSocket<T>(
  url: MaybeSignal<string | URL>,
  onMessage: (evt: MessageEvent<T>) => void = () => {}
): WebSocketHook {
  const [connected, setConnected] = useSignal(false);
  const [error, setError] = useSignal<Event>();

  useEffect(() => {
    const socket = new WebSocket(MaybeSignal.get(url));

    socket.addEventListener("open", () => {
      setConnected(true);
      setError(undefined);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("error", (evt) => {
      setError(evt);
    });

    socket.addEventListener("message", onMessage);

    return () => {
      socket.close();
    };
  });

  return {
    connected,
    error,
  };
}

export function useJSONWebSocket<T>(
  url: MaybeSignal<string | URL>,
  onMessage: (data: T) => void = () => {}
): WebSocketHook {
  return useWebSocket<string>(url, (evt) => {
    onMessage(JSON.parse(evt.data));
  });
}
