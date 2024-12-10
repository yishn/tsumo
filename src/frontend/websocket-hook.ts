import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";

export interface WebSocketHook<T, U> {
  connected: Signal<boolean>;
  error: Signal<Event | Error | undefined>;

  useServerSignal: <V>(path: (msg: T) => V) => Signal<V | undefined>;

  onServerMessage: <V>(
    path: (msg: T) => V,
    handler: (data: Exclude<V, undefined>) => void
  ) => () => void;

  sendMessage: (data: U) => void;

  close: () => void;
}

export function useWebSocket<T, U>(
  url: MaybeSignal<string | URL>
): WebSocketHook<T, U> {
  let socket: WebSocket;
  const handlers: Set<{
    path: (msg: T) => any;
    handler: (data: any) => void;
  }> = new Set();
  const [connected, setConnected] = useSignal(false);
  const [error, setError] = useSignal<Event | Error>();

  function connect() {
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

    socket.addEventListener("message", (evt) => {
      const data = JSON.parse(evt.data);

      for (const { path, handler } of handlers) {
        const value = path(data);

        if (value !== undefined) {
          handler(value);
        }
      }
    });

    return socket;
  }

  useEffect(() => {
    try {
      socket = connect();
    } catch (err) {
      setError(err as Error);
    }

    return () => {
      socket.close();
    };
  });

  const result: WebSocketHook<T, U> = {
    connected,
    error,
    useServerSignal: <V>(path: (msg: T) => V) => {
      const [signal, setSignal] = useSignal<V | undefined>();

      useEffect(() =>
        result.onServerMessage(path, (data) => {
          setSignal(() => data);
        })
      );

      return signal;
    },
    onServerMessage: (path, handler) => {
      const entry = { path, handler };
      handlers.add(entry);
      return () => handlers.delete(entry);
    },
    sendMessage: (data) => {
      if (connected()) {
        socket.send(JSON.stringify(data));
      }
    },
    close: () => {
      socket.close();
    },
  };

  return result;
}
