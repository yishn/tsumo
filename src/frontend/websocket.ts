import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";
import { ClientMessage, ServerMessage } from "../shared/message.ts";

export interface WebSocketHook<T> {
  connected: Signal<boolean>;
  error: Signal<Event | undefined>;
  onMessage(handler: (evt: MessageEvent<T>) => void): void;
  send(data: T): void;
}

export function useWebSocket<
  T extends string | ArrayBufferLike | Blob | ArrayBufferView,
>(url: MaybeSignal<string | URL>): WebSocketHook<T> {
  let socket: WebSocket;
  const onMessageHandlers: ((evt: MessageEvent<T>) => void)[] = [];
  const [connected, setConnected] = useSignal(false);
  const [error, setError] = useSignal<Event>();

  useEffect(() => {
    socket = new WebSocket(MaybeSignal.get(url));

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
      onMessageHandlers.forEach((handler) => handler(evt));
    });

    return () => {
      socket.close();
    };
  });

  return {
    connected,
    error,
    onMessage(handler) {
      onMessageHandlers.push(handler);
    },
    send(data) {
      socket.send(data);
    },
  };
}

export interface JSONWebSocketHook<T, U> {
  connected: Signal<boolean>;
  error: Signal<Event | undefined>;
  onMessage(handler: (data: T) => void): void;
  send(data: U): void;
}

export function useJSONWebSocket<T, U>(
  url: MaybeSignal<string | URL>
): JSONWebSocketHook<T, U> {
  const hook = useWebSocket<string>(url);

  return {
    connected: hook.connected,
    error: hook.error,
    onMessage(handler) {
      hook.onMessage((evt) => handler(JSON.parse(evt.data)));
    },
    send(data) {
      hook.send(JSON.stringify(data));
    },
  };
}

export const globalWsHook = useJSONWebSocket<ServerMessage, ClientMessage>(
  "ws://localhost:8080" // TODO
);
