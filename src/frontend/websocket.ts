import { MaybeSignal, Signal, useEffect, useSignal } from "sinho";
import { ClientMessage, ServerMessage } from "../shared/message.ts";

export interface WebSocketHook<T, U> {
  connected: Signal<boolean>;
  error: Signal<Event | undefined>;
  onMessage(handler: (data: T) => void): void;
  send(data: U): void;
  close(): void;
}

export function useWebSocket<T, U>(
  url: MaybeSignal<string | URL>
): WebSocketHook<T, U> {
  let socket: WebSocket;
  const onMessageHandlers: ((data: T) => void)[] = [];
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
      onMessageHandlers.forEach((handler) => handler(JSON.parse(evt.data)));
    });

    return () => {
      socket.close();
    };
  });

  return {
    connected,
    error,
    onMessage: (handler) => onMessageHandlers.push(handler),
    send: (data) => socket.send(JSON.stringify(data)),
    close: () => socket.close(),
  };
}

export const globalWsHook = useWebSocket<ServerMessage, ClientMessage>(
  "ws://localhost:8080" // TODO
);

let heartbeatId = 0;
let heartbeatTimeout: NodeJS.Timeout | number | undefined;

const sendHeartbeat = () => {
  globalWsHook.send({
    heartbeat: {
      id: heartbeatId++,
      now: Date.now(),
    },
  });

  clearTimeout(heartbeatTimeout);
  heartbeatTimeout = setTimeout(() => {
    globalWsHook.close();
  }, 20000);

  setTimeout(sendHeartbeat, 25000);
};

globalWsHook.onMessage((data) => {
  if (data.heartbeat != null) {
    clearTimeout(heartbeatTimeout);
  }
});

useEffect(() => {
  if (globalWsHook.connected()) {
    sendHeartbeat();
  }
});
